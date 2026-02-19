import { debugLog } from '@/lib/logging'
import { apiError, apiOk } from '@/lib/api-response'
import { isDebugEnabled } from '@/lib/logging'
import { resolveAIConfig } from '@/lib/ai-provider'

/**
 * 调试端点 - 仅在开发环境可用
 */
export async function GET() {
  if (!isDebugEnabled()) {
    return apiError('FORBIDDEN', 'Debug endpoint is only available in development.', 403)
  }

  debugLog('调试端点被访问...')

  const aiConfig = resolveAIConfig()

  return apiOk({
    status: 'success',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hostname: process.env.HOSTNAME || '',
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    },
    aiPanel: {
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      model: aiConfig.model,
      apiKeySet: Boolean(aiConfig.apiKey),
    },
  })
}
