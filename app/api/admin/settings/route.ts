import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { readSettings, writeSettings, type SystemSettings, type TestModeConfig } from '@/lib/settings-store'
import { apiError, apiOk } from '@/lib/api-response'

function sanitizeTestModeConfig(mode: unknown): TestModeConfig | null {
  if (!mode || typeof mode !== 'object') return null
  const m = mode as Record<string, unknown>
  
  const id = typeof m.id === 'string' ? m.id.slice(0, 50) : null
  if (!id) return null
  
  const validIcons = ['zap', 'brain', 'sparkles', 'book', 'clock'] as const
  const icon = validIcons.includes(m.icon as typeof validIcons[number]) ? m.icon : 'brain'
  
  const titleObj = typeof m.title === 'object' && m.title !== null ? m.title as Record<string, unknown> : {}
  const descObj = typeof m.description === 'object' && m.description !== null ? m.description as Record<string, unknown> : {}
  const timeObj = typeof m.estimatedTime === 'object' && m.estimatedTime !== null ? m.estimatedTime as Record<string, unknown> : {}
  
  return {
    id,
    enabled: typeof m.enabled === 'boolean' ? m.enabled : true,
    title: {
      zh: typeof titleObj.zh === 'string' ? titleObj.zh.slice(0, 100) : id,
      en: typeof titleObj.en === 'string' ? titleObj.en.slice(0, 100) : id,
      ja: typeof titleObj.ja === 'string' ? titleObj.ja.slice(0, 100) : id,
    },
    description: {
      zh: typeof descObj.zh === 'string' ? descObj.zh.slice(0, 500) : '',
      en: typeof descObj.en === 'string' ? descObj.en.slice(0, 500) : '',
      ja: typeof descObj.ja === 'string' ? descObj.ja.slice(0,500) : '',
    },
    questionCount: typeof m.questionCount === 'number' ? Math.max(1, Math.min(500, m.questionCount)) : 60,
    estimatedTime: {
      zh: typeof timeObj.zh === 'string' ? timeObj.zh.slice(0, 50) : '',
      en: typeof timeObj.en === 'string' ? timeObj.en.slice(0, 50) : '',
      ja: typeof timeObj.ja === 'string' ? timeObj.ja.slice(0, 50) : '',
    },
    icon: icon as TestModeConfig['icon'],
    isAI: typeof m.isAI === 'boolean' ? m.isAI : true,
    customPrompt: typeof m.customPrompt === 'string' ? m.customPrompt.slice(0, 2000) : undefined,
  }
}

function sanitizeSettings(input: unknown): Partial<SystemSettings> | undefined {
  if (!input || typeof input !== 'object') return undefined
  const raw = input as Record<string, unknown>
  const result: Partial<SystemSettings> = {}

  if (typeof raw.siteName === 'string') {
    result.siteName = raw.siteName.slice(0, 100)
  }
  if (raw.defaultLanguage === 'zh' || raw.defaultLanguage === 'en' || raw.defaultLanguage === 'ja') {
    result.defaultLanguage = raw.defaultLanguage
  }
  if (raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system') {
    result.theme = raw.theme
  }
  if (typeof raw.allowAnonymousTest === 'boolean') {
    result.allowAnonymousTest = raw.allowAnonymousTest
  }
  
  if (raw.testModes && typeof raw.testModes === 'object') {
    const tm = raw.testModes as Record<string, unknown>
    const sanitizedModes: TestModeConfig[] = []
    
    if (Array.isArray(tm.modes)) {
      for (const mode of tm.modes) {
        const sanitized = sanitizeTestModeConfig(mode)
        if (sanitized) sanitizedModes.push(sanitized)
      }
    }
    
    result.testModes = {
      modes: sanitizedModes.length > 0 ? sanitizedModes : [],
      defaultMode: typeof tm.defaultMode === 'string' ? tm.defaultMode : 'ai60',
      allowCustomCount: typeof tm.allowCustomCount === 'boolean' ? tm.allowCustomCount : false,
      customCountMin: typeof tm.customCountMin === 'number' ? Math.max(5, tm.customCountMin) : 10,
      customCountMax: typeof tm.customCountMax === 'number' ? Math.min(500, tm.customCountMax) : 200,
    }
  }

  return Object.keys(result).length ? result : undefined
}

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const settings = readSettings()
  return apiOk({ settings })
}

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  let payload: { settings?: unknown } | null = null
  try {
    payload = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON payload.', 400)
  }

  const sanitized = sanitizeSettings(payload?.settings)
  if (!sanitized) {
    return apiError('BAD_REQUEST', 'Invalid settings payload.', 400)
  }

  const updated = writeSettings(sanitized)
  return apiOk({ settings: updated })
}