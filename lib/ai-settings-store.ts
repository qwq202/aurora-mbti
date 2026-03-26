import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { type AIProviderId } from './ai-provider-defs'

const DATA_DIR = path.join(process.cwd(), 'data')
const AI_SETTINGS_FILE = path.join(DATA_DIR, 'ai-config.json')

type SingleProviderConfig = {
  baseUrl?: string
  model?: string
  apiKeyEncrypted?: string
  updatedAt?: string
}

type StoredAIConfigV2 = {
  version: 2
  activeProvider: AIProviderId
  providers: Record<string, SingleProviderConfig>
}

type LegacyStoredAIConfig = {
  version?: never
  provider?: string
  baseUrl?: string
  model?: string
  apiKey?: string
  apiKeyEncrypted?: string
  updatedAt?: string
}

type StoredAIConfig = StoredAIConfigV2 | LegacyStoredAIConfig

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

declare global {
  var __auroraAISettingsSecret: string | undefined
}

function getRuntimeSecret() {
  if (globalThis.__auroraAISettingsSecret) return globalThis.__auroraAISettingsSecret
  const random = crypto.randomBytes(32)
  globalThis.__auroraAISettingsSecret = random.toString('base64url')
  return globalThis.__auroraAISettingsSecret
}

function getEncryptionSecret() {
  return getRuntimeSecret()
}

function encryptApiKey(apiKey: string, secret: string) {
  const iv = crypto.randomBytes(12)
  const key = crypto.createHash('sha256').update(secret).digest()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`
}

function decryptApiKey(ciphertext: string, secret: string) {
  const parts = ciphertext.split('.')
  if (parts.length !== 4 || parts[0] !== 'v1') return ''
  const iv = Buffer.from(parts[1], 'base64url')
  const tag = Buffer.from(parts[2], 'base64url')
  const encrypted = Buffer.from(parts[3], 'base64url')
  const key = crypto.createHash('sha256').update(secret).digest()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

function isV2Config(config: StoredAIConfig): config is StoredAIConfigV2 {
  return config.version === 2
}

export type ProviderConfig = {
  baseUrl?: string
  model?: string
  apiKey?: string
}

export type AIConfigV2 = {
  activeProvider: AIProviderId
  providers: Record<string, ProviderConfig>
}

export function readStoredAIConfigV2(): AIConfigV2 | undefined {
  try {
    ensureDataDir()
    if (!fs.existsSync(AI_SETTINGS_FILE)) return undefined
    const raw = fs.readFileSync(AI_SETTINGS_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as StoredAIConfig
    if (!parsed || typeof parsed !== 'object') return undefined

    const secret = getEncryptionSecret()

    if (isV2Config(parsed)) {
      const providers: Record<string, ProviderConfig> = {}
      for (const [id, config] of Object.entries(parsed.providers)) {
        const providerConfig: ProviderConfig = {
          baseUrl: config.baseUrl,
          model: config.model,
        }
        if (config.apiKeyEncrypted && secret) {
          try {
            providerConfig.apiKey = decryptApiKey(config.apiKeyEncrypted, secret)
          } catch {}
        }
        providers[id] = providerConfig
      }
      return {
        activeProvider: parsed.activeProvider,
        providers,
      }
    }

    // 处理旧版本配置，迁移到新格式
    const legacy = parsed as LegacyStoredAIConfig
    if (legacy.provider) {
      const providers: Record<string, ProviderConfig> = {}
      const providerConfig: ProviderConfig = {
        baseUrl: legacy.baseUrl,
        model: legacy.model,
      }
      if (legacy.apiKeyEncrypted && secret) {
        try {
          providerConfig.apiKey = decryptApiKey(legacy.apiKeyEncrypted, secret)
        } catch {}
      } else if (legacy.apiKey) {
        providerConfig.apiKey = legacy.apiKey
      }
      providers[legacy.provider] = providerConfig
      return {
        activeProvider: legacy.provider as AIProviderId,
        providers,
      }
    }

    return undefined
  } catch {
    return undefined
  }
}

export function writeStoredAIConfigV2(config: AIConfigV2) {
  ensureDataDir()
  const secret = getEncryptionSecret()

  const providers: Record<string, SingleProviderConfig> = {}
  for (const [id, providerConfig] of Object.entries(config.providers)) {
    const entry: SingleProviderConfig = {
      baseUrl: providerConfig.baseUrl,
      model: providerConfig.model,
      updatedAt: new Date().toISOString(),
    }
    if (providerConfig.apiKey?.trim() && secret) {
      entry.apiKeyEncrypted = encryptApiKey(providerConfig.apiKey.trim(), secret)
    }
    providers[id] = entry
  }

  const data: StoredAIConfigV2 = {
    version: 2,
    activeProvider: config.activeProvider,
    providers,
  }

  fs.writeFileSync(AI_SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function setActiveProvider(providerId: AIProviderId) {
  const current = readStoredAIConfigV2()
  writeStoredAIConfigV2({
    activeProvider: providerId,
    providers: current?.providers || {},
  })
}

export function setProviderConfig(providerId: AIProviderId, config: ProviderConfig) {
  const current = readStoredAIConfigV2()
  const providers = current?.providers || {}
  providers[providerId] = config
  writeStoredAIConfigV2({
    activeProvider: current?.activeProvider || providerId,
    providers,
  })
}

export function getActiveProviderConfig(): { providerId: AIProviderId; config: ProviderConfig } | undefined {
  const stored = readStoredAIConfigV2()
  if (!stored) return undefined
  const config = stored.providers[stored.activeProvider]
  return {
    providerId: stored.activeProvider,
    config: config || {},
  }
}

export type { AIProviderId }