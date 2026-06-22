import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'
import cron from 'node-cron'
import { reloadJob, runJobNow } from '../services/scheduler.js'

const jobSchema = z.object({
  name: z.string().min(1),
  webhook_id: z.number().int().positive(),
  payload: z.object({}).passthrough(),
  cron_expr: z.string().refine(v => cron.validate(v), 'Invalid cron expression'),
  enabled: z.boolean().default(true),
})

export const schedulerRoutes = new Hono()
schedulerRoutes.use('*', requireAuth)

schedulerRoutes.get('/', (c) => c.json(getDb().prepare('SELECT * FROM scheduled_jobs ORDER BY name').all()))

schedulerRoutes.post('/', async (c) => {
  const body = jobSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare('INSERT INTO scheduled_jobs (name, webhook_id, payload, cron_expr, enabled) VALUES (?,?,?,?,?)')
    .run(body.data.name, body.data.webhook_id, JSON.stringify(body.data.payload), body.data.cron_expr, body.data.enabled ? 1 : 0)
  const id = Number(result.lastInsertRowid)
  reloadJob(id)
  return c.json({ id }, 201)
})

schedulerRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = jobSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const existing = getDb().prepare('SELECT id FROM scheduled_jobs WHERE id=?').get(id)
  if (!existing) return c.json({ error: 'Not found' }, 404)
  getDb().prepare('UPDATE scheduled_jobs SET name=?, webhook_id=?, payload=?, cron_expr=? WHERE id=?')
    .run(body.data.name, body.data.webhook_id, JSON.stringify(body.data.payload), body.data.cron_expr, id)
  reloadJob(id)
  return c.json({ ok: true })
})

schedulerRoutes.patch('/:id/toggle', (c) => {
  const id = Number(c.req.param('id'))
  const job = getDb().prepare('SELECT enabled FROM scheduled_jobs WHERE id=?').get(id) as any
  if (!job) return c.json({ error: 'Not found' }, 404)
  getDb().prepare('UPDATE scheduled_jobs SET enabled=? WHERE id=?').run(job.enabled ? 0 : 1, id)
  reloadJob(id)
  return c.json({ ok: true })
})

schedulerRoutes.post('/:id/run', async (c) => {
  const id = Number(c.req.param('id'))
  const result = await runJobNow(id)
  if (!result.ok) return c.json({ error: 'Job not found or webhook missing' }, 404)
  return c.json({ ok: true, status: result.status })
})

schedulerRoutes.post('/:id/clone', (c) => {
  const id = Number(c.req.param('id'))
  const job = getDb().prepare('SELECT * FROM scheduled_jobs WHERE id=?').get(id) as any
  if (!job) return c.json({ error: 'Not found' }, 404)
  const result = getDb().prepare('INSERT INTO scheduled_jobs (name, webhook_id, payload, cron_expr, enabled) VALUES (?,?,?,?,?)')
    .run(`${job.name} (copie)`, job.webhook_id, job.payload, job.cron_expr, 0)
  return c.json({ id: result.lastInsertRowid }, 201)
})

schedulerRoutes.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  getDb().prepare('DELETE FROM scheduled_jobs WHERE id=?').run(id)
  reloadJob(id)
  return c.json({ ok: true })
})
