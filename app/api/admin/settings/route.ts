import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { readSettings, writeSettings, type SystemSettings } from '@/lib/settings-store'
import { apiError, apiOk } from '@/lib/api-response'

function sanitizeSettings(input: unknown): Partial<SystemSettings> | undefined {
  if (!input || typeof input !== 'object') return undefined
  const raw = input as Record<string, unknown>
  const result: Partial<SystemSettings> = {}

  if (typeof raw.siteName === 'string') {
    result.siteName = raw.siteName.slice(0, 100)
  }
  if (raw.defaultLanguage === 'zh' || raw.defaultLanguage === 'en' || raw.defaultLanguage === 'ja') {
    result.defaultLanguage = raw.defaultLanguage
  }
  if (raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system') {
    result.theme = raw.theme
  }
  if (typeof raw.allowAnonymousTest === 'boolean') {
    result.allowAnonymousTest = raw.allowAnonymousTest
  }

  return Object.keys(result).length ? result : undefined
}

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const settings = readSettings()
  return apiOk({ settings })
}

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  let payload: { settings?: unknown } | null = null
  try {
    payload = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON payload.', 400)
  }

  const sanitized = sanitizeSettings(payload?.settings)
  if (!sanitized) {
    return apiError('BAD_REQUEST', 'Invalid settings payload.', 400)
  }

  const updated = writeSettings(sanitized)
  return apiOk({ settings: updated })
}