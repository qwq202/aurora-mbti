import { NextResponse } from 'next/server'

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UPSTREAM_ERROR'
  | 'NOT_CONFIGURED'
  | 'DEPRECATED'
  | 'INVALID_BODY'
  | 'MISSING_FIELDS'
  | 'INVALID_LOCALE'
  | 'IMPORT_ERROR'

type ApiOkPayload = Record<string, unknown>

type ApiErrorPayload = {
  success: false
  version: 'v1'
  error: {
    code: ApiErrorCode
    message: string
    details?: string
  }
}

export function apiOk(payload: ApiOkPayload = {}, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      version: 'v1',
      ...payload,
    },
    init
  )
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: string
) {
  const body: ApiErrorPayload = {
    success: false,
    version: 'v1',
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  }
  return NextResponse.json(body, { status })
}

export function readApiErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback
  const record = body as Record<string, unknown>
  const legacyError = typeof record.error === 'string' ? record.error : ''
  const nestedError =
    record.error && typeof record.error === 'object'
      ? (record.error as Record<string, unknown>).message
      : ''
  if (typeof nestedError === 'string' && nestedError.trim()) return nestedError
  if (legacyError.trim()) return legacyError
  return fallback
}
