import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { mkdirSync, writeFileSync, readdirSync, statSync, unlinkSync, readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/app/data/uploads'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
}
const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://forgehook.heiphaistos.org'

export const uploadRoutes = new Hono()

// Public — serve uploaded images without auth
uploadRoutes.get('/file/:filename', (c) => {
  mkdirSync(UPLOAD_DIR, { recursive: true })
  const raw = c.req.param('filename')
  const filename = raw.replace(/[^a-z0-9._-]/gi, '')
  const ext = extname(filename).toLowerCase()
  const path = join(UPLOAD_DIR, filename)
  if (!ALLOWED.includes(ext) || !existsSync(path)) return c.json({ error: 'Not found' }, 404)
  const data = readFileSync(path)
  return c.body(data, 200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000',
  })
})

// Protected routes
uploadRoutes.use('*', requireAuth)

uploadRoutes.post('/', async (c) => {
  mkdirSync(UPLOAD_DIR, { recursive: true })
  const body = await c.req.parseBody()
  const file = body['file'] as File | undefined
  if (!file || !(file instanceof File)) return c.json({ error: 'No file' }, 400)
  if (file.size > MAX_SIZE) return c.json({ error: 'File too large (max 5MB)' }, 413)
  const ext = extname(file.name).toLowerCase()
  if (!ALLOWED.includes(ext)) return c.json({ error: `Type non autorisé. Accepté: ${ALLOWED.join(', ')}` }, 415)
  const filename = `${randomUUID()}${ext}`
  writeFileSync(join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))
  return c.json({ url: `${PUBLIC_URL}/api/uploads/file/${filename}` }, 201)
})

uploadRoutes.get('/list', (c) => {
  mkdirSync(UPLOAD_DIR, { recursive: true })
  const files = readdirSync(UPLOAD_DIR)
    .filter(f => ALLOWED.some(ext => f.endsWith(ext)))
    .map(f => ({
      name: f,
      url: `${PUBLIC_URL}/api/uploads/file/${f}`,
      size: statSync(join(UPLOAD_DIR, f)).size,
    }))
  return c.json(files)
})

uploadRoutes.delete('/:filename', (c) => {
  const filename = c.req.param('filename').replace(/[^a-z0-9._-]/gi, '')
  try {
    unlinkSync(join(UPLOAD_DIR, filename))
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Not found' }, 404)
  }
})
