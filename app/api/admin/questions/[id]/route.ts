import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { apiError, apiOk } from '@/lib/api-response'
import { updateQuestion, deleteQuestion } from '@/lib/questions-store'

const VALID_DIMENSIONS: readonly string[] = ['EI', 'SN', 'TF', 'JP']
const VALID_AGREES: readonly string[] = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']
const VALID_LOCALES: readonly string[] = ['zh', 'en', 'ja']

function authCheck(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'Admin credentials not configured.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }
  return null
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = authCheck(request)
  if (err) return err

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_BODY', 'Invalid JSON body', 400)
  }

  // 字段验证
  if ('text' in body) {
    if (typeof body.text !== 'string' || body.text.trim() === '') {
      return apiError('BAD_REQUEST', 'text must be a non-empty string', 400)
    }
  }
  if ('dimension' in body) {
    if (typeof body.dimension !== 'string' || !VALID_DIMENSIONS.includes(body.dimension)) {
      return apiError('BAD_REQUEST', 'dimension must be one of EI/SN/TF/JP', 400)
    }
  }
  if ('agree' in body) {
    if (typeof body.agree !== 'string' || !VALID_AGREES.includes(body.agree)) {
      return apiError('BAD_REQUEST', 'agree must be one of E/I/S/N/T/F/J/P', 400)
    }
  }
  if ('locale' in body) {
    if (typeof body.locale !== 'string' || !VALID_LOCALES.includes(body.locale)) {
      return apiError('BAD_REQUEST', 'locale must be one of zh/en/ja', 400)
    }
  }

  const updated = updateQuestion(id, body as Parameters<typeof updateQuestion>[1])
  if (!updated) {
    return apiError('NOT_FOUND', `Question ${id} not found`, 404)
  }
  return apiOk({ question: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = authCheck(request)
  if (err) return err

  const { id } = await params

  console.log(`[ADMIN] Question deleted: ${id} at ${new Date().toISOString()}`)

  const ok = deleteQuestion(id)
  if (!ok) {
    return apiError('NOT_FOUND', `Question ${id} not found`, 404)
  }
  return apiOk({ deleted: id })
}
