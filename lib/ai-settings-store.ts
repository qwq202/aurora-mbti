import fs from 'fs'
import path from 'path'
import { type AIConfigInput } from './ai-config'

const DATA_DIR = path.join(process.cwd(), 'data')
const AI_SETTINGS_FILE = path.join(DATA_DIR, 'ai-config.json')

type StoredAIConfig = AIConfigInput & {
  updatedAt?: string
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readStoredAIConfig(): StoredAIConfig | undefined {
  try {
    ensureDataDir()
    if (!fs.existsSync(AI_SETTINGS_FILE)) return undefined
    const raw = fs.readFileSync(AI_SETTINGS_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as StoredAIConfig
    if (!parsed || typeof parsed !== 'object') return undefined
    return parsed
  } catch {
    return undefined
  }
}

export function writeStoredAIConfig(config: AIConfigInput) {
  ensureDataDir()
  const data: StoredAIConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(AI_SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}
