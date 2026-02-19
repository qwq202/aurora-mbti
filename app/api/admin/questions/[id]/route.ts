import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { apiError, apiOk } from '@/lib/api-response'
import { updateQuestion, deleteQuestion } from '@/lib/questions-store'

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

  const ok = deleteQuestion(id)
  if (!ok) {
    return apiError('NOT_FOUND', `Question ${id} not found`, 404)
  }
  return apiOk({ deleted: id })
}
