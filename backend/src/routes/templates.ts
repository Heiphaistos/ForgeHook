import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const tplSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  payload: z.object({}).passthrough(),
  category: z.string().default('general'),
  preview_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#5865F2'),
})

export const templateRoutes = new Hono()
templateRoutes.use('*', requireAuth)

templateRoutes.get('/', (c) => {
  return c.json(getDb().prepare('SELECT * FROM templates ORDER BY favorited DESC, category, name').all())
})

templateRoutes.patch('/:id/favorite', (c) => {
  const id = Number(c.req.param('id'))
  const t = getDb().prepare('SELECT favorited FROM templates WHERE id=?').get(id) as any
  if (!t) return c.json({ error: 'Not found' }, 404)
  const newVal = t.favorited ? 0 : 1
  getDb().prepare('UPDATE templates SET favorited=? WHERE id=?').run(newVal, id)
  return c.json({ ok: true, favorited: newVal === 1 })
})

templateRoutes.post('/', async (c) => {
  const body = tplSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare(
    'INSERT INTO templates (name, description, payload, category, preview_color) VALUES (?,?,?,?,?)'
  ).run(body.data.name, body.data.description ?? null, JSON.stringify(body.data.payload), body.data.category, body.data.preview_color)
  return c.json({ id: result.lastInsertRowid }, 201)
})

templateRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = tplSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  getDb().prepare('UPDATE templates SET name=?, description=?, payload=?, category=?, preview_color=? WHERE id=?')
    .run(body.data.name, body.data.description ?? null, JSON.stringify(body.data.payload), body.data.category, body.data.preview_color, id)
  return c.json({ ok: true })
})

templateRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM templates WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})
