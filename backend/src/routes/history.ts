import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'

export const historyRoutes = new Hono()
historyRoutes.use('*', requireAuth)

historyRoutes.get('/', (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)
  const webhookId = c.req.query('webhook_id')
  const query = webhookId
    ? 'SELECT * FROM history WHERE webhook_id=? ORDER BY sent_at DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM history ORDER BY sent_at DESC LIMIT ? OFFSET ?'
  const rows = webhookId
    ? getDb().prepare(query).all(webhookId, limit, offset)
    : getDb().prepare(query).all(limit, offset)
  return c.json(rows)
})

historyRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM history WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})

historyRoutes.delete('/', (c) => {
  getDb().prepare('DELETE FROM history').run()
  return c.json({ ok: true })
})
