import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { sanitizeAIConfig, type AIConfigInput } from '@/lib/ai-config'
import { assertAIConfig, resolveAIConfig } from '@/lib/ai-provider'
import { readStoredAIConfig, writeStoredAIConfig } from '@/lib/ai-settings-store'
import { apiError, apiOk } from '@/lib/api-response'

function maskValue(value?: string) {
  if (!value) return ''
  if (value.length < 8) return '***'
  return `${value.slice(0, 4)}***${value.slice(-2)}`
}

function mergeConfig(previous: AIConfigInput | undefined, next: AIConfigInput | undefined) {
  const merged: AIConfigInput = {
    ...(previous || {}),
    ...(next || {}),
  }

  if (next?.provider && next.provider !== previous?.provider && !next.apiKey) {
    delete merged.apiKey
  }

  return merged
}

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const stored = readStoredAIConfig()
  const resolved = resolveAIConfig()

  return apiOk({
    config: {
      provider: resolved.provider,
      baseUrl: resolved.baseUrl,
      model: resolved.model,
      apiKeySet: Boolean(resolved.apiKey),
      apiKeyMasked: maskValue(resolved.apiKey),
      openrouterSiteUrl: resolved.openrouterSiteUrl || '',
      openrouterAppName: resolved.openrouterAppName || '',
      anthropicVersion: resolved.anthropicVersion || '',
      source: stored ? 'panel' : 'env',
      updatedAt: stored?.updatedAt || '',
    },
  })
}

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  let payload: { config?: unknown } | null = null
  try {
    payload = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON payload.', 400)
  }

  const next = sanitizeAIConfig(payload?.config)
  if (!next) {
    return apiError('BAD_REQUEST', 'Invalid AI config payload.', 400)
  }

  const previous = readStoredAIConfig()
  const merged = mergeConfig(previous, next)
  const resolved = resolveAIConfig(merged)

  try {
    assertAIConfig(resolved)
  } catch (error) {
    return apiError('BAD_REQUEST', error instanceof Error ? error.message : 'Invalid AI config', 400)
  }

  writeStoredAIConfig(merged)

  return apiOk({
    saved: true,
    config: {
      provider: resolved.provider,
      baseUrl: resolved.baseUrl,
      model: resolved.model,
      apiKeySet: Boolean(resolved.apiKey),
      apiKeyMasked: maskValue(resolved.apiKey),
    },
  })
}
