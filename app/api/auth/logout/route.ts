import { AUTH_COOKIE_NAME } from '@/lib/auth'
import { apiOk } from '@/lib/api-response'

// 统一登出入口，清除认证会话 Cookie
// 使用 expires 过去日期而非 maxAge:0，确保浏览器可靠删除
export async function POST() {
  const response = apiOk()
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
  return response
}
