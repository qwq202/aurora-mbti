import { AI_PROVIDER_MAP, type AIProviderId } from './ai-provider-defs'

export type AIConfigInput = {
  provider?: AIProviderId
  apiKey?: string
  baseUrl?: string
  model?: string
  openrouterSiteUrl?: string
  openrouterAppName?: string
  anthropicVersion?: string
}

const MAX_TEXT_LENGTH = 256

function sanitizeText(value: unknown, maxLen = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return ''
  return value.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen)
}

function sanitizeToken(value: unknown, maxLen = 512) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, '').trim().slice(0, maxLen)
}

function sanitizeUrl(value: unknown) {
  if (typeof value !== 'string') return ''
  const raw = value.trim()
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

function sanitizeProvider(value: unknown): AIProviderId | undefined {
  if (typeof value !== 'string') return undefined
  const id = value.trim() as AIProviderId
  return AI_PROVIDER_MAP[id] ? id : undefined
}

export function sanitizeAIConfig(input: unknown): AIConfigInput | undefined {
  if (!input || typeof input !== 'object') return undefined

  const raw = input as Record<string, unknown>
  const provider = sanitizeProvider(raw.provider)
  const apiKey = sanitizeToken(raw.apiKey)
  const baseUrl = sanitizeUrl(raw.baseUrl)
  const model = sanitizeText(raw.model)
  const openrouterSiteUrl = sanitizeUrl(raw.openrouterSiteUrl)
  const openrouterAppName = sanitizeText(raw.openrouterAppName)
  const anthropicVersion = sanitizeText(raw.anthropicVersion, 32)

  const result: AIConfigInput = {}
  if (provider) result.provider = provider
  if (apiKey) result.apiKey = apiKey
  if (baseUrl) result.baseUrl = baseUrl
  if (model) result.model = model
  if (openrouterSiteUrl) result.openrouterSiteUrl = openrouterSiteUrl
  if (openrouterAppName) result.openrouterAppName = openrouterAppName
  if (anthropicVersion) result.anthropicVersion = anthropicVersion

  return Object.keys(result).length ? result : undefined
}
