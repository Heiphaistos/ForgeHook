# ForgeHook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Self-hosted Discord embed builder + webhook manager + bot tools + RSS integration, web app (Vue 3 + Hono.js, Docker VPS) + desktop exe (Tauri v2).

**Architecture:** Shared Vue 3 frontend (adaptive API client switches web/desktop), Hono.js backend for web (SQLite via better-sqlite3), Tauri v2 Rust backend for desktop (rusqlite). Real-time Discord preview mirrors exact Discord UI. JWT auth (single admin password).

**Tech Stack:** Vue 3 + TypeScript + Tailwind CSS v4 + Pinia | Hono.js + better-sqlite3 + bcrypt (web) | Tauri v2 + Rust + rusqlite (desktop) | Docker + nginx (VPS)

---

## Phase 1 — Backend Foundation + Auth

### Task 1: Backend init + DB schema

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/db/schema.sql`
- Create: `backend/src/db/index.ts`
- Create: `backend/src/index.ts`

- [ ] Init backend package

```bash
cd backend
npm init -y
npm install hono @hono/node-server better-sqlite3 bcryptjs jsonwebtoken node-cron rss-parser zod
npm install -D typescript @types/node @types/better-sqlite3 @types/bcryptjs @types/jsonwebtoken tsx
```

- [ ] Create `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

- [ ] Create `backend/src/db/schema.sql`

```sql
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  avatar_url TEXT,
  username TEXT,
  category TEXT DEFAULT 'default',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  channel_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  payload TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  preview_color TEXT DEFAULT '#5865F2',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id INTEGER,
  webhook_name TEXT,
  payload TEXT NOT NULL,
  status INTEGER NOT NULL,
  error TEXT,
  sent_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  webhook_id INTEGER NOT NULL,
  payload TEXT NOT NULL,
  cron_expr TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  last_run TEXT,
  next_run TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rss_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  webhook_id INTEGER NOT NULL,
  check_interval INTEGER DEFAULT 3600,
  last_checked TEXT,
  last_guid TEXT,
  template TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tutorials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  blocks TEXT NOT NULL DEFAULT '[]',
  published INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

- [ ] Create `backend/src/db/index.ts`

```typescript
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? join(__dirname, '../../data/forgehook.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
    db.exec(schema)
  }
  return db
}
```

- [ ] Create `backend/src/index.ts` (main entry)

```typescript
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth.js'
import { webhookRoutes } from './routes/webhooks.js'
import { botRoutes } from './routes/bots.js'
import { templateRoutes } from './routes/templates.js'
import { historyRoutes } from './routes/history.js'
import { schedulerRoutes } from './routes/scheduler.js'
import { rssRoutes } from './routes/rss.js'
import { tutorialRoutes } from './routes/tutorials.js'
import { discordRoutes } from './routes/discord.js'
import { startScheduler } from './services/scheduler.js'
import { startRssPoller } from './services/rss.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env.ALLOWED_ORIGIN ?? '*', credentials: true }))

app.route('/api/auth', authRoutes)
app.route('/api/webhooks', webhookRoutes)
app.route('/api/bots', botRoutes)
app.route('/api/templates', templateRoutes)
app.route('/api/history', historyRoutes)
app.route('/api/scheduler', schedulerRoutes)
app.route('/api/rss', rssRoutes)
app.route('/api/tutorials', tutorialRoutes)
app.route('/api/discord', discordRoutes)

app.get('/health', (c) => c.json({ ok: true, version: '1.0.0' }))

startScheduler()
startRssPoller()

const port = Number(process.env.PORT ?? 3020)
serve({ fetch: app.fetch, port }, () => console.log(`ForgeHook backend :${port}`))
```

- [ ] Commit

```bash
git add backend/
git commit -m "feat: initialize backend with DB schema and Hono app entry"
```

---

### Task 2: Auth middleware + JWT

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/routes/auth.ts`

- [ ] Create `backend/src/middleware/auth.ts`

```typescript
import { createMiddleware } from 'hono/factory'
import { verify } from 'jsonwebtoken'

export const requireAuth = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload = verify(token, process.env.JWT_SECRET ?? 'changeme') as { id: number }
    c.set('userId', payload.id)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
```

- [ ] Create `backend/src/routes/auth.ts`

```typescript
import { Hono } from 'hono'
import { hash, compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const loginSchema = z.object({ password: z.string().min(8) })
const setupSchema = z.object({ password: z.string().min(8) })

export const authRoutes = new Hono()

authRoutes.get('/status', (c) => {
  const db = getDb()
  const user = db.prepare('SELECT id FROM users LIMIT 1').get()
  return c.json({ configured: !!user })
})

authRoutes.post('/setup', async (c) => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get()
  if (existing) return c.json({ error: 'Already configured' }, 400)
  const body = setupSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: 'Invalid password' }, 400)
  const hash_val = await hash(body.data.password, 12)
  db.prepare('INSERT INTO users (password_hash) VALUES (?)').run(hash_val)
  return c.json({ ok: true })
})

authRoutes.post('/login', async (c) => {
  const body = loginSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: 'Invalid input' }, 400)
  const db = getDb()
  const user = db.prepare('SELECT * FROM users LIMIT 1').get() as { id: number; password_hash: string } | undefined
  if (!user) return c.json({ error: 'Not configured' }, 400)
  const valid = await compare(body.data.password, user.password_hash)
  if (!valid) return c.json({ error: 'Wrong password' }, 401)
  const token = sign({ id: user.id }, process.env.JWT_SECRET ?? 'changeme', { expiresIn: '7d' })
  return c.json({ token })
})
```

- [ ] Commit

```bash
git add backend/src/middleware/ backend/src/routes/auth.ts
git commit -m "feat: add JWT auth with bcrypt password, setup endpoint"
```

---

### Task 3: Webhook + Discord sender routes

**Files:**
- Create: `backend/src/services/discord.ts`
- Create: `backend/src/routes/webhooks.ts`
- Create: `backend/src/routes/discord.ts`

- [ ] Create `backend/src/services/discord.ts`

```typescript
export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  timestamp?: string
  footer?: { text: string; icon_url?: string }
  image?: { url: string }
  thumbnail?: { url: string }
  author?: { name: string; url?: string; icon_url?: string }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
}

export interface DiscordPayload {
  content?: string
  username?: string
  avatar_url?: string
  tts?: boolean
  embeds?: DiscordEmbed[]
  thread_id?: string
}

export async function sendWebhook(url: string, payload: DiscordPayload, threadId?: string): Promise<{ ok: boolean; status: number; error?: string }> {
  const target = threadId ? `${url}?thread_id=${threadId}&wait=true` : `${url}?wait=true`
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  })
  if (res.ok) return { ok: true, status: res.status }
  const text = await res.text().catch(() => 'Unknown error')
  return { ok: false, status: res.status, error: text }
}
```

- [ ] Create `backend/src/routes/webhooks.ts`

```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const webhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().startsWith('https://discord.com/api/webhooks/'),
  avatar_url: z.string().url().optional(),
  username: z.string().max(80).optional(),
  category: z.string().max(50).default('default'),
})

export const webhookRoutes = new Hono()
webhookRoutes.use('*', requireAuth)

webhookRoutes.get('/', (c) => {
  const rows = getDb().prepare('SELECT * FROM webhooks ORDER BY category, name').all()
  return c.json(rows)
})

webhookRoutes.post('/', async (c) => {
  const body = webhookSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO webhooks (name, url, avatar_url, username, category) VALUES (?,?,?,?,?)'
  ).run(body.data.name, body.data.url, body.data.avatar_url ?? null, body.data.username ?? null, body.data.category)
  return c.json({ id: result.lastInsertRowid }, 201)
})

webhookRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = webhookSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  getDb().prepare(
    'UPDATE webhooks SET name=?, url=?, avatar_url=?, username=?, category=? WHERE id=?'
  ).run(body.data.name, body.data.url, body.data.avatar_url ?? null, body.data.username ?? null, body.data.category, id)
  return c.json({ ok: true })
})

webhookRoutes.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  getDb().prepare('DELETE FROM webhooks WHERE id=?').run(id)
  return c.json({ ok: true })
})
```

- [ ] Create `backend/src/routes/discord.ts` (send + test)

