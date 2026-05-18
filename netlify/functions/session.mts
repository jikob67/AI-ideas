import type { Config, Context } from '@netlify/functions'
import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_COOKIE = 'session'
const MAX_AGE_SECONDS = 24 * 60 * 60 // 24 hours

function signPayload(data: object, secret: string): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function verifyPayload(token: string, secret: string): object | null {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return null

  const payload = token.slice(0, dotIndex)
  const sig = token.slice(dotIndex + 1)

  const expected = createHmac('sha256', secret).update(payload).digest('base64url')

  try {
    if (!timingSafeEqual(Buffer.from(sig, 'base64url'), Buffer.from(expected, 'base64url'))) {
      return null
    }
  } catch {
    return null
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}

export default async (req: Request, context: Context) => {
  const secret = Netlify.env.get('SESSION_SECRET') || 'ai-ideas-secret'

  // GET /api/session — read current session
  if (req.method === 'GET') {
    const cookie = context.cookies.get(SESSION_COOKIE)
    if (!cookie) {
      return Response.json({ session: null })
    }
    const data = verifyPayload(cookie, secret)
    return Response.json({ session: data })
  }

  // POST /api/session — create or update session
  if (req.method === 'POST') {
    const body = await req.json()
    const token = signPayload(body, secret)
    context.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: MAX_AGE_SECONDS,
    })
    return Response.json({ ok: true })
  }

  // DELETE /api/session — destroy session
  if (req.method === 'DELETE') {
    context.cookies.delete(SESSION_COOKIE)
    return Response.json({ ok: true })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config: Config = {
  path: '/api/session',
}
