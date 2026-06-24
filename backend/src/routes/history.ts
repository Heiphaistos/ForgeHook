import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { sendWebhook } from '../services/discord.js'

export const historyRoutes = new Hono()
historyRoutes.use('*', requireAuth)

historyRoutes.get('/stats', (c) => {
  const db = getDb()
  const total = (db.prepare('SELECT COUNT(*) as n FROM history').get() as any).n
  const success = (db.prepare('SELECT COUNT(*) as n FROM history WHERE status < 400').get() as any).n
  const errors = total - success
  const byDay = db.prepare(
    `SELECT date(sent_at) as day, COUNT(*) as n FROM history
     WHERE sent_at >= date('now', '-7 days')
     GROUP BY day ORDER BY day`
  ).all()
  const topWebhooks = db.prepare(
    `SELECT webhook_name, COUNT(*) as n FROM history
     WHERE webhook_name IS NOT NULL
     GROUP BY webhook_name ORDER BY n DESC LIMIT 5`
  ).all()
  return c.json({ total, success, errors, byDay, topWebhooks })
})

historyRoutes.get('/export.csv', (c) => {
  const rows = getDb().prepare(
    'SELECT id, webhook_name, status, error, sent_at, send_type FROM history ORDER BY sent_at DESC'
  ).all() as any[]
  const escape = (s: string | null) => `"${(s ?? '').replace(/"/g, '""')}"`
  const lines = ['id,webhook_name,status,error,sent_at,send_type']
  rows.forEach(r => lines.push(`${r.id},${escape(r.webhook_name)},${r.status},${escape(r.error)},${r.sent_at},${r.send_type ?? 'webhook'}`))
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="forgehook-history.csv"',
    },
  })
})

historyRoutes.get('/', (c) => {
  const { q, status, from, to } = c.req.query()
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)

  const conditions: string[] = ['1=1']
  const params: (string | number)[] = []

  if (q) {
    conditions.push('(webhook_name LIKE ? OR payload LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }
  if (status === 'ok') conditions.push('status < 400')
  else if (status === 'error') conditions.push('status >= 400')
  if (from) { conditions.push('sent_at >= ?'); params.push(from) }
  if (to) { conditions.push('sent_at <= ?'); params.push(to) }

  const where = conditions.join(' AND ')
  const rows = getDb().prepare(
    `SELECT * FROM history WHERE ${where} ORDER BY sent_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset)
  return c.json(rows)
})

historyRoutes.post('/:id/resend', async (c) => {
  const h = getDb().prepare('SELECT * FROM history WHERE id=?').get(Number(c.req.param('id'))) as any
  if (!h) return c.json({ error: 'Not found' }, 404)
  if (!h.webhook_id) return c.json({ error: 'Re-send uniquement disponible pour les messages webhook' }, 422)
  const webhook = getDb().prepare('SELECT * FROM webhooks WHERE id=?').get(h.webhook_id) as any
  if (!webhook) return c.json({ error: 'Webhook introuvable' }, 404)
  const result = await sendWebhook(webhook.url, JSON.parse(h.payload))
  getDb().prepare('INSERT INTO history (webhook_id, webhook_name, payload, status, error, message_id) VALUES (?,?,?,?,?,?)')
    .run(webhook.id, webhook.name, h.payload, result.status, result.error ?? null, result.message_id ?? null)
  return c.json(result, result.ok ? 200 : 422)
})

historyRoutes.delete('/bulk', async (c) => {
  const body = await c.req.json() as { ids: number[] }
  if (!Array.isArray(body.ids) || body.ids.length === 0) return c.json({ error: 'ids required' }, 400)
  const placeholders = body.ids.map(() => '?').join(',')
  const result = getDb().prepare(`DELETE FROM history WHERE id IN (${placeholders})`).run(...body.ids)
  return c.json({ ok: true, deleted: result.changes })
})

historyRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM history WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})

historyRoutes.delete('/', (c) => {
  getDb().prepare('DELETE FROM history').run()
  return c.json({ ok: true })
})
