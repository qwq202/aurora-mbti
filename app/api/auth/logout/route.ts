import { AUTH_COOKIE_NAME } from '@/lib/auth'
import { apiOk } from '@/lib/api-response'

// 统一登出入口，清除认证会话 Cookie
export async function POST() {
  const response = apiOk()
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
