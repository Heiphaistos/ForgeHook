import { createMiddleware } from 'hono/factory'
import { verify } from 'jsonwebtoken'

export const requireAuth = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload = verify(token, process.env.JWT_SECRET ?? 'changeme') as { id: number }
    c.set('userId' as never, payload.id)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