```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { sendWebhook, DiscordPayload } from '../services/discord.js'
import { z } from 'zod'

const sendSchema = z.object({
  webhook_id: z.number().int().positive(),
  payload: z.object({}).passthrough(),
  thread_id: z.string().optional(),
})

export const discordRoutes = new Hono()
discordRoutes.use('*', requireAuth)

discordRoutes.post('/send', async (c) => {
  const body = sendSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const db = getDb()
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(body.data.webhook_id) as any
  if (!webhook) return c.json({ error: 'Webhook not found' }, 404)

  const payload = body.data.payload as DiscordPayload
  if (webhook.username && !payload.username) payload.username = webhook.username
  if (webhook.avatar_url && !payload.avatar_url) payload.avatar_url = webhook.avatar_url

  const result = await sendWebhook(webhook.url, payload, body.data.thread_id)
  db.prepare('INSERT INTO history (webhook_id, webhook_name, payload, status, error) VALUES (?,?,?,?,?)')
    .run(webhook.id, webhook.name, JSON.stringify(payload), result.status, result.error ?? null)
  return c.json(result, result.ok ? 200 : 422)
})

discordRoutes.post('/test/:webhookId', async (c) => {
  const webhookId = Number(c.req.param('webhookId'))
  const db = getDb()
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(webhookId) as any
  if (!webhook) return c.json({ error: 'Not found' }, 404)
  const result = await sendWebhook(webhook.url, {
    username: 'ForgeHook Test',
    embeds: [{ title: '✅ Webhook test', description: `**${webhook.name}** is connected!`, color: 0x57f287 }],
  })
  return c.json(result)
})
```

- [ ] Commit

```bash
git add backend/src/services/discord.ts backend/src/routes/
git commit -m "feat: Discord webhook send service + webhook CRUD routes"
```

---

### Task 4: Bot, Templates, History, Scheduler, RSS, Tutorial routes

**Files:**
- Create: `backend/src/routes/bots.ts`
- Create: `backend/src/routes/templates.ts`
- Create: `backend/src/routes/history.ts`
- Create: `backend/src/routes/scheduler.ts`
- Create: `backend/src/routes/rss.ts`
- Create: `backend/src/routes/tutorials.ts`
- Create: `backend/src/services/scheduler.ts`
- Create: `backend/src/services/rss.ts`

- [ ] Create `backend/src/routes/bots.ts`

```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const botSchema = z.object({
  name: z.string().min(1).max(100),
  token: z.string().min(10),
  channel_id: z.string().optional(),
})

const sendBotSchema = z.object({
  bot_id: z.number(),
  channel_id: z.string(),
  payload: z.object({}).passthrough(),
})

export const botRoutes = new Hono()
botRoutes.use('*', requireAuth)

botRoutes.get('/', (c) => {
  const rows = getDb().prepare('SELECT id, name, channel_id, created_at FROM bots').all()
  return c.json(rows)
})

botRoutes.post('/', async (c) => {
  const body = botSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare('INSERT INTO bots (name, token, channel_id) VALUES (?,?,?)').run(body.data.name, body.data.token, body.data.channel_id ?? null)
  return c.json({ id: result.lastInsertRowid }, 201)
})

botRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM bots WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})

botRoutes.post('/send', async (c) => {
  const body = sendBotSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const bot = getDb().prepare('SELECT * FROM bots WHERE id=?').get(body.data.bot_id) as any
  if (!bot) return c.json({ error: 'Bot not found' }, 404)
  const res = await fetch(`https://discord.com/api/v10/channels/${body.data.channel_id}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${bot.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body.data.payload),
    signal: AbortSignal.timeout(10_000),
  })
  if (res.ok) return c.json({ ok: true })
  const err = await res.text()
  return c.json({ ok: false, error: err }, 422)
})
```

- [ ] Create `backend/src/routes/templates.ts`

```typescript
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
  return c.json(getDb().prepare('SELECT * FROM templates ORDER BY category, name').all())
})

templateRoutes.post('/', async (c) => {
  const body = tplSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare('INSERT INTO templates (name, description, payload, category, preview_color) VALUES (?,?,?,?,?)')
    .run(body.data.name, body.data.description ?? null, JSON.stringify(body.data.payload), body.data.category, body.data.preview_color)
  return c.json({ id: result.lastInsertRowid }, 201)
})

templateRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM templates WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})
```

- [ ] Create `backend/src/routes/history.ts`

```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'

export const historyRoutes = new Hono()
historyRoutes.use('*', requireAuth)

historyRoutes.get('/', (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)
  const rows = getDb().prepare('SELECT * FROM history ORDER BY sent_at DESC LIMIT ? OFFSET ?').all(limit, offset)
  return c.json(rows)
})

historyRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM history WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})
```

- [ ] Create `backend/src/services/scheduler.ts`

```typescript
import cron from 'node-cron'
import { getDb } from '../db/index.js'
import { sendWebhook } from './discord.js'

export function startScheduler(): void {
  cron.schedule('* * * * *', async () => {
    const db = getDb()
    const jobs = db.prepare('SELECT * FROM scheduled_jobs WHERE enabled=1').all() as any[]
    for (const job of jobs) {
      if (!cron.validate(job.cron_expr)) continue
      const task = cron.schedule(job.cron_expr, async () => {
        const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(job.webhook_id) as any
        if (!webhook) return
        const payload = JSON.parse(job.payload)
        const result = await sendWebhook(webhook.url, payload)
        db.prepare('UPDATE scheduled_jobs SET last_run=datetime("now") WHERE id=?').run(job.id)
        db.prepare('INSERT INTO history (webhook_id, webhook_name, payload, status, error) VALUES (?,?,?,?,?)')
          .run(webhook.id, webhook.name, job.payload, result.status, result.error ?? null)
      }, { scheduled: false })
      task.start()
    }
  })
}
```

- [ ] Create `backend/src/services/rss.ts`

```typescript
import Parser from 'rss-parser'
import { getDb } from '../db/index.js'
import { sendWebhook } from './discord.js'

const parser = new Parser()

async function checkFeed(feed: any): Promise<void> {
  const db = getDb()
  try {
    const parsed = await parser.parseURL(feed.url)
    const latest = parsed.items[0]
    if (!latest || latest.guid === feed.last_guid) return
    const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(feed.webhook_id) as any
    if (!webhook) return
    const payload = feed.template
      ? JSON.parse(feed.template.replace('{{title}}', latest.title ?? '').replace('{{link}}', latest.link ?? '').replace('{{content}}', latest.contentSnippet ?? ''))
      : {
          embeds: [{
            title: latest.title ?? 'New article',
            url: latest.link,
            description: (latest.contentSnippet ?? '').slice(0, 300),
            color: 0x5865f2,
            footer: { text: feed.name },
            timestamp: latest.isoDate,
          }],
        }
    await sendWebhook(webhook.url, payload)
    db.prepare('UPDATE rss_feeds SET last_checked=datetime("now"), last_guid=? WHERE id=?').run(latest.guid ?? latest.link, feed.id)
  } catch (e) {
    console.error(`RSS feed ${feed.name} error:`, e)
  }
}

export function startRssPoller(): void {
  setInterval(async () => {
    const db = getDb()
    const feeds = db.prepare('SELECT * FROM rss_feeds WHERE enabled=1').all() as any[]
    for (const feed of feeds) {
      const lastChecked = feed.last_checked ? new Date(feed.last_checked).getTime() : 0
      if (Date.now() - lastChecked >= feed.check_interval * 1000) {
        await checkFeed(feed)
      }
    }
  }, 60_000)
}
```

- [ ] Create `backend/src/routes/scheduler.ts`

```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'
import cron from 'node-cron'

const jobSchema = z.object({
  name: z.string().min(1),
  webhook_id: z.number(),
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
  return c.json({ id: result.lastInsertRowid }, 201)
})

schedulerRoutes.patch('/:id/toggle', (c) => {
  const id = Number(c.req.param('id'))
  const job = getDb().prepare('SELECT enabled FROM scheduled_jobs WHERE id=?').get(id) as any
  if (!job) return c.json({ error: 'Not found' }, 404)
  getDb().prepare('UPDATE scheduled_jobs SET enabled=? WHERE id=?').run(job.enabled ? 0 : 1, id)
  return c.json({ ok: true })
})

schedulerRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM scheduled_jobs WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})
```

- [ ] Create `backend/src/routes/rss.ts`

```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const feedSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  webhook_id: z.number(),
  check_interval: z.number().int().min(60).default(3600),
  template: z.string().optional(),
  enabled: z.boolean().default(true),
})

export const rssRoutes = new Hono()
rssRoutes.use('*', requireAuth)

rssRoutes.get('/', (c) => c.json(getDb().prepare('SELECT id, name, url, webhook_id, check_interval, last_checked, enabled FROM rss_feeds').all()))

rssRoutes.post('/', async (c) => {
  const body = feedSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare('INSERT INTO rss_feeds (name, url, webhook_id, check_interval, template, enabled) VALUES (?,?,?,?,?,?)')
    .run(body.data.name, body.data.url, body.data.webhook_id, body.data.check_interval, body.data.template ?? null, body.data.enabled ? 1 : 0)
  return c.json({ id: result.lastInsertRowid }, 201)
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
```

- [ ] Create `backend/src/routes/tutorials.ts`

```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db/index.js'
import { z } from 'zod'

const tutorialSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  blocks: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'image', 'video', 'embed', 'separator', 'code']),
    content: z.any(),
  })),
  published: z.boolean().default(false),
})

export const tutorialRoutes = new Hono()
tutorialRoutes.use('*', requireAuth)

tutorialRoutes.get('/', (c) => c.json(getDb().prepare('SELECT id, title, description, published, created_at FROM tutorials ORDER BY created_at DESC').all()))

tutorialRoutes.get('/:id', (c) => {
  const t = getDb().prepare('SELECT * FROM tutorials WHERE id=?').get(Number(c.req.param('id'))) as any
  if (!t) return c.json({ error: 'Not found' }, 404)
  return c.json({ ...t, blocks: JSON.parse(t.blocks) })
})

tutorialRoutes.post('/', async (c) => {
  const body = tutorialSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const result = getDb().prepare('INSERT INTO tutorials (title, description, blocks, published) VALUES (?,?,?,?)')
    .run(body.data.title, body.data.description ?? null, JSON.stringify(body.data.blocks), body.data.published ? 1 : 0)
  return c.json({ id: result.lastInsertRowid }, 201)
})

tutorialRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = tutorialSchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  getDb().prepare('UPDATE tutorials SET title=?, description=?, blocks=?, published=?, updated_at=datetime("now") WHERE id=?')
    .run(body.data.title, body.data.description ?? null, JSON.stringify(body.data.blocks), body.data.published ? 1 : 0, id)
  return c.json({ ok: true })
})

tutorialRoutes.delete('/:id', (c) => {
  getDb().prepare('DELETE FROM tutorials WHERE id=?').run(Number(c.req.param('id')))
  return c.json({ ok: true })
})
```

- [ ] Commit

```bash
git add backend/src/
git commit -m "feat: complete backend API — bots, templates, history, scheduler, RSS, tutorials"
```

---

## Phase 2 — Frontend Foundation

### Task 5: Frontend init + types + router

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/types/discord.ts`
- Create: `frontend/src/types/app.ts`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/api/client.ts`

- [ ] Init frontend

```bash
cd frontend
npm create vite@latest . -- --template vue-ts
npm install pinia vue-router@4 @vueuse/core axios
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] Create `frontend/src/types/discord.ts`

```typescript
export interface DiscordEmbedField {
  name: string
  value: string
  inline: boolean
}

export interface DiscordEmbed {
  title: string
  description: string
  url: string
  color: number | null
  timestamp: string
  author: { name: string; url: string; icon_url: string }
  footer: { text: string; icon_url: string }
  image: { url: string }
  thumbnail: { url: string }
  fields: DiscordEmbedField[]
}

export interface DiscordMessage {
  content: string
  username: string
  avatar_url: string
  tts: boolean
  embeds: Partial<DiscordEmbed>[]
  thread_id?: string
}

export function emptyEmbed(): Partial<DiscordEmbed> {
  return { title: '', description: '', color: 0x5865f2, fields: [], author: { name: '', url: '', icon_url: '' }, footer: { text: '', icon_url: '' } }
}

export function emptyMessage(): DiscordMessage {
  return { content: '', username: '', avatar_url: '', tts: false, embeds: [] }
}
```

- [ ] Create `frontend/src/types/app.ts`

```typescript
export interface Webhook {
  id: number
  name: string
  url: string
  avatar_url: string | null
  username: string | null
  category: string
}

export interface Bot {
  id: number
  name: string
  channel_id: string | null
}

export interface Template {
  id: number
  name: string
  description: string | null
  payload: string
  category: string
  preview_color: string
}

export interface ScheduledJob {
  id: number
  name: string
  webhook_id: number
  payload: string
  cron_expr: string
  enabled: number
  last_run: string | null
}

export interface RssFeed {
  id: number
  name: string
  url: string
  webhook_id: number
  check_interval: number
  last_checked: string | null
  enabled: number
}

export interface Tutorial {
  id: number
  title: string
  description: string | null
  blocks: TutorialBlock[]
  published: number
}

export interface TutorialBlock {
  id: string
  type: 'text' | 'image' | 'video' | 'embed' | 'separator' | 'code'
  content: any
}

export interface HistoryEntry {
  id: number
  webhook_name: string
  payload: string
  status: number
  error: string | null
  sent_at: string
}
```

- [ ] Create `frontend/src/api/client.ts`

```typescript
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fh_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fh_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

- [ ] Create `frontend/src/router/index.ts`

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/setup', component: () => import('../views/SetupView.vue') },
    { path: '/', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/embed', component: () => import('../views/EmbedBuilderView.vue'), meta: { requiresAuth: true } },
    { path: '/webhooks', component: () => import('../views/WebhooksView.vue'), meta: { requiresAuth: true } },
    { path: '/bots', component: () => import('../views/BotsView.vue'), meta: { requiresAuth: true } },
    { path: '/rss', component: () => import('../views/RssView.vue'), meta: { requiresAuth: true } },
    { path: '/tutorials', component: () => import('../views/TutorialsView.vue'), meta: { requiresAuth: true } },
    { path: '/tutorials/:id', component: () => import('../views/TutorialEditorView.vue'), meta: { requiresAuth: true } },
    { path: '/scheduler', component: () => import('../views/SchedulerView.vue'), meta: { requiresAuth: true } },
    { path: '/history', component: () => import('../views/HistoryView.vue'), meta: { requiresAuth: true } },
    { path: '/templates', component: () => import('../views/TemplatesView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('fh_token')
  if (to.meta.requiresAuth && !token) return '/login'
})

export default router
```

- [ ] Commit

```bash
git add frontend/
git commit -m "feat: frontend init — types, router, API client"
```

---

### Task 6: Pinia stores

**Files:**
- Create: `frontend/src/stores/auth.ts`
- Create: `frontend/src/stores/webhooks.ts`
- Create: `frontend/src/stores/embed.ts`
- Create: `frontend/src/stores/ui.ts`

- [ ] Create `frontend/src/stores/auth.ts`

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('fh_token'))
  const configured = ref(false)

  async function checkStatus() {
    const { data } = await api.get('/auth/status')
    configured.value = data.configured
  }

  async function setup(password: string) {
    await api.post('/auth/setup', { password })
    configured.value = true
  }

  async function login(password: string) {
    const { data } = await api.post('/auth/login', { password })
    token.value = data.token
    localStorage.setItem('fh_token', data.token)
  }

  function logout() {
    token.value = null
    localStorage.removeItem('fh_token')
  }

  return { token, configured, checkStatus, setup, login, logout }
})
```

- [ ] Create `frontend/src/stores/embed.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { DiscordMessage } from '../types/discord'
import { emptyMessage, emptyEmbed } from '../types/discord'
import api from '../api/client'

