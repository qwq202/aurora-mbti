import { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, createAdminSessionToken, isAuthConfigured, validateCredentials } from '@/lib/auth'
import { apiError, apiOk } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }

  let payload: { username?: string; password?: string } | null = null
  try {
    payload = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON payload.', 400)
  }

  if (!payload?.username || !payload?.password) {
    return apiError('BAD_REQUEST', 'Username and password are required.', 400)
  }

  if (!validateCredentials(payload.username, payload.password)) {
    return apiError('UNAUTHORIZED', 'Invalid username or password.', 401)
  }

  const sessionToken = createAdminSessionToken(payload.username.trim())

  const response = apiOk()
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 小时
  })

  return response
}
