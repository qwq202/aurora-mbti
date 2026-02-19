import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { getLogs, getLogStats, clearLogs, LogEntry } from '@/lib/logger'
import { apiError, apiOk } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }

  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const searchParams = request.nextUrl.searchParams
  const level = searchParams.get('level') as LogEntry['level'] | null
  const endpoint = searchParams.get('endpoint')
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const logs = getLogs({
    level: level || undefined,
    endpoint: endpoint || undefined,
    limit: Math.min(limit, 200),
    offset,
  })

  const stats = getLogStats()

  return apiOk({
    logs,
    stats,
  })
}

export async function DELETE(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }

  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  clearLogs()

  return apiOk({
    message: 'Logs cleared',
  })
}
