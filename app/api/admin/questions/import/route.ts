import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { apiError, apiOk } from '@/lib/api-response'
import { importQuestions, importFromBuiltin, type StoredQuestion, type QuestionLocale } from '@/lib/questions-store'

function authCheck(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'Admin credentials not configured.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }
  return null
}

export async function POST(request: NextRequest) {
  const err = authCheck(request)
  if (err) return err

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_BODY', 'Invalid JSON body', 400)
  }

  if (body.fromBuiltin === true) {
    const locale = body.locale as QuestionLocale
    if (!locale || !['zh', 'en', 'ja'].includes(locale)) {
      return apiError('INVALID_LOCALE', 'locale must be zh, en or ja', 400)
    }
    try {
      const count = importFromBuiltin(locale)
      return apiOk({ imported: count, locale })
    } catch (e) {
      return apiError('IMPORT_ERROR', String(e), 500)
    }
  }

  if (Array.isArray(body.questions)) {
    const count = importQuestions(body.questions as StoredQuestion[])
    return apiOk({ imported: count })
  }

  return apiError('INVALID_BODY', 'Provide { questions[] } or { fromBuiltin: true, locale }', 400)
}
