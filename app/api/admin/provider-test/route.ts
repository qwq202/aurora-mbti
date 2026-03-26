import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { assertAIConfig, completeAIText, resolveAIConfig } from '@/lib/ai-provider'
import { AI_PROVIDER_MAP, type AIProviderId } from '@/lib/ai-provider-defs'
import { readStoredAIConfigV2, type ProviderConfig } from '@/lib/ai-settings-store'
import { apiError, apiOk } from '@/lib/api-response'

function sanitizeProviderConfig(input: unknown): ProviderConfig | undefined {
  if (!input || typeof input !== 'object') return undefined
  const raw = input as Record<string, unknown>
  const result: ProviderConfig = {}
  if (typeof raw.baseUrl === 'string') result.baseUrl = raw.baseUrl.trim().slice(0, 512)
  if (typeof raw.model === 'string') result.model = raw.model.trim().slice(0, 256)
  if (typeof raw.apiKey === 'string') result.apiKey = raw.apiKey.trim().slice(0, 512)
  return Object.keys(result).length ? result : undefined
}

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }

  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  let payload: { provider?: string; config?: unknown } | null = null
  try {
    payload = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON payload.', 400)
  }

  const providerId = ((payload?.provider as AIProviderId) || (payload?.config as Record<string, unknown>)?.provider as AIProviderId) || 'openai'
  if (!AI_PROVIDER_MAP[providerId]) {
    return apiError('BAD_REQUEST', 'Invalid provider.', 400)
  }

  const overrideConfig = sanitizeProviderConfig(payload?.config)
  const stored = readStoredAIConfigV2()
  const storedConfig = stored?.providers?.[providerId]
  const config: ProviderConfig = {
    baseUrl: overrideConfig?.baseUrl || storedConfig?.baseUrl,
    model: overrideConfig?.model || storedConfig?.model,
    apiKey: overrideConfig?.apiKey || storedConfig?.apiKey,
  }

  const aiConfig = resolveAIConfig(providerId, config)

  try {
    assertAIConfig(aiConfig)
  } catch (error) {
    return apiError('BAD_REQUEST', error instanceof Error ? error.message : 'Invalid AI config', 400)
  }

  try {
    const startTime = Date.now()
    const content = await completeAIText(aiConfig, {
      messages: [
        { role: 'system', content: 'Return exactly one token: OK' },
        { role: 'user', content: 'Health check' },
      ],
      temperature: 0,
      maxTokens: 8,
      timeoutMs: 25000,
    })
    const duration = Date.now() - startTime

    return apiOk({
      provider: aiConfig.provider,
      model: aiConfig.model,
      duration: `${duration}ms`,
      preview: content.slice(0, 120),
    })
  } catch (error) {
    return apiError(
      'UPSTREAM_ERROR',
      error instanceof Error ? error.message : 'Provider request failed',
      502,
      `provider=${aiConfig.provider};model=${aiConfig.model}`
    )
  }
}