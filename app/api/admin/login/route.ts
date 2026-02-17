import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, isAdminConfigured, validateAdminToken } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { success: false, error: 'ADMIN_TOKEN is not configured on server.' },
      { status: 503 }
    )
  }

  let payload: { token?: string } | null = null
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload.' },
      { status: 400 }
    )
  }

  if (!validateAdminToken(payload?.token)) {
    return NextResponse.json(
      { success: false, error: 'Invalid admin token.' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ success: true })
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
