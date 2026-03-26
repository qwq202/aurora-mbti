import { NextRequest, NextResponse } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { readSettings } from '@/lib/settings-store'
import { apiError } from '@/lib/api-response'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

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
      fs.writeFileSync(
        path.join(DATA_DIR, 'questions.json'),
        JSON.stringify(body.data.questions, null, 2),
        'utf-8'
      )
    }

    if (body.data.results) {
      fs.writeFileSync(
        path.join(DATA_DIR, 'results.json'),
        JSON.stringify(body.data.results, null, 2),
        'utf-8'
      )
    }

    if (body.data.aiConfig) {
      fs.writeFileSync(
        path.join(DATA_DIR, 'ai-config.json'),
        JSON.stringify(body.data.aiConfig, null, 2),
        'utf-8'
      )
    }

    if (body.data.settings) {
      fs.writeFileSync(
        path.join(DATA_DIR, 'settings.json'),
        JSON.stringify(body.data.settings, null, 2),
        'utf-8'
      )
    }

    return NextResponse.json({ success: true, imported: Object.keys(body.data) })
  } catch (error) {
    return apiError('BAD_REQUEST', error instanceof Error ? error.message : 'Failed to import backup', 400)
  }
}