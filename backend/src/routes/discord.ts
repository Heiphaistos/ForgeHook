import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { sendWebhook, editWebhookMessage, type DiscordPayload } from '../services/discord.js'
import { z } from 'zod'

const sendSchema = z.object({
  webhook_id: z.number().int().positive(),
  payload: z.object({}).passthrough(),
  thread_id: z.string().optional(),
})

export const discordRoutes = new Hono()
discordRoutes.use('*', requireAuth)

discordRoutes.post('/send', async (c) => {
  const body = sendSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const db = getDb()
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(body.data.webhook_id) as any
  if (!webhook) return c.json({ error: 'Webhook not found' }, 404)

  const payload = body.data.payload as DiscordPayload
  if (webhook.username && !payload.username) payload.username = webhook.username
  if (webhook.avatar_url && !payload.avatar_url) payload.avatar_url = webhook.avatar_url
  if (Array.isArray(payload.embeds) && payload.embeds.length > 10) {
    return c.json({ error: `Trop d'embeds (${payload.embeds.length}) — maximum 10 par message Discord.` }, 400)
  }

  const result = await sendWebhook(webhook.url, payload, body.data.thread_id)
  db.prepare('INSERT INTO history (webhook_id, webhook_name, payload, status, error, message_id) VALUES (?,?,?,?,?,?)')
    .run(webhook.id, webhook.name, JSON.stringify(payload), result.status, result.error ?? null, result.message_id ?? null)
  return c.json(result, result.ok ? 200 : 422)
})

const editSchema = z.object({
  content: z.string().max(2000).optional(),
  embeds: z.array(z.object({}).passthrough()).max(10).optional(),
})

discordRoutes.patch('/messages/:webhookId/:messageId', async (c) => {
  const webhookId = Number(c.req.param('webhookId'))
  const messageId = c.req.param('messageId')
  if (!/^\d{1,25}$/.test(messageId)) return c.json({ error: 'Invalid message id' }, 400)
  const db = getDb()
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(webhookId) as any
  if (!webhook) return c.json({ error: 'Webhook not found' }, 404)
  const body = editSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = await editWebhookMessage(webhook.url, messageId, body.data)
  if (!result.ok) return c.json({ error: result.error }, 422)
  return c.json({ ok: true })
})

discordRoutes.delete('/messages/:webhookId/:messageId', async (c) => {
  const webhookId = Number(c.req.param('webhookId'))
  const messageId = c.req.param('messageId')
  // messageId est un snowflake Discord (numérique) — rejeter tout ce qui pourrait
  // altérer le chemin de l'URL (path injection) avant l'interpolation.
  if (!/^\d{1,25}$/.test(messageId)) return c.json({ error: 'Invalid message id' }, 400)
  const db = getDb()
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(webhookId) as any
  if (!webhook) return c.json({ error: 'Webhook not found' }, 404)
  const res = await fetch(`${webhook.url}/messages/${messageId}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok && res.status !== 204) return c.json({ error: `Discord error ${res.status}` }, 422)
  return c.json({ ok: true })
})

discordRoutes.post('/test/:webhookId', async (c) => {
  const webhookId = Number(c.req.param('webhookId'))
  const db = getDb()
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(webhookId) as any
  if (!webhook) return c.json({ error: 'Not found' }, 404)
  const result = await sendWebhook(webhook.url, {
    username: 'ForgeHook',
    embeds: [{
      title: '✅ Connexion confirmée',
      description: `**${webhook.name}** est bien connecté à ForgeHook.`,
      color: 0x57f287,
      footer: { text: 'ForgeHook • forgehook.heiphaistos.org' },
      timestamp: new Date().toISOString(),
    }],
  })
  return c.json(result)
})
