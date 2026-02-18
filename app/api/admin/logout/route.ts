import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth'
import { apiOk } from '@/lib/api-response'

export async function POST() {
  const response = apiOk()
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
