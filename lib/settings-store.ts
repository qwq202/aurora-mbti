import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

export type SystemSettings = {
  siteName: string
  defaultLanguage: 'zh' | 'en' | 'ja'
  theme: 'light' | 'dark' | 'system'
  allowAnonymousTest: boolean
  updatedAt?: string
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'Aurora MBTI',
  defaultLanguage: 'zh',
  theme: 'system',
  allowAnonymousTest: true,
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readSettings(): SystemSettings {
  try {
    ensureDataDir()
    if (!fs.existsSync(SETTINGS_FILE)) {
      return { ...DEFAULT_SETTINGS }
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<SystemSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function writeSettings(settings: Partial<SystemSettings>): SystemSettings {
  ensureDataDir()
  const current = readSettings()
  const updated: SystemSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}