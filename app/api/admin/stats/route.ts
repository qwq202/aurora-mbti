import { NextRequest } from 'next/server'
import { isAdminAuthorized, isAdminConfigured } from '@/lib/admin-auth'
import { getStats, getDailyStats, StatsData } from '@/lib/stats'
import { apiError, apiOk } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  if (!isAdminConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_TOKEN is not configured on server.', 503)
  }

  if (!isAdminAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get('days') || '7', 10)
  const dailyData = getDailyStats(Math.min(days, 30))
  const stats = getStats()

  const totalCalls = Object.values(stats.apiCalls).reduce((sum, count) => sum + count, 0)
  const totalTokens = stats.tokenUsage.input + stats.tokenUsage.output

  return apiOk({
    stats: {
      totalCalls,
      testCompletions: stats.testCompletions,
      tokenUsage: stats.tokenUsage,
      totalTokens,
      daily: dailyData,
      byEndpoint: stats.apiCalls,
    }
  })
}
