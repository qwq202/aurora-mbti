import { NextRequest, NextResponse } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { readSettings } from '@/lib/settings-store'
import { apiError } from '@/lib/api-response'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

const VALID_LOCALES = ['zh', 'en', 'ja'] as const
const VALID_DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const
const VALID_AGREES = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as const
const VALID_LANGUAGES = ['zh', 'en', 'ja'] as const
const VALID_THEMES = ['light', 'dark', 'system'] as const

type BackupData = {
  version: string
  exportedAt: string
  data: {
    questions: unknown
    results: unknown
    aiConfig: unknown
    settings: unknown
  }
}

// 清洗 settings 数据，返回通过验证的干净数据
function sanitizeSettings(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const s = raw as Record<string, unknown>
  const clean: Record<string, unknown> = {}

  if ('siteName' in s) {
    if (typeof s.siteName !== 'string' || s.siteName.length > 100) return null
    clean.siteName = s.siteName
  }
  if ('defaultLanguage' in s) {
    if (!VALID_LANGUAGES.includes(s.defaultLanguage as typeof VALID_LANGUAGES[number])) return null
    clean.defaultLanguage = s.defaultLanguage
  }
  if ('theme' in s) {
    if (!VALID_THEMES.includes(s.theme as typeof VALID_THEMES[number])) return null
    clean.theme = s.theme
  }
  if ('allowAnonymousTest' in s) {
    if (typeof s.allowAnonymousTest !== 'boolean') return null
    clean.allowAnonymousTest = s.allowAnonymousTest
  }

  // 保留其他未做严格验证的字段（避免丢失配置）
  for (const key of Object.keys(s)) {
    if (!(key in clean)) {
      clean[key] = s[key]
    }
  }

  return clean
}

// 清洗 aiConfig 数据，逐个 provider 验证，跳过无效项
function sanitizeAiConfig(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const config = raw as Record<string, unknown>
  const clean: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(config)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const provider = value as Record<string, unknown>

    if ('baseUrl' in provider && (typeof provider.baseUrl !== 'string' || provider.baseUrl.length > 512)) continue
    if ('model' in provider && (typeof provider.model !== 'string' || provider.model.length > 256)) continue
    if ('apiKey' in provider && (typeof provider.apiKey !== 'string' || provider.apiKey.length > 512)) continue

    clean[key] = value
  }

  return clean
}

// 清洗 questions 数据，跳过无效题目
function sanitizeQuestions(raw: unknown): unknown | null {
  if (!raw || typeof raw !== 'object') return null
  // questions 字段可能是 { questions: [...] } 或直接是数组
  let arr: unknown[]
  let isWrapped = false
  if (Array.isArray(raw)) {
    arr = raw
  } else if ('questions' in raw && Array.isArray((raw as Record<string, unknown>).questions)) {
    arr = (raw as { questions: unknown[] }).questions
    isWrapped = true
  } else {
    return null
  }

  const clean: unknown[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const q = item as Record<string, unknown>

    if (typeof q.text !== 'string' || q.text.trim() === '') continue
    if (!VALID_DIMENSIONS.includes(q.dimension as typeof VALID_DIMENSIONS[number])) continue
    if (!VALID_AGREES.includes(q.agree as typeof VALID_AGREES[number])) continue
    if (!VALID_LOCALES.includes(q.locale as typeof VALID_LOCALES[number])) continue

    clean.push(item)
  }

  // 如果原始数据是 { questions: [...] } 格式，返回同样的格式
  if (isWrapped) {
    return { questions: clean }
  }
  return clean
}

async function parseJsonSafely<T>(filePath: string, fallback: T): Promise<T> {
  try {
    if (!fs.existsSync(filePath)) return fallback
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const questions = await parseJsonSafely(path.join(DATA_DIR, 'questions.json'), { questions: [] })
  const results = await parseJsonSafely(path.join(DATA_DIR, 'results.json'), { results: [] })
  const aiConfig = await parseJsonSafely(path.join(DATA_DIR, 'ai-config.json'), {})
  const settings = readSettings()

  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      questions,
      results,
      aiConfig,
      settings,
    },
  }

  const fileName = `aurora-backup-${new Date().toISOString().split('T')[0]}.json`
  const json = JSON.stringify(backup, null, 2)

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  try {
    const body = await request.json() as BackupData

    if (!body.version || !body.data) {
      return apiError('BAD_REQUEST', 'Invalid backup file format.', 400)
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    if (body.data.questions) {
      const cleanedQuestions = sanitizeQuestions(body.data.questions)
      if (cleanedQuestions) {
        fs.writeFileSync(
          path.join(DATA_DIR, 'questions.json'),
          JSON.stringify(cleanedQuestions, null, 2),
          'utf-8'
        )
      }
    }

    if (body.data.results) {
      fs.writeFileSync(
        path.join(DATA_DIR, 'results.json'),
        JSON.stringify(body.data.results, null, 2),
        'utf-8'
      )
    }

    if (body.data.aiConfig) {
      const cleanedAiConfig = sanitizeAiConfig(body.data.aiConfig)
      if (cleanedAiConfig) {
        fs.writeFileSync(
          path.join(DATA_DIR, 'ai-config.json'),
          JSON.stringify(cleanedAiConfig, null, 2),
          'utf-8'
        )
      }
    }

    if (body.data.settings) {
      const cleanedSettings = sanitizeSettings(body.data.settings)
      if (cleanedSettings) {
        fs.writeFileSync(
          path.join(DATA_DIR, 'settings.json'),
          JSON.stringify(cleanedSettings, null, 2),
          'utf-8'
        )
      }
    }

    return NextResponse.json({ success: true, imported: Object.keys(body.data) })
  } catch (error) {
    return apiError('BAD_REQUEST', error instanceof Error ? error.message : 'Failed to import backup', 400)
  }
}