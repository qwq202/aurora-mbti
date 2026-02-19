import { NextRequest } from 'next/server'
import { AI_PROVIDER_SPECS } from '@/lib/ai-provider-defs'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { resolveAIConfig } from '@/lib/ai-provider'
import { readStoredAIConfig } from '@/lib/ai-settings-store'
import { apiError, apiOk } from '@/lib/api-response'

function maskValue(value?: string) {
  if (!value) return ''
  if (value.length < 8) return '***'
  return `${value.slice(0, 4)}***${value.slice(-2)}`
}

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }

  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const aiConfig = resolveAIConfig()
  const storedConfig = readStoredAIConfig()

  return apiOk({
    overview: {
      runtime: {
        nodeEnv: process.env.NODE_ENV || '',
        uptimeSeconds: Math.round(process.uptime()),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
      ai: {
        currentProvider: aiConfig.provider,
        baseUrl: aiConfig.baseUrl,
        model: aiConfig.model,
        apiKeySet: Boolean(aiConfig.apiKey),
        apiKeyMasked: maskValue(aiConfig.apiKey),
        source: storedConfig ? 'panel' : 'env',
      },
      security: {},
      providers: AI_PROVIDER_SPECS.map((item) => ({
        id: item.id,
        label: item.label,
        defaultBaseUrl: item.defaultBaseUrl,
        defaultModel: item.defaultModel || '',
        requiresApiKey: item.requiresApiKey !== false,
      })),
    }
  })
}
