import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { type AIConfigInput } from './ai-config'

const DATA_DIR = path.join(process.cwd(), 'data')
const AI_SETTINGS_FILE = path.join(DATA_DIR, 'ai-config.json')

type StoredAIConfig = AIConfigInput & {
  updatedAt?: string
  apiKeyEncrypted?: string
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function getEncryptionSecret() {
  return (
    process.env.AI_SETTINGS_SECRET?.trim() ||
    process.env.ANON_AUTH_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    ''
  )
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

export function readStoredAIConfig(): StoredAIConfig | undefined {
  try {
    ensureDataDir()
    if (!fs.existsSync(AI_SETTINGS_FILE)) return undefined
    const raw = fs.readFileSync(AI_SETTINGS_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as StoredAIConfig
    if (!parsed || typeof parsed !== 'object') return undefined
    if (parsed.apiKeyEncrypted) {
      const secret = getEncryptionSecret()
      if (secret) {
        try {
          parsed.apiKey = decryptApiKey(parsed.apiKeyEncrypted, secret)
        } catch {
          delete parsed.apiKey
        }
      } else {
        delete parsed.apiKey
      }
    }
    return parsed
  } catch {
    return undefined
  }
}

export function writeStoredAIConfig(config: AIConfigInput) {
  ensureDataDir()
  const secret = getEncryptionSecret()
  const apiKey = config.apiKey?.trim() || ''
  const data: StoredAIConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  }
  if (apiKey) {
    if (secret) {
      data.apiKeyEncrypted = encryptApiKey(apiKey, secret)
      delete data.apiKey
    } else {
      delete data.apiKey
    }
  }
  fs.writeFileSync(AI_SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}