export const useEmbedStore = defineStore('embed', () => {
  const message = reactive<DiscordMessage>(emptyMessage())
  const selectedWebhookId = ref<number | null>(null)
  const sending = ref(false)
  const lastError = ref<string | null>(null)

  function addEmbed() { message.embeds.push(emptyEmbed()) }
  function removeEmbed(i: number) { message.embeds.splice(i, 1) }
  function reset() { Object.assign(message, emptyMessage()) }

  async function send(threadId?: string) {
    if (!selectedWebhookId.value) return
    sending.value = true
    lastError.value = null
    try {
      await api.post('/discord/send', { webhook_id: selectedWebhookId.value, payload: message, thread_id: threadId })
    } catch (e: any) {
      lastError.value = e.response?.data?.error ?? 'Send failed'
    } finally {
      sending.value = false
    }
  }

  function loadTemplate(payload: any) {
    Object.assign(message, payload)
  }

  return { message, selectedWebhookId, sending, lastError, addEmbed, removeEmbed, reset, send, loadTemplate }
})
```

- [ ] Create `frontend/src/stores/webhooks.ts`

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'
import type { Webhook } from '../types/app'

export const useWebhooksStore = defineStore('webhooks', () => {
  const webhooks = ref<Webhook[]>([])

  async function load() {
    const { data } = await api.get('/webhooks')
    webhooks.value = data
  }

  async function create(w: Omit<Webhook, 'id'>) {
    await api.post('/webhooks', w)
    await load()
  }

  async function update(id: number, w: Omit<Webhook, 'id'>) {
    await api.put(`/webhooks/${id}`, w)
    await load()
  }

  async function remove(id: number) {
    await api.delete(`/webhooks/${id}`)
    webhooks.value = webhooks.value.filter(w => w.id !== id)
  }

  async function test(id: number) {
    const { data } = await api.post(`/discord/test/${id}`)
    return data
  }

  return { webhooks, load, create, update, remove, test }
})
```

