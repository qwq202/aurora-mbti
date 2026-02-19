import { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

export const AUTH_COOKIE_NAME = 'aurora_auth_session'
const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 8

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

function bytesToBase64Url(input: Buffer | string) {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToUtf8(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString('utf-8')
}

function readSessionSecret() {
  const creds = readAdminCredentials()
  return process.env.ADMIN_SESSION_SECRET?.trim() || `${creds.username}:${creds.password}`
}

function sign(payloadEncoded: string) {
  return bytesToBase64Url(createHmac('sha256', readSessionSecret()).update(payloadEncoded).digest())
}

export function createAdminSessionToken(username: string) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    username,
    iat: now,
    exp: now + AUTH_SESSION_TTL_SECONDS,
  }
  const payloadEncoded = bytesToBase64Url(JSON.stringify(payload))
  const signature = sign(payloadEncoded)
  return `v1.${payloadEncoded}.${signature}`
}

export function isAuthAuthorized(request: NextRequest) {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value?.trim() || ''
  if (!sessionToken) return false

  const creds = readAdminCredentials()
  if (!creds.username || !creds.password) return false

  const parts = sessionToken.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return false

  const payloadEncoded = parts[1]
  const signature = parts[2]
  const expectedSignature = sign(payloadEncoded)
  const left = Buffer.from(signature)
  const right = Buffer.from(expectedSignature)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false

  try {
    const payload = JSON.parse(base64UrlToUtf8(payloadEncoded)) as {
      username?: string
      exp?: number
    }

    const now = Math.floor(Date.now() / 1000)
    if (!payload.username || payload.username !== creds.username) return false
    if (!payload.exp || payload.exp <= now) return false
    return true
  } catch {
    return false
  }
}
