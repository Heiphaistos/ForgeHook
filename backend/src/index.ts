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
import { uploadRoutes } from './routes/uploads.js'
import { rssdiRoutes } from './routes/rssdi.js'
import { startScheduler } from './services/scheduler.js'
import { startRssPoller } from './services/rss.js'
import { mkdirSync } from 'fs'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN ?? '*',
  credentials: true,
}))

app.route('/api/auth', authRoutes)
app.route('/api/webhooks', webhookRoutes)
app.route('/api/bots', botRoutes)
app.route('/api/templates', templateRoutes)
app.route('/api/history', historyRoutes)
app.route('/api/scheduler', schedulerRoutes)
app.route('/api/rss', rssRoutes)
app.route('/api/tutorials', tutorialRoutes)
app.route('/api/discord', discordRoutes)
app.route('/api/uploads', uploadRoutes)
app.route('/api/rssdi', rssdiRoutes)
mkdirSync(process.env.UPLOAD_DIR ?? '/app/data/uploads', { recursive: true })

app.get('/health', (c) => c.json({ ok: true, version: '2.0.0', app: 'forgehook' }))

app.onError((err, c) => {
  console.error('[error]', err)
  return c.json({ error: 'Internal server error' }, 500)
})

startScheduler()
startRssPoller()

const port = Number(process.env.PORT ?? 3020)
serve({ fetch: app.fetch, port }, () => {
  console.log(`[forgehook] Backend running on :${port}`)
})
