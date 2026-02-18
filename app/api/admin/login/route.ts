import { NextRequest } from 'next/server'
import { ADMIN_COOKIE_NAME, isAdminConfigured, validateAdminToken } from '@/lib/admin-auth'
import { apiError, apiOk } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_TOKEN is not configured on server.', 503)
  }

  let payload: { token?: string } | null = null
  try {
    payload = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON payload.', 400)
  }

  if (!validateAdminToken(payload?.token)) {
    return apiError('UNAUTHORIZED', 'Invalid admin token.', 401)
  }

  const response = apiOk()
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: payload?.token?.trim() || '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
