import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS, SECURITY_ERRORS } from '@/lib/security'
import { apiError } from '@/lib/api-response'
import { ANON_SESSION_COOKIE_NAME } from '@/lib/anonymous-session'

/**
 *  
 * Redis
 */

interface RateLimitInfo {
  count: number
  resetTime: number
}

export type RateLimitDecision =
  | { action: 'allow'; headers: Record<string, string> }
  | { action: 'block'; response: NextResponse }

// 内存限流存储（生产环境建议替换为 Redis）
const rateLimitStore = new Map<string, RateLimitInfo>()

// Map 条目上限：超出时强制清除最旧的 20% 条目，防止内存无限增长
const RATE_LIMIT_MAP_MAX = 10_000
const RATE_LIMIT_EVICT_COUNT = 2_000

function evictOldestEntries() {
  let i = 0
  for (const key of rateLimitStore.keys()) {
    if (i++ >= RATE_LIMIT_EVICT_COUNT) break
    rateLimitStore.delete(key)
  }
}

// 定期清理已过期条目（60 秒一次）
setInterval(() => {
  const now = Date.now()
  for (const [key, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000)

export function getRateLimitKey(request: NextRequest, endpoint: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
  const sessionToken = request.cookies.get(ANON_SESSION_COOKIE_NAME)?.value?.trim() || ''
  const sessionKey = sessionToken ? sessionToken.slice(0, 24) : 'no-session'
  return `${clientIp}:${sessionKey}:${endpoint}`
}

export function checkRateLimit(
  key: string, 
  limit: number, 
  windowSeconds: number = RATE_LIMITS.WINDOW_SIZE
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  
  let info = rateLimitStore.get(key)
  
  // 新键写入前检查 Map 容量
  if (!info || now > info.resetTime) {
    if (rateLimitStore.size >= RATE_LIMIT_MAP_MAX) {
      evictOldestEntries()
    }
    info = {
      count: 1,
      resetTime: now + windowMs
    }
    rateLimitStore.set(key, info)
    
    return {
      allowed: true,
      resetTime: info.resetTime,
      remaining: limit - 1
    }
  }
  
  // 
  if (info.count >= limit) {
    return {
      allowed: false,
      resetTime: info.resetTime,
      remaining: 0
    }
  }
  
  // 
  info.count++
  rateLimitStore.set(key, info)

  return {
    allowed: true,
    resetTime: info.resetTime,
    remaining: limit - info.count
  }
}

export function createRateLimitMiddleware(endpoint: string, limit: number) {
  return function rateLimitMiddleware(request: NextRequest): RateLimitDecision {
    // IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    
    if (RATE_LIMITS.WHITELIST.includes(clientIp)) {
      return {
        action: 'allow',
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': limit.toString(),
          'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMITS.WINDOW_SIZE * 1000) / 1000).toString()
        }
      }
    }
    
    const key = getRateLimitKey(request, endpoint)
    const result = checkRateLimit(key, limit)
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
      const resetAt = Math.ceil(result.resetTime / 1000)

      const response = apiError(
        'TOO_MANY_REQUESTS',
        SECURITY_ERRORS.RATE_LIMIT,
        429,
        `retryAfter=${retryAfter}`
      )
      response.headers.set('Retry-After', retryAfter.toString())
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', resetAt.toString())

      return {
        action: 'block',
        response
      }
    }

    return {
      action: 'allow',
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
      }
    }
  }
}

// 
export const questionsRateLimit = createRateLimitMiddleware('questions', RATE_LIMITS.GENERATE_QUESTIONS)
export const analysisRateLimit = createRateLimitMiddleware('analysis', RATE_LIMITS.GENERATE_ANALYSIS)
export const generalRateLimit = createRateLimitMiddleware('general', RATE_LIMITS.GENERAL_API)
