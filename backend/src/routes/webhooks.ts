import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { checkAllWebhooks } from '../services/monitor.js'
import { z } from 'zod'

const webhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().refine(u => u.startsWith('https://discord.com/api/webhooks/') || u.startsWith('https://discordapp.com/api/webhooks/'), 'Must be a Discord webhook URL'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  username: z.string().max(80).optional(),
  category: z.string().max(50).default('default'),
})

export const webhookRoutes = new Hono()
webhookRoutes.use('*', requireAuth)

webhookRoutes.get('/', (c) => {
  const rows = getDb().prepare(
    `SELECT w.*,
      COUNT(h.id) as send_count,
      MAX(h.sent_at) as last_sent,
      SUM(CASE WHEN h.status < 400 THEN 1 ELSE 0 END) as success_count
     FROM webhooks w
     LEFT JOIN history h ON h.webhook_id = w.id
     GROUP BY w.id
     ORDER BY w.category, w.name`
  ).all()
  return c.json(rows)
})

// Vérifier la santé de tous les webhooks maintenant (bouton "Vérifier" dans l'UI)
webhookRoutes.post('/check', async (c) => {
  const summary = await checkAllWebhooks()
  return c.json(summary)
})

webhookRoutes.post('/', async (c) => {
  const body = webhookSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare(
    'INSERT INTO webhooks (name, url, avatar_url, username, category) VALUES (?,?,?,?,?)'
  ).run(body.data.name, body.data.url, body.data.avatar_url || null, body.data.username || null, body.data.category)
  return c.json({ id: result.lastInsertRowid }, 201)
})

webhookRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = webhookSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const changes = getDb().prepare(
    'UPDATE webhooks SET name=?, url=?, avatar_url=?, username=?, category=? WHERE id=?'
  ).run(body.data.name, body.data.url, body.data.avatar_url || null, body.data.username || null, body.data.category, id).changes
  if (!changes) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

webhookRoutes.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  getDb().prepare('DELETE FROM webhooks WHERE id=?').run(id)
  return c.json({ ok: true })
})
