import type { NextRequest } from 'next/server'

export const ANON_SESSION_COOKIE_NAME = 'aurora_anon_session'
const ANON_SESSION_TTL_SECONDS = 60 * 60 * 12

type SessionPayload = {
  sid: string
  iat: number
  exp: number
  fp: string
}

declare global {
  var __auroraAnonSecret: string | undefined
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const value of bytes) {
    binary += String.fromCharCode(value)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function getRuntimeSecret() {
  if (globalThis.__auroraAnonSecret) return globalThis.__auroraAnonSecret
  const random = new Uint8Array(32)
  crypto.getRandomValues(random)
  globalThis.__auroraAnonSecret = bytesToBase64Url(random)
  return globalThis.__auroraAnonSecret
}

function getSecret() {
  const fromEnv = process.env.ANON_AUTH_SECRET?.trim() || ''
  return fromEnv || getRuntimeSecret()
}

function resolveClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  return forwarded || realIp || 'unknown'
}

async function sha256Text(input: string) {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return bytesToBase64Url(new Uint8Array(hash))
}

async function signText(input: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input))
  return bytesToBase64Url(new Uint8Array(signature))
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let diff = 0
  for (let index = 0; index < left.length; index++) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return diff === 0
}

export async function createAnonymousSessionToken(request: NextRequest) {
  const now = Math.floor(Date.now() / 1000)
  const sid = crypto.randomUUID().replace(/-/g, '')
  const fingerprint = await sha256Text(`${resolveClientIp(request)}|${request.headers.get('user-agent') || ''}`)
  const payload: SessionPayload = {
    sid,
    iat: now,
    exp: now + ANON_SESSION_TTL_SECONDS,
    fp: fingerprint,
  }
  const payloadEncoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await signText(payloadEncoded, getSecret())
  return `v1.${payloadEncoded}.${signature}`
}

export async function verifyAnonymousSessionToken(request: NextRequest, token: string) {
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') {
    return { valid: false as const }
  }

  const [, payloadEncoded, signature] = parts
  const expectedSignature = await signText(payloadEncoded, getSecret())
  if (!constantTimeEqual(signature, expectedSignature)) {
    return { valid: false as const }
  }

  let payload: SessionPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadEncoded))) as SessionPayload
  } catch {
    return { valid: false as const }
  }

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp <= now) {
    return { valid: false as const }
  }

  const fingerprint = await sha256Text(`${resolveClientIp(request)}|${request.headers.get('user-agent') || ''}`)
  if (!constantTimeEqual(payload.fp, fingerprint)) {
    return { valid: false as const }
  }

  if (!payload.sid || typeof payload.sid !== 'string') {
    return { valid: false as const }
  }

  return { valid: true as const, sid: payload.sid }
}

export function readAnonymousSessionToken(request: NextRequest) {
  return request.cookies.get(ANON_SESSION_COOKIE_NAME)?.value?.trim() || ''
}

export function anonymousSessionCookieOptions() {
  return {
    name: ANON_SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ANON_SESSION_TTL_SECONDS,
  }
}
