import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const blockSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'video', 'embed', 'separator', 'code', 'callout']),
  content: z.any(),
})

const tutorialSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  blocks: z.array(blockSchema),
  published: z.union([z.boolean(), z.number()]).transform(v => !!v).default(false),
  category: z.string().max(100).optional().default(''),
  tags: z.string().max(500).optional().default(''),
})

export const tutorialRoutes = new Hono()
tutorialRoutes.use('*', requireAuth)

tutorialRoutes.get('/', (c) =>
  c.json(getDb().prepare('SELECT id, title, description, category, tags, published, created_at FROM tutorials ORDER BY created_at DESC').all())
)

tutorialRoutes.get('/:id', (c) => {
  const t = getDb().prepare('SELECT * FROM tutorials WHERE id=?').get(Number(c.req.param('id'))) as any
  if (!t) return c.json({ error: 'Not found' }, 404)
  return c.json({ ...t, blocks: JSON.parse(t.blocks) })
})

tutorialRoutes.post('/', async (c) => {
  const body = tutorialSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare('INSERT INTO tutorials (title, description, blocks, published, category, tags) VALUES (?,?,?,?,?,?)')
    .run(body.data.title, body.data.description ?? null, JSON.stringify(body.data.blocks), body.data.published ? 1 : 0, body.data.category, body.data.tags)
  return c.json({ id: result.lastInsertRowid }, 201)
})

tutorialRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = tutorialSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const changes = getDb().prepare(
    `UPDATE tutorials SET title=?, description=?, blocks=?, published=?, category=?, tags=?, updated_at=datetime('now') WHERE id=?`
  ).run(body.data.title, body.data.description ?? null, JSON.stringify(body.data.blocks), body.data.published ? 1 : 0, body.data.category, body.data.tags, id).changes
  if (!changes) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

tutorialRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM tutorials WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})
