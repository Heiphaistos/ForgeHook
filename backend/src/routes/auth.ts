import { Hono } from 'hono'
import { hash, compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const loginSchema = z.object({ password: z.string().min(8) })
const setupSchema = z.object({ password: z.string().min(8) })

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
  const body = loginSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: 'Invalid input' }, 400)
  const db = getDb()
  const user = db.prepare('SELECT * FROM users LIMIT 1').get() as { id: number; password_hash: string } | undefined
  if (!user) return c.json({ error: 'App not configured — run /api/auth/setup first' }, 400)
  const valid = await compare(body.data.password, user.password_hash)
  if (!valid) return c.json({ error: 'Wrong password' }, 401)
  const token = sign({ id: user.id }, process.env.JWT_SECRET ?? 'changeme', { expiresIn: '7d' })
  return c.json({ token })
})
