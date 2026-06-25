import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { existsSync, readFileSync } from 'fs'

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
