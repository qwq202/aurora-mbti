import { NextRequest, NextResponse } from 'next/server'
import { AI_PROVIDER_SPECS } from '@/lib/ai-provider-defs'
import { isAdminAuthorized, isAdminConfigured } from '@/lib/admin-auth'
import { resolveAIConfig } from '@/lib/ai-provider'

function maskValue(value?: string) {
  if (!value) return ''
  if (value.length < 8) return '***'
  return `${value.slice(0, 4)}***${value.slice(-2)}`
}

export async function GET(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { success: false, error: 'ADMIN_TOKEN is not configured on server.' },
      { status: 503 }
    )
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const aiConfig = resolveAIConfig()

  return NextResponse.json({
    success: true,
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
      },
      security: {
        debugApiLogs: process.env.DEBUG_API_LOGS === 'true',
        corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS || '',
      },
      providers: AI_PROVIDER_SPECS.map((item) => ({
        id: item.id,
        label: item.label,
        defaultBaseUrl: item.defaultBaseUrl,
        defaultModel: item.defaultModel || '',
        requiresApiKey: item.requiresApiKey !== false,
      })),
    },
  })
}
