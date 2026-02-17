import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
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
