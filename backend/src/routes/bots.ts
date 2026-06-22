import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const botSchema = z.object({
  name: z.string().min(1).max(100),
  token: z.string().min(10),
  channel_id: z.string().optional(),
})

const sendBotSchema = z.object({
  bot_id: z.number(),
  channel_id: z.string().min(1),
  payload: z.object({}).passthrough(),
})

export const botRoutes = new Hono()
botRoutes.use('*', requireAuth)

botRoutes.get('/', (c) => {
  const rows = getDb().prepare('SELECT id, name, channel_id, created_at FROM bots ORDER BY name').all()
  return c.json(rows)
})

botRoutes.post('/', async (c) => {
  const body = botSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare('INSERT INTO bots (name, token, channel_id) VALUES (?,?,?)').run(body.data.name, body.data.token, body.data.channel_id ?? null)
  return c.json({ id: result.lastInsertRowid }, 201)
})

botRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = botSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  getDb().prepare('UPDATE bots SET name=?, token=?, channel_id=? WHERE id=?').run(body.data.name, body.data.token, body.data.channel_id ?? null, id)
  return c.json({ ok: true })
})

botRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM bots WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})

botRoutes.post('/send', async (c) => {
  const body = sendBotSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const bot = getDb().prepare('SELECT * FROM bots WHERE id=?').get(body.data.bot_id) as any
  if (!bot) return c.json({ error: 'Bot not found' }, 404)
  const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(body.data.channel_id)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${bot.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body.data.payload),
    signal: AbortSignal.timeout(10_000),
  })
  if (res.ok) return c.json({ ok: true })
  const err = await res.text()
  return c.json({ ok: false, error: err }, 422)
})

botRoutes.get('/:id/info', async (c) => {
  const bot = getDb().prepare('SELECT * FROM bots WHERE id=?').get(Number(c.req.param('id'))) as any
  if (!bot) return c.json({ error: 'Not found' }, 404)
  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bot ${bot.token}` },
    signal: AbortSignal.timeout(5_000),
  })
  if (!res.ok) return c.json({ error: 'Invalid token or Discord error' }, 422)
  const data = await res.json() as any
  return c.json({ username: data.username, id: data.id, avatar: data.avatar })
})
