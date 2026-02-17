import { NextRequest } from 'next/server'

export const ADMIN_COOKIE_NAME = 'aurora_admin_token'

function readAdminToken() {
  const token = process.env.ADMIN_TOKEN
  return typeof token === 'string' ? token.trim() : ''
}

export function isAdminConfigured() {
  return Boolean(readAdminToken())
}

export function isAdminAuthorized(request: NextRequest) {
  const adminToken = readAdminToken()
  if (!adminToken) return false

  const headerToken = request.headers.get('x-admin-token')?.trim() || ''
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value?.trim() || ''
  return headerToken === adminToken || cookieToken === adminToken
}

export function validateAdminToken(input: string | undefined) {
  const adminToken = readAdminToken()
  if (!adminToken) return false
  return (input || '').trim() === adminToken
}
