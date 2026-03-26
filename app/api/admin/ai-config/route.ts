import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { assertAIConfig, resolveAIConfig } from '@/lib/ai-provider'
import { AI_PROVIDER_MAP, type AIProviderId } from '@/lib/ai-provider-defs'
import { readStoredAIConfigV2, writeStoredAIConfigV2, type ProviderConfig } from '@/lib/ai-settings-store'
import { apiError, apiOk } from '@/lib/api-response'

function maskValue(value?: string) {
  if (!value) return ''
  if (value.length < 8) return '***'
  return `${value.slice(0, 4)}***${value.slice(-2)}`
}

function sanitizeProviderConfig(input: unknown): ProviderConfig | undefined {
  if (!input || typeof input !== 'object') return undefined
  const raw = input as Record<string, unknown>
  const result: ProviderConfig = {}
  if (typeof raw.baseUrl === 'string') result.baseUrl = raw.baseUrl.trim().slice(0, 512)
  if (typeof raw.model === 'string') result.model = raw.model.trim().slice(0, 256)
  if (typeof raw.apiKey === 'string') result.apiKey = raw.apiKey.trim().slice(0, 512)
  return Object.keys(result).length ? result : undefined
}

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const stored = readStoredAIConfigV2()
  const activeConfig = stored?.providers?.[stored.activeProvider]
  const resolved = resolveAIConfig()

  const providers: Record<string, { baseUrl?: string; model?: string; hasKey: boolean; updatedAt?: string }> = {}
  for (const [id, config] of Object.entries(stored?.providers || {})) {
    providers[id] = {
      baseUrl: config.baseUrl,
      model: config.model,
      hasKey: Boolean(config.apiKey),
      updatedAt: (config as ProviderConfig & { updatedAt?: string }).updatedAt,
    }
  }

  return apiOk({
    activeProvider: stored?.activeProvider || 'openai',
    activeConfig: {
      baseUrl: resolved.baseUrl,
      model: resolved.model,
      hasKey: Boolean(resolved.apiKey),
      keyMasked: maskValue(resolved.apiKey),
    },
    providers,
    specs: AI_PROVIDER_SPECS,
  })
}

const AI_PROVIDER_SPECS = Object.values(AI_PROVIDER_MAP).map((spec) => ({
  id: spec.id,
  label: spec.label,
  defaultBaseUrl: spec.defaultBaseUrl,
  defaultModel: spec.defaultModel,
  requiresApiKey: spec.requiresApiKey !== false,
}))

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  let payload: { action?: string; provider?: string; config?: unknown } | null = null
  try {
    payload = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON payload.', 400)
  }

  const action = payload?.action

  // 设置当前渠道
  if (action === 'activate' && payload?.provider) {
    const providerId = payload.provider as AIProviderId
    if (!AI_PROVIDER_MAP[providerId]) {
      return apiError('BAD_REQUEST', 'Invalid provider.', 400)
    }
    writeStoredAIConfigV2({
      activeProvider: providerId,
      providers: readStoredAIConfigV2()?.providers || {},
    })
    return apiOk({ activated: providerId })
  }

  // 保存渠道配置
  if (action === 'save' && payload?.provider) {
    const providerId = payload.provider as AIProviderId
    if (!AI_PROVIDER_MAP[providerId]) {
      return apiError('BAD_REQUEST', 'Invalid provider.', 400)
    }
    const config = sanitizeProviderConfig(payload?.config)
    if (!config) {
      return apiError('BAD_REQUEST', 'Invalid config.', 400)
    }

    // 先验证配置是否有效
    const resolved = resolveAIConfig(providerId, config)
    try {
      assertAIConfig(resolved)
    } catch (error) {
      return apiError('BAD_REQUEST', error instanceof Error ? error.message : 'Invalid AI config', 400)
    }

    // 验证通过后才写入
    const current = readStoredAIConfigV2()
    const providers = current?.providers || {}
    const existingConfig = providers[providerId] || {}
    // 合并配置：如果新配置没有提供 apiKey，保留现有的
    const mergedConfig: ProviderConfig = {
      baseUrl: config.baseUrl || existingConfig.baseUrl,
      model: config.model || existingConfig.model,
      apiKey: config.apiKey || existingConfig.apiKey,
    }
    providers[providerId] = mergedConfig
    writeStoredAIConfigV2({
      activeProvider: current?.activeProvider || providerId,
      providers,
    })

    return apiOk({
      saved: true,
      provider: providerId,
      config: {
        baseUrl: resolved.baseUrl,
        model: resolved.model,
        hasKey: Boolean(resolved.apiKey),
      },
    })
  }

  return apiError('BAD_REQUEST', 'Invalid action.', 400)
}