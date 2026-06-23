import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'
const { verify } = jwt

export const requireAuth = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload = verify(token, process.env.JWT_SECRET!) as { id: number }
    c.set('userId' as never, payload.id)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
