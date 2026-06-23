import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { checkFeed } from '../services/rss.js'
import { z } from 'zod'

const SSRF_BLOCK = /^(localhost|127\.\d+\.\d+\.\d+|::1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|fd[0-9a-f]{2}:|fc[0-9a-f]{2}:)$/i

function isSafeUrl(raw: string): boolean {
  try {
    const { protocol, hostname } = new URL(raw)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    return !SSRF_BLOCK.test(hostname)
  } catch {
    return false
  }
}

const feedSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().refine(isSafeUrl, 'URL non autorisée (IP privée ou protocole invalide)'),
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

rssRoutes.post('/:id/trigger', async (c) => {
  const id = Number(c.req.param('id'))
  const feed = getDb().prepare('SELECT * FROM rss_feeds WHERE id=?').get(id) as any
  if (!feed) return c.json({ error: 'Not found' }, 404)
  await checkFeed(feed)
  return c.json({ ok: true })
})

rssRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM rss_feeds WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})
