import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
const { hash, compare } = bcrypt
import jwt from 'jsonwebtoken'
const { sign } = jwt
import { getDb } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import { generateTotpSecret, verifyTotp, buildOtpAuthUri } from '../utils/totp.js'
import { z } from 'zod'

const loginSchema = z.object({ password: z.string().min(8), code: z.string().optional() })
const setupSchema = z.object({ password: z.string().min(8) })

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000  // 15 min
const BLOCK_MS  = 60 * 60 * 1000  // 1 h
interface RateEntry { count: number; firstAt: number; blockedUntil?: number }
const loginAttempts = new Map<string, RateEntry>()

function checkRateLimit(ip: string): { blocked: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry) return { blocked: false }
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { blocked: true, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) }
  }
  if (now - entry.firstAt > WINDOW_MS) {
    loginAttempts.delete(ip)
    return { blocked: false }
  }
  return { blocked: false }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAt: now })
    return
  }
  entry.count++
  if (entry.count >= MAX_ATTEMPTS) entry.blockedUntil = now + BLOCK_MS
  loginAttempts.set(ip, entry)
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

export const authRoutes = new Hono()

authRoutes.get('/status', (c) => {
  const db = getDb()
  const user = db.prepare('SELECT id FROM users LIMIT 1').get()
  return c.json({ configured: !!user })
})

authRoutes.post('/setup', async (c) => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get()
  if (existing) return c.json({ error: 'Already configured' }, 400)
  const body = setupSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: 'Password must be at least 8 characters' }, 400)
  const hash_val = await hash(body.data.password, 12)
  db.prepare('INSERT INTO users (password_hash) VALUES (?)').run(hash_val)
  return c.json({ ok: true })
})

authRoutes.post('/login', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? c.req.header('x-real-ip') ?? 'unknown'
  const rl = checkRateLimit(ip)
  if (rl.blocked) {
    return c.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfter}s.` }, 429)
  }

  const body = loginSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: 'Invalid input' }, 400)
  const db = getDb()
  const user = db.prepare('SELECT * FROM users LIMIT 1').get() as
    | { id: number; password_hash: string; totp_secret: string | null; totp_enabled: number }
    | undefined
  if (!user) return c.json({ error: 'App not configured' }, 400)
  const valid = await compare(body.data.password, user.password_hash)
  if (!valid) {
    recordFailedAttempt(ip)
    return c.json({ error: 'Wrong password' }, 401)
  }

  // Second facteur TOTP si activé
  if (user.totp_enabled && user.totp_secret) {
    if (!body.data.code) {
      // Mot de passe correct mais code manquant → demander le 2FA (ne compte pas comme échec)
      return c.json({ error: '2FA requis', needs2fa: true }, 401)
    }
    if (!verifyTotp(user.totp_secret, body.data.code)) {
      recordFailedAttempt(ip)
      return c.json({ error: 'Code 2FA invalide', needs2fa: true }, 401)
    }
  }

  clearAttempts(ip)
  const token = sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })
  return c.json({ token })
})

// ---- 2FA (TOTP) management (routes authentifiées) ----

// État du 2FA pour l'admin connecté
authRoutes.get('/2fa/status', requireAuth, (c) => {
  const user = getDb().prepare('SELECT totp_enabled FROM users LIMIT 1').get() as { totp_enabled: number } | undefined
  return c.json({ enabled: !!user?.totp_enabled })
})

// Démarrer l'enrôlement : génère un secret (non encore activé) + URI otpauth pour QR
authRoutes.post('/2fa/setup', requireAuth, (c) => {
  const db = getDb()
  const user = db.prepare('SELECT id, totp_enabled FROM users LIMIT 1').get() as { id: number; totp_enabled: number } | undefined
  if (!user) return c.json({ error: 'App not configured' }, 400)
  if (user.totp_enabled) return c.json({ error: '2FA déjà activé' }, 400)
  const secret = generateTotpSecret()
  db.prepare('UPDATE users SET totp_secret=?, totp_enabled=0 WHERE id=?').run(secret, user.id)
  return c.json({ secret, otpauth_uri: buildOtpAuthUri(secret, 'admin') })
})

const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/) })

// Confirmer l'enrôlement en validant un premier code
authRoutes.post('/2fa/enable', requireAuth, async (c) => {
  const body = codeSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: 'Code à 6 chiffres requis' }, 400)
  const db = getDb()
  const user = db.prepare('SELECT id, totp_secret, totp_enabled FROM users LIMIT 1').get() as
    | { id: number; totp_secret: string | null; totp_enabled: number } | undefined
  if (!user?.totp_secret) return c.json({ error: 'Aucun enrôlement en cours — appelez /2fa/setup' }, 400)
  if (user.totp_enabled) return c.json({ error: '2FA déjà activé' }, 400)
  if (!verifyTotp(user.totp_secret, body.data.code)) return c.json({ error: 'Code invalide' }, 400)
  db.prepare('UPDATE users SET totp_enabled=1 WHERE id=?').run(user.id)
  return c.json({ ok: true })
})

const disableSchema = z.object({ password: z.string().min(8), code: z.string().regex(/^\d{6}$/) })

// Désactiver le 2FA (exige mot de passe + code valide)
authRoutes.post('/2fa/disable', requireAuth, async (c) => {
  const body = disableSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: 'Mot de passe et code requis' }, 400)
  const db = getDb()
  const user = db.prepare('SELECT id, password_hash, totp_secret, totp_enabled FROM users LIMIT 1').get() as
    | { id: number; password_hash: string; totp_secret: string | null; totp_enabled: number } | undefined
  if (!user?.totp_enabled || !user.totp_secret) return c.json({ error: '2FA non activé' }, 400)
  if (!(await compare(body.data.password, user.password_hash))) return c.json({ error: 'Mot de passe incorrect' }, 401)
  if (!verifyTotp(user.totp_secret, body.data.code)) return c.json({ error: 'Code invalide' }, 400)
  db.prepare('UPDATE users SET totp_enabled=0, totp_secret=NULL WHERE id=?').run(user.id)
  return c.json({ ok: true })
})
