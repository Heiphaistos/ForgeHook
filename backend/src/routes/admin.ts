import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { existsSync, readFileSync } from 'fs'
import { z } from 'zod'

export const adminRoutes = new Hono()
adminRoutes.use('*', requireAuth)

// GET /api/admin/backup — download SQLite DB
adminRoutes.get('/backup', (c) => {
  const dbPath = process.env.DB_PATH ?? '/app/data/forgehook.db'
  if (!existsSync(dbPath)) return c.json({ error: 'DB not found' }, 404)

  const db = getDb()
  try { db.pragma('wal_checkpoint(FULL)') } catch {}

  const buffer = readFileSync(dbPath)
  const now = new Date().toISOString().slice(0, 10)
  c.header('Content-Type', 'application/octet-stream')
  c.header('Content-Disposition', `attachment; filename="forgehook-backup-${now}.db"`)
  return c.body(buffer)
})

// GET /api/admin/export — export webhooks + templates en JSON (backup portable)
adminRoutes.get('/export', (c) => {
  const db = getDb()
  const webhooks = db.prepare('SELECT name, url, avatar_url, username, category FROM webhooks ORDER BY name').all()
  const templates = db.prepare('SELECT name, description, payload, category, preview_color FROM templates ORDER BY name').all()
  return c.json({
    app: 'forgehook',
    version: 1,
    exported_at: new Date().toISOString(),
    webhooks,
    templates,
  })
})

// Schémas d'import (tolérants : on ignore les entrées invalides plutôt que tout rejeter)
const importWebhook = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().refine(
    u => u.startsWith('https://discord.com/api/webhooks/') || u.startsWith('https://discordapp.com/api/webhooks/'),
    'Must be a Discord webhook URL'
  ),
  avatar_url: z.string().nullish(),
  username: z.string().nullish(),
  category: z.string().max(50).nullish(),
})
const importTemplate = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  payload: z.union([z.string(), z.object({}).passthrough()]),
  category: z.string().nullish(),
  preview_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullish(),
})
const importSchema = z.object({
  webhooks: z.array(z.unknown()).optional(),
  templates: z.array(z.unknown()).optional(),
})

// POST /api/admin/import — importer webhooks + templates depuis un JSON exporté.
// Les doublons (webhook name+url, template name) sont ignorés. Entrées invalides ignorées.
adminRoutes.post('/import', async (c) => {
  const parsed = importSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'JSON invalide' }, 400)
  const db = getDb()

  let webhooksAdded = 0, webhooksSkipped = 0
  const whExists = db.prepare('SELECT id FROM webhooks WHERE name=? AND url=?')
  const whInsert = db.prepare('INSERT INTO webhooks (name, url, avatar_url, username, category) VALUES (?,?,?,?,?)')
  for (const raw of parsed.data.webhooks ?? []) {
    const w = importWebhook.safeParse(raw)
    if (!w.success) { webhooksSkipped++; continue }
    if (whExists.get(w.data.name, w.data.url)) { webhooksSkipped++; continue }
    whInsert.run(w.data.name, w.data.url, w.data.avatar_url || null, w.data.username || null, w.data.category || 'default')
    webhooksAdded++
  }

  let templatesAdded = 0, templatesSkipped = 0
  const tplExists = db.prepare('SELECT id FROM templates WHERE name=?')
  const tplInsert = db.prepare('INSERT INTO templates (name, description, payload, category, preview_color) VALUES (?,?,?,?,?)')
  for (const raw of parsed.data.templates ?? []) {
    const t = importTemplate.safeParse(raw)
    if (!t.success) { templatesSkipped++; continue }
    if (tplExists.get(t.data.name)) { templatesSkipped++; continue }
    const payloadStr = typeof t.data.payload === 'string' ? t.data.payload : JSON.stringify(t.data.payload)
    tplInsert.run(t.data.name, t.data.description || null, payloadStr, t.data.category || 'general', t.data.preview_color || '#5865F2')
    templatesAdded++
  }

  return c.json({ ok: true, webhooksAdded, webhooksSkipped, templatesAdded, templatesSkipped })
})

// GET /api/admin/stats — counts per table
adminRoutes.get('/stats', (c) => {
  const db = getDb()
  const count = (table: string) => (db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get() as any).n
  return c.json({
    webhooks: count('webhooks'),
    templates: count('templates'),
    history: count('history'),
    tutorials: count('tutorials'),
    scheduled_jobs: count('scheduled_jobs'),
    rss_feeds: count('rss_feeds'),
    bots: count('bots'),
  })
})
