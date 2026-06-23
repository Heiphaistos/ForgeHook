import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
const { hash, compare } = bcrypt
import jwt from 'jsonwebtoken'
const { sign } = jwt
import { getDb } from '../db/index.js'
import { z } from 'zod'

const loginSchema = z.object({ password: z.string().min(8) })
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
  const user = db.prepare('SELECT * FROM users LIMIT 1').get() as { id: number; password_hash: string } | undefined
  if (!user) return c.json({ error: 'App not configured' }, 400)
  const valid = await compare(body.data.password, user.password_hash)
  if (!valid) {
    recordFailedAttempt(ip)
    return c.json({ error: 'Wrong password' }, 401)
  }
  clearAttempts(ip)
  const token = sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })
  return c.json({ token })
})
