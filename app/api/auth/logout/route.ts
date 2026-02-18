import { AUTH_COOKIE_NAME } from '@/lib/auth'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth'
import { apiError } from '@/lib/api-response'

export async function POST() {
  const response = apiError(
    'DEPRECATED',
    'Deprecated endpoint. Use /api/admin/logout.',
    410
  )

  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
