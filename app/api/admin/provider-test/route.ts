import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { assertAIConfig, completeAIText, resolveAIConfig } from '@/lib/ai-provider'
import { sanitizeAIConfig } from '@/lib/ai-config'
import { apiError, apiOk } from '@/lib/api-response'

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

  const safeConfig = sanitizeAIConfig(payload?.config)
  const aiConfig = resolveAIConfig(safeConfig)

  try {
    assertAIConfig(aiConfig)
  } catch (error) {
    return apiError('BAD_REQUEST', error instanceof Error ? error.message : 'Invalid AI config', 400)
  }

  try {
    const content = await completeAIText(aiConfig, {
      messages: [
        { role: 'system', content: 'Return exactly one token: OK' },
        { role: 'user', content: 'Health check' },
      ],
      temperature: 0,
      maxTokens: 8,
      timeoutMs: 25000,
    })

    return apiOk({
      provider: aiConfig.provider,
      model: aiConfig.model,
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