- [ ] Create `frontend/src/stores/ui.ts`

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const theme = ref<string>(localStorage.getItem('fh_theme') ?? 'dark')
  const sidebarOpen = ref(true)
  const notification = ref<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  function setTheme(t: string) {
    theme.value = t
    localStorage.setItem('fh_theme', t)
  }

  function notify(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    notification.value = { msg, type }
    setTimeout(() => { notification.value = null }, 3500)
  }

  return { theme, sidebarOpen, notification, setTheme, notify }
})
```

- [ ] Commit

```bash
git add frontend/src/stores/
git commit -m "feat: Pinia stores — auth, embed, webhooks, UI"
```

---

## Phase 3 — Embed Builder UI (Core Feature)

### Task 7: Discord preview component

**Files:**
- Create: `frontend/src/components/preview/DiscordPreview.vue`
- Create: `frontend/src/components/preview/EmbedPreview.vue`

- [ ] Create `frontend/src/components/preview/EmbedPreview.vue`

```vue
<template>
  <div class="embed-wrapper" :style="{ borderLeft: `4px solid ${colorHex}` }">
    <div class="embed-content">
      <div v-if="embed.author?.name" class="embed-author">
        <img v-if="embed.author.icon_url" :src="embed.author.icon_url" class="author-icon" />
        <a v-if="embed.author.url" :href="embed.author.url" target="_blank">{{ embed.author.name }}</a>
        <span v-else>{{ embed.author.name }}</span>
      </div>
      <div v-if="embed.title" class="embed-title">
        <a v-if="embed.url" :href="embed.url" target="_blank">{{ embed.title }}</a>
        <span v-else>{{ embed.title }}</span>
      </div>
      <div v-if="embed.description" class="embed-description" v-html="renderMarkdown(embed.description)" />
      <div v-if="embed.thumbnail?.url" class="embed-thumbnail">
        <img :src="embed.thumbnail.url" />
      </div>
      <div v-if="embed.fields?.length" class="embed-fields">
        <div v-for="field in embed.fields" :key="field.name"
          :class="['embed-field', field.inline ? 'inline' : '']">
          <div class="field-name">{{ field.name }}</div>
          <div class="field-value" v-html="renderMarkdown(field.value)" />
        </div>
      </div>
      <div v-if="embed.image?.url" class="embed-image">
        <img :src="embed.image.url" />
      </div>
      <div v-if="embed.footer?.text || embed.timestamp" class="embed-footer">
        <img v-if="embed.footer?.icon_url" :src="embed.footer.icon_url" class="footer-icon" />
        <span v-if="embed.footer?.text">{{ embed.footer.text }}</span>
        <span v-if="embed.footer?.text && embed.timestamp"> • </span>
        <span v-if="embed.timestamp">{{ formatDate(embed.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiscordEmbed } from '../../types/discord'

const props = defineProps<{ embed: Partial<DiscordEmbed> }>()

const colorHex = computed(() => {
  if (!props.embed.color) return '#202225'
  return '#' + props.embed.color.toString(16).padStart(6, '0')
})

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\n/g, '<br>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.embed-wrapper { background: #2f3136; border-radius: 4px; max-width: 520px; padding: 12px 16px; margin: 4px 0; }
.embed-author { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #dcddde; }
.author-icon { width: 24px; height: 24px; border-radius: 50%; }
.embed-title { font-size: 16px; font-weight: 700; color: #00b0f4; margin-bottom: 8px; }
.embed-title a { color: #00b0f4; text-decoration: none; }
.embed-description { font-size: 14px; color: #dcddde; line-height: 1.5; margin-bottom: 8px; }
.embed-thumbnail { position: absolute; right: 16px; top: 12px; }
.embed-thumbnail img { width: 80px; height: 80px; border-radius: 4px; object-fit: cover; }
.embed-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
.embed-field { grid-column: span 3; }
.embed-field.inline { grid-column: span 1; }
.field-name { font-size: 14px; font-weight: 700; color: #dcddde; margin-bottom: 2px; }
.field-value { font-size: 14px; color: #dcddde; }
.embed-image img { max-width: 100%; border-radius: 4px; margin-top: 8px; }
.embed-footer { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #72767d; margin-top: 8px; }
.footer-icon { width: 20px; height: 20px; border-radius: 50%; }
.embed-content { position: relative; }
</style>
```

- [ ] Create `frontend/src/components/preview/DiscordPreview.vue`

```vue
<template>
  <div class="discord-preview">
    <div class="channel-header">
      <span class="channel-icon">#</span>
      <span class="channel-name">preview</span>
    </div>
    <div class="messages-area">
      <div class="message">
        <img class="avatar" :src="avatarUrl || defaultAvatar" />
        <div class="message-content">
          <div class="message-header">
            <span class="username">{{ username || 'ForgeHook' }}</span>
            <span class="bot-tag" v-if="showBotTag">BOT</span>
            <span class="timestamp">Today at {{ currentTime }}</span>
          </div>
          <div v-if="message.content" class="message-text" v-html="renderMarkdown(message.content)" />
          <EmbedPreview
            v-for="(embed, i) in message.embeds"
            :key="i"
            :embed="embed"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EmbedPreview from './EmbedPreview.vue'
import type { DiscordMessage } from '../../types/discord'

const props = defineProps<{
  message: Partial<DiscordMessage>
  showBotTag?: boolean
}>()

const defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png'
const avatarUrl = computed(() => props.message.avatar_url || '')
const username = computed(() => props.message.username || 'ForgeHook')

const currentTime = computed(() => {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.discord-preview { background: #36393f; border-radius: 8px; overflow: hidden; min-height: 200px; font-family: 'gg sans', 'Noto Sans', sans-serif; }
.channel-header { background: #2f3136; padding: 12px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #202225; }
.channel-icon { color: #8e9297; font-size: 20px; font-weight: 700; }
.channel-name { color: #dcddde; font-weight: 600; }
.messages-area { padding: 16px; }
.message { display: flex; gap: 16px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.message-content { flex: 1; }
.message-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.username { color: #fff; font-weight: 600; font-size: 16px; }
.bot-tag { background: #5865f2; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 3px; text-transform: uppercase; }
.timestamp { color: #72767d; font-size: 12px; }
.message-text { color: #dcddde; font-size: 16px; line-height: 1.5; }
</style>
```

- [ ] Commit

```bash
git add frontend/src/components/preview/
git commit -m "feat: Discord preview components — pixel-accurate embed + message preview"
```

---

### Task 8: Embed builder components

**Files:**
- Create: `frontend/src/components/embed/EmbedBuilder.vue`
- Create: `frontend/src/components/embed/EmbedColorPicker.vue`
- Create: `frontend/src/components/embed/EmbedFieldEditor.vue`

- [ ] Create `frontend/src/components/embed/EmbedColorPicker.vue`

```vue
<template>
  <div class="color-picker">
    <div class="color-preview" :style="{ background: hexColor }" @click="open = !open" />
    <input v-model="hexInput" @input="onHexInput" placeholder="#5865F2" class="hex-input" />
    <div v-if="open" class="palette">
      <div v-for="c in DISCORD_COLORS" :key="c" class="swatch"
        :style="{ background: c }" @click="selectColor(c)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>()

const open = ref(false)

const DISCORD_COLORS = [
  '#1abc9c','#2ecc71','#3498db','#9b59b6','#e91e63',
  '#f1c40f','#e67e22','#e74c3c','#95a5a6','#607d8b',
  '#11806a','#1f8b4c','#206694','#71368a','#ad1457',
  '#c27c0e','#a84300','#992d22','#979c9f','#546e7a',
  '#5865f2','#eb459e','#fee75c','#57f287','#ed4245',
  '#ffffff','#000000','#2f3136','#202225','#36393f',
]

const hexColor = computed(() => {
  if (props.modelValue == null) return '#2f3136'
  return '#' + props.modelValue.toString(16).padStart(6, '0')
})

const hexInput = ref(hexColor.value)

function onHexInput() {
  const v = hexInput.value.replace('#', '')
  if (/^[0-9a-fA-F]{6}$/.test(v)) {
    emit('update:modelValue', parseInt(v, 16))
  }
}

function selectColor(c: string) {
  hexInput.value = c
  emit('update:modelValue', parseInt(c.slice(1), 16))
  open.value = false
}
</script>

<style scoped>
.color-picker { display: flex; align-items: center; gap: 8px; position: relative; }
.color-preview { width: 32px; height: 32px; border-radius: 6px; cursor: pointer; border: 2px solid #40444b; }
.hex-input { background: #202225; color: #dcddde; border: 1px solid #40444b; border-radius: 4px; padding: 4px 8px; width: 90px; }
.palette { position: absolute; top: 40px; left: 0; background: #2f3136; border: 1px solid #40444b; border-radius: 8px; padding: 8px; display: grid; grid-template-columns: repeat(10, 24px); gap: 4px; z-index: 100; }
.swatch { width: 24px; height: 24px; border-radius: 4px; cursor: pointer; }
.swatch:hover { transform: scale(1.2); }
</style>
```

- [ ] Create `frontend/src/components/embed/EmbedFieldEditor.vue`

```vue
<template>
  <div class="fields-editor">
    <div v-for="(field, i) in fields" :key="i" class="field-row">
      <div class="field-inputs">
        <input v-model="field.name" placeholder="Field name" class="fh-input" />
        <textarea v-model="field.value" placeholder="Field value" class="fh-textarea" rows="2" />
        <label class="inline-toggle">
          <input type="checkbox" v-model="field.inline" />
          <span>Inline</span>
        </label>
      </div>
      <button @click="remove(i)" class="btn-danger-sm">✕</button>
    </div>
    <button @click="add" class="btn-add" :disabled="fields.length >= 25">+ Add field</button>
  </div>
</template>

<script setup lang="ts">
import type { DiscordEmbedField } from '../../types/discord'

const props = defineProps<{ fields: DiscordEmbedField[] }>()
const emit = defineEmits<{ (e: 'update:fields', v: DiscordEmbedField[]): void }>()

function add() {
  if (props.fields.length >= 25) return
  emit('update:fields', [...props.fields, { name: '', value: '', inline: false }])
}

function remove(i: number) {
  const next = [...props.fields]
  next.splice(i, 1)
  emit('update:fields', next)
}
</script>
```

- [ ] Create `frontend/src/components/embed/EmbedBuilder.vue`

```vue
<template>
  <div class="embed-builder">
    <div class="section">
      <label class="fh-label">Color</label>
      <EmbedColorPicker v-model="embed.color" />
    </div>
    <div class="section">
      <label class="fh-label">Author</label>
      <input v-model="embed.author!.name" placeholder="Author name" class="fh-input" />
      <input v-model="embed.author!.url" placeholder="Author URL" class="fh-input mt-1" />
      <input v-model="embed.author!.icon_url" placeholder="Author icon URL" class="fh-input mt-1" />
    </div>
    <div class="section">
      <label class="fh-label">Title</label>
      <input v-model="embed.title" placeholder="Embed title" class="fh-input" />
      <input v-model="embed.url" placeholder="Title URL (optional)" class="fh-input mt-1" />
    </div>
    <div class="section">
      <label class="fh-label">Description</label>
      <textarea v-model="embed.description" placeholder="Embed description — supports **bold**, *italic*, `code`" class="fh-textarea" rows="4" />
    </div>
    <div class="section">
      <label class="fh-label">Thumbnail URL</label>
      <input v-model="embed.thumbnail!.url" placeholder="https://..." class="fh-input" />
    </div>
    <div class="section">
      <label class="fh-label">Image URL</label>
      <input v-model="embed.image!.url" placeholder="https://..." class="fh-input" />
    </div>
    <div class="section">
      <label class="fh-label">Fields (max 25)</label>
      <EmbedFieldEditor :fields="embed.fields ?? []" @update:fields="embed.fields = $event" />
    </div>
    <div class="section">
      <label class="fh-label">Footer</label>
      <input v-model="embed.footer!.text" placeholder="Footer text" class="fh-input" />
      <input v-model="embed.footer!.icon_url" placeholder="Footer icon URL" class="fh-input mt-1" />
    </div>
    <div class="section">
      <label class="fh-label">Timestamp</label>
      <input type="datetime-local" v-model="timestampLocal" @change="embed.timestamp = new Date(timestampLocal).toISOString()" class="fh-input" />
      <button @click="embed.timestamp = new Date().toISOString()" class="btn-secondary mt-1">Now</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EmbedColorPicker from './EmbedColorPicker.vue'
import EmbedFieldEditor from './EmbedFieldEditor.vue'
import type { DiscordEmbed } from '../../types/discord'

const embed = defineModel<Partial<DiscordEmbed>>({ required: true })
const timestampLocal = ref('')
</script>
```

- [ ] Commit

```bash
git add frontend/src/components/embed/
git commit -m "feat: embed builder UI components — color picker, field editor, full embed form"
```

---

## Phase 4 — Views

### Task 9: EmbedBuilderView (main view)

**Files:**
- Create: `frontend/src/views/EmbedBuilderView.vue`
- Create: `frontend/src/views/LoginView.vue`
- Create: `frontend/src/views/SetupView.vue`

- [ ] Create `frontend/src/views/LoginView.vue`

```vue
<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="logo">⚒️ ForgeHook</div>
      <h1>Welcome back</h1>
      <form @submit.prevent="submit">
        <input v-model="password" type="password" placeholder="Admin password" class="fh-input" autofocus />
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Connecting...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(password.value)
    router.push('/')
  } catch {
    error.value = 'Wrong password'
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] Create `frontend/src/views/EmbedBuilderView.vue`

```vue
<template>
  <div class="builder-layout">
    <!-- Left: Editor -->
    <div class="editor-panel">
      <div class="panel-header">
        <h2>Message</h2>
        <div class="actions">
          <select v-model="embedStore.selectedWebhookId" class="fh-select">
            <option :value="null" disabled>Select webhook</option>
            <option v-for="w in webhookStore.webhooks" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
          <button @click="loadTemplate" class="btn-secondary">Load template</button>
          <button @click="saveTemplate" class="btn-secondary">Save as template</button>
        </div>
      </div>

      <!-- Message content -->
      <div class="section">
        <label class="fh-label">Content (plain text)</label>
        <textarea v-model="embedStore.message.content" placeholder="Message content — @mentions, plain text, markdown..." class="fh-textarea" rows="3" />
      </div>
      <div class="section row">
        <div class="half">
          <label class="fh-label">Override username</label>
          <input v-model="embedStore.message.username" placeholder="Bot name" class="fh-input" />
        </div>
        <div class="half">
          <label class="fh-label">Override avatar URL</label>
          <input v-model="embedStore.message.avatar_url" placeholder="https://..." class="fh-input" />
        </div>
      </div>

      <!-- Embeds -->
      <div v-for="(embed, i) in embedStore.message.embeds" :key="i" class="embed-section">
        <div class="embed-header">
          <h3>Embed {{ i + 1 }}</h3>
          <button @click="embedStore.removeEmbed(i)" class="btn-danger-sm">Remove</button>
        </div>
        <EmbedBuilder v-model="embedStore.message.embeds[i]" />
      </div>

      <button @click="embedStore.addEmbed()" class="btn-add" :disabled="embedStore.message.embeds.length >= 10">
        + Add embed
      </button>

      <!-- Send -->
      <div class="send-area">
        <input v-model="threadId" placeholder="Thread ID (optional)" class="fh-input w-half" />
        <button @click="send" class="btn-primary" :disabled="embedStore.sending || !embedStore.selectedWebhookId">
          {{ embedStore.sending ? 'Sending...' : '🚀 Send' }}
        </button>
        <button @click="embedStore.reset()" class="btn-danger">Clear</button>
      </div>
      <p v-if="embedStore.lastError" class="error">{{ embedStore.lastError }}</p>
      <p v-if="sent" class="success">✅ Sent successfully!</p>
    </div>

    <!-- Right: Preview -->
    <div class="preview-panel">
      <div class="panel-header"><h2>Preview</h2></div>
      <DiscordPreview :message="embedStore.message" :show-bot-tag="true" />
      <div class="json-section">
        <details>
          <summary>JSON payload</summary>
          <pre class="json-block">{{ JSON.stringify(embedStore.message, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import DiscordPreview from '../components/preview/DiscordPreview.vue'
import { useEmbedStore } from '../stores/embed'
import { useWebhooksStore } from '../stores/webhooks'
import { useUiStore } from '../stores/ui'

const embedStore = useEmbedStore()
const webhookStore = useWebhooksStore()
const ui = useUiStore()
const threadId = ref('')
const sent = ref(false)

onMounted(() => webhookStore.load())

async function send() {
  await embedStore.send(threadId.value || undefined)
  if (!embedStore.lastError) {
    sent.value = true
    setTimeout(() => { sent.value = false }, 3000)
    ui.notify('Message sent!')
  }
}

function saveTemplate() { /* Task 10 */ }
function loadTemplate() { /* Task 10 */ }
</script>
```

- [ ] Commit

```bash
git add frontend/src/views/
git commit -m "feat: embed builder view — split-pane editor + Discord preview"
```

---

### Task 10: Remaining views (Webhooks, Bots, Templates, History, RSS, Scheduler, Tutorials)

**Files:**
- Create: `frontend/src/views/WebhooksView.vue`
- Create: `frontend/src/views/BotsView.vue`
- Create: `frontend/src/views/TemplatesView.vue`
- Create: `frontend/src/views/HistoryView.vue`
- Create: `frontend/src/views/RssView.vue`
- Create: `frontend/src/views/SchedulerView.vue`
- Create: `frontend/src/views/TutorialsView.vue`
- Create: `frontend/src/views/TutorialEditorView.vue`
- Create: `frontend/src/views/DashboardView.vue`

- [ ] Create `frontend/src/views/WebhooksView.vue`

```vue
<template>
  <div class="page">
    <div class="page-header">
      <h1>Webhooks</h1>
      <button @click="showForm = true" class="btn-primary">+ Add webhook</button>
    </div>

    <!-- Category groups -->
    <div v-for="(group, cat) in grouped" :key="cat" class="category-group">
      <h3 class="category-label">{{ cat }}</h3>
      <div class="webhook-grid">
        <div v-for="w in group" :key="w.id" class="webhook-card">
          <div class="webhook-info">
            <img v-if="w.avatar_url" :src="w.avatar_url" class="wh-avatar" />
            <div>
              <div class="wh-name">{{ w.name }}</div>
              <div class="wh-url">{{ w.url.slice(0, 50) }}...</div>
              <div v-if="w.username" class="wh-username">Username: {{ w.username }}</div>
            </div>
          </div>
          <div class="webhook-actions">
            <button @click="test(w.id)" class="btn-secondary">Test</button>
            <button @click="useInBuilder(w.id)" class="btn-secondary">Use</button>
            <button @click="startEdit(w)" class="btn-secondary">Edit</button>
            <button @click="remove(w.id)" class="btn-danger-sm">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editing ? 'Edit webhook' : 'Add webhook' }}</h3>
        <input v-model="form.name" placeholder="Name" class="fh-input" />
        <input v-model="form.url" placeholder="https://discord.com/api/webhooks/..." class="fh-input mt-1" />
        <input v-model="form.username" placeholder="Override username (optional)" class="fh-input mt-1" />
        <input v-model="form.avatar_url" placeholder="Override avatar URL (optional)" class="fh-input mt-1" />
        <input v-model="form.category" placeholder="Category" class="fh-input mt-1" />
        <div class="modal-actions">
          <button @click="submit" class="btn-primary">{{ editing ? 'Update' : 'Add' }}</button>
          <button @click="closeForm" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWebhooksStore } from '../stores/webhooks'
import { useEmbedStore } from '../stores/embed'
import { useUiStore } from '../stores/ui'
import { useRouter } from 'vue-router'
import type { Webhook } from '../types/app'

const store = useWebhooksStore()
const embedStore = useEmbedStore()
const ui = useUiStore()
const router = useRouter()
const showForm = ref(false)
const editing = ref<Webhook | null>(null)
const form = ref({ name: '', url: '', username: '', avatar_url: '', category: 'default' })

const grouped = computed(() => {
  return store.webhooks.reduce((acc, w) => {
    if (!acc[w.category]) acc[w.category] = []
    acc[w.category].push(w)
    return acc
  }, {} as Record<string, Webhook[]>)
})

onMounted(() => store.load())

async function submit() {
  if (editing.value) await store.update(editing.value.id, form.value as any)
  else await store.create(form.value as any)
  closeForm()
  ui.notify(editing.value ? 'Webhook updated' : 'Webhook added')
}

function startEdit(w: Webhook) {
  editing.value = w
  form.value = { name: w.name, url: w.url, username: w.username ?? '', avatar_url: w.avatar_url ?? '', category: w.category }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
  form.value = { name: '', url: '', username: '', avatar_url: '', category: 'default' }
}

async function test(id: number) {
  const r = await store.test(id)
  ui.notify(r.ok ? 'Webhook OK ✓' : `Test failed: ${r.error}`, r.ok ? 'success' : 'error')
}

function useInBuilder(id: number) {
  embedStore.selectedWebhookId = id
  router.push('/embed')
}

async function remove(id: number) {
  await store.remove(id)
  ui.notify('Webhook removed')
}
</script>
```

- [ ] Create `frontend/src/views/TutorialEditorView.vue`

```vue
<template>
  <div class="tutorial-editor">
    <div class="editor-header">
      <input v-model="tutorial.title" placeholder="Tutorial title" class="fh-input title-input" />
      <button @click="save" class="btn-primary">Save</button>
      <button @click="preview = !preview" class="btn-secondary">{{ preview ? 'Edit' : 'Preview' }}</button>
    </div>
    <input v-model="tutorial.description" placeholder="Short description..." class="fh-input mb-4" />

    <!-- Block editor -->
    <div v-if="!preview" class="blocks-editor">
      <div v-for="(block, i) in tutorial.blocks" :key="block.id" class="block-wrapper">
        <div class="block-toolbar">
          <span class="block-type-badge">{{ block.type }}</span>
          <button @click="moveUp(i)" :disabled="i === 0">↑</button>
          <button @click="moveDown(i)" :disabled="i === tutorial.blocks.length - 1">↓</button>
          <button @click="removeBlock(i)" class="btn-danger-sm">✕</button>
        </div>

        <!-- Text block -->
        <textarea v-if="block.type === 'text'" v-model="block.content" placeholder="Text content (supports **bold**, *italic*, etc.)" class="fh-textarea" rows="4" />

        <!-- Image block -->
        <div v-else-if="block.type === 'image'" class="image-block">
          <input v-model="block.content.url" placeholder="Image URL" class="fh-input" />
          <input v-model="block.content.caption" placeholder="Caption (optional)" class="fh-input mt-1" />
          <img v-if="block.content.url" :src="block.content.url" class="preview-image" />
        </div>

        <!-- Video block -->
        <div v-else-if="block.type === 'video'" class="video-block">
          <input v-model="block.content.url" placeholder="Video URL (YouTube, direct MP4...)" class="fh-input" />
          <input v-model="block.content.caption" placeholder="Caption (optional)" class="fh-input mt-1" />
        </div>

        <!-- Code block -->
        <div v-else-if="block.type === 'code'" class="code-block">
          <input v-model="block.content.language" placeholder="Language (js, py, rs...)" class="fh-input mb-1" style="width:120px" />
          <textarea v-model="block.content.code" placeholder="Code..." class="fh-textarea code-textarea" rows="6" spellcheck="false" />
        </div>

        <!-- Embed block -->
        <div v-else-if="block.type === 'embed'" class="embed-block-editor">
          <EmbedBuilder v-model="block.content" />
        </div>

        <!-- Separator -->
        <div v-else-if="block.type === 'separator'" class="separator-preview">
          <hr />
        </div>
      </div>

      <!-- Add block buttons -->
      <div class="add-blocks">
        <button v-for="type in blockTypes" :key="type" @click="addBlock(type)" class="btn-add-block">+ {{ type }}</button>
      </div>
    </div>

    <!-- Preview mode -->
    <div v-else class="tutorial-preview-render">
      <h1>{{ tutorial.title }}</h1>
      <p v-if="tutorial.description" class="tut-desc">{{ tutorial.description }}</p>
      <div v-for="block in tutorial.blocks" :key="block.id" class="rendered-block">
        <div v-if="block.type === 'text'" v-html="renderText(block.content)" class="text-block-render" />
        <figure v-else-if="block.type === 'image'" class="image-render">
          <img :src="block.content.url" />
          <figcaption v-if="block.content.caption">{{ block.content.caption }}</figcaption>
        </figure>
        <div v-else-if="block.type === 'video'" class="video-render">
          <iframe v-if="isYoutube(block.content.url)" :src="youtubeEmbed(block.content.url)" allowfullscreen />
          <video v-else :src="block.content.url" controls />
          <p v-if="block.content.caption" class="caption">{{ block.content.caption }}</p>
        </div>
        <div v-else-if="block.type === 'code'" class="code-render">
          <div class="code-lang">{{ block.content.language }}</div>
          <pre><code>{{ block.content.code }}</code></pre>
        </div>
        <EmbedPreview v-else-if="block.type === 'embed'" :embed="block.content" />
        <hr v-else-if="block.type === 'separator'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import EmbedPreview from '../components/preview/EmbedPreview.vue'
import api from '../api/client'
import { useUiStore } from '../stores/ui'
import type { Tutorial, TutorialBlock } from '../types/app'
import { emptyEmbed } from '../types/discord'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const preview = ref(false)
const blockTypes = ['text', 'image', 'video', 'embed', 'code', 'separator'] as const

const tutorial = ref<Tutorial>({ id: 0, title: '', description: '', blocks: [], published: 0 })

onMounted(async () => {
  const id = route.params.id
  if (id !== 'new') {
    const { data } = await api.get(`/tutorials/${id}`)
    tutorial.value = data
  }
})

function addBlock(type: TutorialBlock['type']) {
  const defaults: Record<string, any> = {
    text: '',
    image: { url: '', caption: '' },
    video: { url: '', caption: '' },
    code: { language: 'js', code: '' },
    embed: emptyEmbed(),
    separator: null,
  }
  tutorial.value.blocks.push({ id: crypto.randomUUID(), type, content: defaults[type] })
}

function removeBlock(i: number) { tutorial.value.blocks.splice(i, 1) }
function moveUp(i: number) { if (i > 0) { const b = tutorial.value.blocks; [b[i-1], b[i]] = [b[i], b[i-1]] } }
function moveDown(i: number) { const b = tutorial.value.blocks; if (i < b.length - 1) [b[i], b[i+1]] = [b[i+1], b[i]] }

async function save() {
  if (tutorial.value.id) {
    await api.put(`/tutorials/${tutorial.value.id}`, tutorial.value)
  } else {
    const { data } = await api.post('/tutorials', tutorial.value)
    tutorial.value.id = data.id
    router.replace(`/tutorials/${data.id}`)
  }
  ui.notify('Tutorial saved')
}

function renderText(t: string): string {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n/g, '<br>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
}

function isYoutube(url: string) { return url.includes('youtube.com') || url.includes('youtu.be') }
function youtubeEmbed(url: string) {
  const id = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]
  return `https://www.youtube.com/embed/${id}`
}
</script>
```

- [ ] Commit

```bash
git add frontend/src/views/
git commit -m "feat: views — webhooks, tutorial editor with text/image/video/embed/code blocks"
```

---

## Phase 5 — Layout + Styles

### Task 11: App layout + global styles

**Files:**
- Create: `frontend/src/App.vue`
- Create: `frontend/src/assets/main.css`
- Create: `frontend/src/components/shared/AppNav.vue`
- Create: `frontend/src/components/shared/AppNotification.vue`

- [ ] Create `frontend/src/components/shared/AppNav.vue`

```vue
<template>
  <nav class="sidebar" :class="{ collapsed: !ui.sidebarOpen }">
    <div class="sidebar-logo">
      <span class="logo-icon">⚒️</span>
      <span class="logo-text" v-if="ui.sidebarOpen">ForgeHook</span>
    </div>
    <div class="nav-items">
      <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item">
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label" v-if="ui.sidebarOpen">{{ item.label }}</span>
      </router-link>
    </div>
    <button @click="ui.sidebarOpen = !ui.sidebarOpen" class="collapse-btn">
      {{ ui.sidebarOpen ? '◀' : '▶' }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useUiStore } from '../../stores/ui'

const ui = useUiStore()
const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/embed', icon: '⚡', label: 'Embed Builder' },
  { to: '/webhooks', icon: '🔗', label: 'Webhooks' },
  { to: '/bots', icon: '🤖', label: 'Bots' },
  { to: '/rss', icon: '📰', label: 'RSS Feeds' },
  { to: '/tutorials', icon: '📖', label: 'Tutorials' },
  { to: '/scheduler', icon: '⏰', label: 'Scheduler' },
  { to: '/history', icon: '📜', label: 'History' },
  { to: '/templates', icon: '📋', label: 'Templates' },
]
</script>

<style scoped>
.sidebar { width: 220px; min-height: 100vh; background: #202225; display: flex; flex-direction: column; transition: width 0.2s; border-right: 1px solid #2f3136; }
.sidebar.collapsed { width: 60px; }
.sidebar-logo { padding: 20px 16px; display: flex; align-items: center; gap: 10px; }
.logo-icon { font-size: 24px; }
.logo-text { font-size: 18px; font-weight: 700; color: #5865f2; }
.nav-items { flex: 1; padding: 8px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 6px; text-decoration: none; color: #8e9297; transition: all 0.15s; margin-bottom: 2px; }
.nav-item:hover, .nav-item.router-link-active { background: #2f3136; color: #dcddde; }
.nav-item.router-link-active { color: #5865f2; }
.nav-icon { font-size: 18px; width: 24px; text-align: center; }
.collapse-btn { margin: 8px; background: none; border: none; color: #8e9297; cursor: pointer; padding: 8px; }
</style>
```

- [ ] Create `frontend/src/App.vue`

```vue
<template>
  <div class="app" :data-theme="ui.theme">
    <template v-if="isAuthRoute">
      <router-view />
    </template>
    <template v-else>
      <AppNav />
      <main class="main-content">
        <router-view />
      </main>
    </template>
    <AppNotification />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from './stores/ui'
import AppNav from './components/shared/AppNav.vue'
import AppNotification from './components/shared/AppNotification.vue'

const route = useRoute()
const ui = useUiStore()
const isAuthRoute = computed(() => ['/login', '/setup'].includes(route.path))
</script>

<style>
:root {
  --bg-primary: #36393f;
  --bg-secondary: #2f3136;
  --bg-tertiary: #202225;
  --text-primary: #dcddde;
  --text-muted: #8e9297;
  --accent: #5865f2;
  --success: #57f287;
  --danger: #ed4245;
  --warning: #fee75c;
  --border: #40444b;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg-primary); color: var(--text-primary); font-family: 'gg sans', 'Noto Sans', system-ui, sans-serif; }
.app { display: flex; min-height: 100vh; }
.main-content { flex: 1; padding: 24px; overflow-y: auto; }
.page { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 700; }
.section { margin-bottom: 16px; }
.fh-label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
.fh-input { width: 100%; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; padding: 8px 12px; font-size: 14px; }
.fh-textarea { width: 100%; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; padding: 8px 12px; font-size: 14px; resize: vertical; }
.fh-select { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; padding: 8px 12px; }
.btn-primary { background: var(--accent); color: #fff; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer; font-weight: 600; }
.btn-primary:hover { background: #4752c4; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; padding: 8px 16px; cursor: pointer; }
.btn-danger { background: var(--danger); color: #fff; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer; }
.btn-danger-sm { background: none; border: none; color: var(--danger); cursor: pointer; font-size: 16px; padding: 2px 6px; }
.btn-add { background: none; border: 1px dashed var(--border); color: var(--text-muted); border-radius: 4px; padding: 8px 16px; cursor: pointer; width: 100%; margin-top: 8px; }
.error { color: var(--danger); font-size: 14px; margin-top: 4px; }
.success { color: var(--success); font-size: 14px; margin-top: 4px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal { background: var(--bg-secondary); border-radius: 8px; padding: 24px; width: 480px; }
.modal h3 { margin-bottom: 16px; }
.modal-actions { display: flex; gap: 8px; margin-top: 16px; }
.builder-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: calc(100vh - 48px); overflow: hidden; }
.editor-panel, .preview-panel { overflow-y: auto; padding: 16px; background: var(--bg-secondary); border-radius: 8px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.panel-header h2 { font-size: 18px; font-weight: 700; }
.panel-header .actions { display: flex; gap: 8px; flex-wrap: wrap; }
.embed-section { background: var(--bg-tertiary); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.embed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.send-area { display: flex; gap: 8px; align-items: center; margin-top: 16px; }
.json-section { margin-top: 16px; }
.json-block { background: var(--bg-tertiary); padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto; }
.mt-1 { margin-top: 4px; }
.mb-4 { margin-bottom: 16px; }
.row { display: flex; gap: 12px; }
.half { flex: 1; }
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); }
.auth-card { background: var(--bg-secondary); padding: 40px; border-radius: 12px; width: 380px; }
.auth-card .logo { font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 24px; color: var(--accent); }
.auth-card h1 { font-size: 20px; margin-bottom: 20px; text-align: center; }
.auth-card .fh-input { margin-bottom: 12px; }
.w-full { width: 100%; }
.w-half { width: 200px; }
</style>
```

- [ ] Create `frontend/src/components/shared/AppNotification.vue`

```vue
<template>
  <Transition name="notif">
    <div v-if="ui.notification" :class="['notification', ui.notification.type]">
      {{ ui.notification.msg }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useUiStore } from '../../stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.notification { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; font-weight: 600; z-index: 9999; }
.notification.success { background: #57f287; color: #000; }
.notification.error { background: #ed4245; color: #fff; }
.notification.info { background: #5865f2; color: #fff; }
.notif-enter-active, .notif-leave-active { transition: all 0.3s; }
.notif-enter-from, .notif-leave-to { opacity: 0; transform: translateY(20px); }
</style>
```

- [ ] Commit

```bash
git add frontend/src/
git commit -m "feat: app layout, nav sidebar, global CSS design system, notifications"
```

---

## Phase 6 — Docker + Deploy

### Task 12: Docker + nginx + .env

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/Dockerfile.backend`
- Create: `docker/Dockerfile.frontend`
- Create: `docker/nginx.conf`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] Create `.gitignore`

```gitignore
node_modules/
dist/
.env
*.db
data/
.logs/
target/
src-tauri/target/
```

- [ ] Create `.env.example`

```env
JWT_SECRET=change_this_to_a_random_64_char_string
DB_PATH=/app/data/forgehook.db
PORT=3020
ALLOWED_ORIGIN=https://forgehook.heiphaistos.org
```

- [ ] Create `docker/Dockerfile.backend`

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p /app/data && chown app:app /app/data
USER app
EXPOSE 3020
CMD ["node", "dist/index.js"]
```

- [ ] Create `docker/Dockerfile.frontend`

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] Create `docker/nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    server_tokens off;

    location /api/ {
        proxy_pass http://forgehook-backend:3020/api/;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] Create `docker/docker-compose.yml`

```yaml
services:
  forgehook-backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    env_file: ../.env
    volumes:
      - forgehook-data:/app/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3020/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  forgehook-frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "127.0.0.1:3021:80"
    depends_on:
      forgehook-backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  forgehook-data:
```

- [ ] Add `backend/package.json` scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "type": "module"
}
```

- [ ] Add `frontend/vite.config.ts` with proxy for dev

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3020', changeOrigin: true },
    },
  },
})
```

- [ ] Commit

```bash
git add docker/ .gitignore .env.example
git commit -m "feat: Docker multi-stage build, nginx reverse proxy, compose setup"
```

---

## Phase 7 — Desktop (Tauri v2)

### Task 13: Tauri v2 wrapper

**Files:**
- Create: `desktop/src-tauri/Cargo.toml`
- Create: `desktop/src-tauri/tauri.conf.json`
- Create: `desktop/src-tauri/src/main.rs`
- Create: `desktop/src-tauri/src/lib.rs`
- Create: `desktop/package.json`

- [ ] Init Tauri in desktop/

```bash
cd desktop
npm create tauri-app@latest . -- --template vue-ts --manager npm
# Then replace the frontend src with symlink or copy from ../frontend
```

- [ ] Create `desktop/src-tauri/tauri.conf.json`

```json
{
  "productName": "ForgeHook",
  "version": "1.0.0",
  "identifier": "org.heiphaistos.forgehook",
  "build": {
    "frontendDist": "../frontend/dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev --prefix ../frontend",
    "beforeBuildCommand": "npm run build --prefix ../frontend"
  },
  "app": {
    "windows": [
      {
        "title": "ForgeHook",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 700
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"]
  }
}
```

- [ ] Create `desktop/src-tauri/Cargo.toml`

```toml
[package]
name = "forgehook-desktop"
version = "1.0.0"
edition = "2021"

[dependencies]
tauri = { version = "2", features = [] }
rusqlite = { version = "0.31", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["rt-multi-thread"] }
reqwest = { version = "0.12", features = ["json"] }

[profile.release]
lto = true
strip = true
```

- [ ] Create `desktop/src-tauri/src/lib.rs`

```rust
use tauri::Manager;

mod db;
mod commands;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db = db::init(app.path().app_data_dir()?.join("forgehook.db"))?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::webhooks::list_webhooks,
            commands::webhooks::add_webhook,
            commands::webhooks::delete_webhook,
            commands::discord::send_webhook,
            commands::discord::test_webhook,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] Commit

```bash
git add desktop/
git commit -m "feat: Tauri v2 desktop wrapper — Windows exe build"
```

---

## Final Tasks

### Task 14: .gitignore, README, VPS deploy script

- [ ] Create `deploy.sh` (run on VPS)

```bash
#!/bin/bash
set -e
cd /opt/forgehook
git pull origin main
docker compose -f docker/docker-compose.yml build --no-cache
docker compose -f docker/docker-compose.yml up -d
echo "[$(date -Iseconds)] [INFO] ForgeHook deployed" >> .logs/deploy.log
```

- [ ] VPS nginx vhost at `/etc/nginx/sites-available/forgehook`

```nginx
server {
    listen 443 ssl;
    server_name forgehook.heiphaistos.org;

    ssl_certificate /etc/letsencrypt/live/forgehook.heiphaistos.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/forgehook.heiphaistos.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3021;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
server { listen 80; server_name forgehook.heiphaistos.org; return 301 https://$host$request_uri; }
```

- [ ] Commit + push

```bash
git add .
git commit -m "feat: deploy script + VPS nginx config"
git push origin main
```

---

## Self-review: Spec coverage

| Requirement | Covered |
|-------------|---------|
| Web app | ✅ Vue 3 + Hono.js + Docker |
| Windows .exe | ✅ Tauri v2 Task 13 |
| Discord embeds (all fields) | ✅ Task 7-8 |
| Webhook manager CRUD | ✅ Task 3, 9 |
| Bot manager | ✅ Task 4 |
| RSS → Discord | ✅ Task 4 |
| Scheduler | ✅ Task 4 |
| Templates | ✅ Task 4 |
| History | ✅ Task 4 |
| Tutorial builder with media | ✅ Task 10 |
| Real-time preview | ✅ Task 7 |
| VPS deploy | ✅ Task 14 |
| Auth | ✅ Task 2 |
| JSON export | ✅ EmbedBuilderView |
| Thread support | ✅ discord service |
