import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { apiError, apiOk } from '@/lib/api-response'
import { readQuestions, addQuestion, getTotalCount, type QuestionLocale, type QuestionDimension } from '@/lib/questions-store'

function authCheck(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'Admin credentials not configured.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }
  return null
}

export async function GET(request: NextRequest) {
  const err = authCheck(request)
  if (err) return err

  const { searchParams } = request.nextUrl
  const locale = searchParams.get('locale') as QuestionLocale | null
  const dimension = searchParams.get('dimension') as QuestionDimension | null

  const questions = readQuestions(locale ?? undefined, dimension ?? undefined)
  const total = getTotalCount()
  return apiOk({ questions, total })
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

  const { text, dimension, agree, locale, contexts, ageGroups } = body
  if (!text || !dimension || !agree || !locale) {
    return apiError('MISSING_FIELDS', 'text, dimension, agree, locale are required', 400)
  }

  const newQ = addQuestion({
    text: text as string,
    dimension: dimension as QuestionDimension,
    agree: agree as string,
    locale: locale as QuestionLocale,
    contexts: (contexts as string[] | undefined),
    ageGroups: (ageGroups as string[] | undefined),
  } as Parameters<typeof addQuestion>[0])

  return apiOk({ question: newQ })
}
