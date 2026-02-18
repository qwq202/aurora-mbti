import { NextRequest } from 'next/server'

export const AUTH_COOKIE_NAME = 'aurora_auth_session'

function readAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || '',
    password: process.env.ADMIN_PASSWORD || '',
  }
}

export function isAuthConfigured() {
  const creds = readAdminCredentials()
  return Boolean(creds.username && creds.password)
}

export function validateCredentials(username: string, password: string) {
  const creds = readAdminCredentials()
  if (!creds.username || !creds.password) {
    return false
  }
  return username === creds.username && password === creds.password
}

export function isAuthAuthorized(request: NextRequest) {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value?.trim() || ''
  if (!sessionToken) return false

  const creds = readAdminCredentials()
  if (!creds.username || !creds.password) return false

  const expectedToken = Buffer.from(`${creds.username}:${creds.password}`).toString('base64')
  return sessionToken === expectedToken
}
