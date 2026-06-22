import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const botSchema = z.object({
  name: z.string().min(1).max(100),
  token: z.string().min(10),
  channel_id: z.string().optional(),
})
const botUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  token: z.string().min(10).optional().or(z.literal('')),
  channel_id: z.string().optional(),
})

const sendBotSchema = z.object({
  bot_id: z.number(),
  channel_id: z.string().min(1),
  payload: z.object({}).passthrough(),
})

export const botRoutes = new Hono()
botRoutes.use('*', requireAuth)

function getBot(id: number) {
  return getDb().prepare('SELECT * FROM bots WHERE id=?').get(id) as
    | { id: number; name: string; token: string; channel_id: string | null }
    | undefined
}

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
  const body = botUpdateSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  if (body.data.token && body.data.token.length >= 10) {
    getDb().prepare('UPDATE bots SET name=?, token=?, channel_id=? WHERE id=?').run(body.data.name, body.data.token, body.data.channel_id ?? null, id)
  } else {
    getDb().prepare('UPDATE bots SET name=?, channel_id=? WHERE id=?').run(body.data.name, body.data.channel_id ?? null, id)
  }
  return c.json({ ok: true })
})

botRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM bots WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})

botRoutes.post('/send', async (c) => {
  const body = sendBotSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const bot = getBot(body.data.bot_id)
  if (!bot) return c.json({ error: 'Bot not found' }, 404)
  const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(body.data.channel_id)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${bot.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body.data.payload),
    signal: AbortSignal.timeout(10_000),
  })
  const err = res.ok ? null : await res.text()
  getDb().prepare(
    'INSERT INTO history (webhook_id, webhook_name, payload, status, error, bot_id, channel_id, send_type) VALUES (?,?,?,?,?,?,?,?)'
  ).run(null, `Bot: ${bot.name}`, JSON.stringify(body.data.payload), res.status, err, body.data.bot_id, body.data.channel_id, 'bot')
  if (res.ok) return c.json({ ok: true })
  return c.json({ ok: false, error: err }, 422)
})

botRoutes.get('/:id/info', async (c) => {
  const bot = getBot(Number(c.req.param('id')))
  if (!bot) return c.json({ error: 'Not found' }, 404)
  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bot ${bot.token}` },
    signal: AbortSignal.timeout(5_000),
  })
  if (!res.ok) return c.json({ error: 'Invalid token or Discord error' }, 422)
  const data = await res.json() as any
  return c.json({ username: data.username, id: data.id, avatar: data.avatar, discriminator: data.discriminator })
})

botRoutes.get('/:id/guilds', async (c) => {
  const bot = getBot(Number(c.req.param('id')))
  if (!bot) return c.json({ error: 'Not found' }, 404)
  const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bot ${bot.token}` },
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) return c.json({ error: 'Discord API error', detail: await res.text() }, 422)
  const guilds = await res.json() as any[]
  return c.json(guilds.map(g => ({ id: g.id, name: g.name, icon: g.icon, owner: g.owner })))
})

botRoutes.get('/discord-bot/status', async (c) => {
  const url = process.env.BOT_DISCORD_URL
  const secret = process.env.BOT_DISCORD_SECRET
  if (!url || !secret) return c.json({ online: false, error: 'BOT_DISCORD_URL ou BOT_DISCORD_SECRET non configurés' }, 503)
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/internal/status`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return c.json({ online: false, error: `HTTP ${res.status}` }, 502)
    return c.json(await res.json())
  } catch (e: any) {
    return c.json({ online: false, error: e?.message ?? 'Timeout ou connexion refusée' }, 502)
  }
})

botRoutes.get('/:id/guilds/:guildId/channels', async (c) => {
  const bot = getBot(Number(c.req.param('id')))
  if (!bot) return c.json({ error: 'Not found' }, 404)
  const guildId = c.req.param('guildId')
  const res = await fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/channels`, {
    headers: { Authorization: `Bot ${bot.token}` },
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) return c.json({ error: 'Discord API error', detail: await res.text() }, 422)
  const channels = await res.json() as any[]
  return c.json(
    channels
      .filter(ch => [0, 4, 5, 15].includes(ch.type))
      .sort((a: any, b: any) => a.position - b.position)
      .map((ch: any) => ({ id: ch.id, name: ch.name, type: ch.type, parent_id: ch.parent_id ?? null, position: ch.position }))
  )
})
