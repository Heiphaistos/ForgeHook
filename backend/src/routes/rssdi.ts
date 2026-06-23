import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'

const RSSDI_URL = process.env.RSSDI_URL ?? 'https://rssdi.heiphaistos.org'

export const rssdiRoutes = new Hono()
rssdiRoutes.use('*', requireAuth)

async function proxyRssdi(path: string, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${RSSDI_URL}${path}`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  })
}

rssdiRoutes.get('/me', async (c) => {
  const token = c.req.header('X-Rssdi-Token') ?? null
  try {
    const res = await proxyRssdi('/api/v1/auth/me', token)
    if (!res.ok) return c.json({ error: `RSSDI ${res.status}`, hint: 'Token invalide ou expiré' }, res.status as any)
    return c.json(await res.json())
  } catch (e: any) {
    return c.json({ error: 'RSSDI inaccessible', hint: e.message }, 502)
  }
})

rssdiRoutes.get('/feeds', async (c) => {
  const token = c.req.header('X-Rssdi-Token') ?? null
  try {
    const res = await proxyRssdi('/api/v1/fluxes', token)
    if (!res.ok) return c.json({ error: `RSSDI ${res.status}`, hint: 'Token invalide ou RSSDI inaccessible' }, res.status as any)
    const data = await res.json() as any
    const feeds = Array.isArray(data) ? data : (data.feeds ?? data.items ?? [])
    return c.json(feeds)
  } catch (e: any) {
    return c.json({ error: 'RSSDI inaccessible', hint: e.message }, 502)
  }
})
