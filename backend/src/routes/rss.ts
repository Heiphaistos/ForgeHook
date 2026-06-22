import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const feedSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  webhook_id: z.number().int().positive(),
  check_interval: z.number().int().min(60).default(3600),
  template: z.string().optional(),
  enabled: z.boolean().default(true),
})

export const rssRoutes = new Hono()
rssRoutes.use('*', requireAuth)

rssRoutes.get('/', (c) => c.json(
  getDb().prepare('SELECT id, name, url, webhook_id, check_interval, last_checked, enabled FROM rss_feeds ORDER BY name').all()
))

rssRoutes.post('/', async (c) => {
  const body = feedSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare('INSERT INTO rss_feeds (name, url, webhook_id, check_interval, template, enabled) VALUES (?,?,?,?,?,?)')
    .run(body.data.name, body.data.url, body.data.webhook_id, body.data.check_interval, body.data.template ?? null, body.data.enabled ? 1 : 0)
  return c.json({ id: result.lastInsertRowid }, 201)
})

rssRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = feedSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  getDb().prepare('UPDATE rss_feeds SET name=?, url=?, webhook_id=?, check_interval=?, template=?, enabled=? WHERE id=?')
    .run(body.data.name, body.data.url, body.data.webhook_id, body.data.check_interval, body.data.template ?? null, body.data.enabled ? 1 : 0, id)
  return c.json({ ok: true })
})

rssRoutes.patch('/:id/toggle', (c) => {
  const id = Number(c.req.param('id'))
  const feed = getDb().prepare('SELECT enabled FROM rss_feeds WHERE id=?').get(id) as any
  if (!feed) return c.json({ error: 'Not found' }, 404)
  getDb().prepare('UPDATE rss_feeds SET enabled=? WHERE id=?').run(feed.enabled ? 0 : 1, id)
  return c.json({ ok: true })
})

rssRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM rss_feeds WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})
