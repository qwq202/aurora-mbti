import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS, SECURITY_ERRORS } from '@/lib/security'

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

// Redis
const rateLimitStore = new Map<string, RateLimitInfo>()

// 
setInterval(() => {
  const now = Date.now()
  for (const [key, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // 

export function getRateLimitKey(request: NextRequest, endpoint: string): string {
  // IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return `${clientIp}:${endpoint}`
}

export function checkRateLimit(
  key: string, 
  limit: number, 
  windowSeconds: number = RATE_LIMITS.WINDOW_SIZE
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  
  let info = rateLimitStore.get(key)
  
  // 
  if (!info || now > info.resetTime) {
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
      
      return {
        action: 'block',
        response: NextResponse.json(
          { 
            error: SECURITY_ERRORS.RATE_LIMIT,
            retryAfter: retryAfter
          },
          { 
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': result.resetTime.toString()
            }
          }
        )
      }
    }

    return {
      action: 'allow',
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      }
    }
  }
}

// 
export const questionsRateLimit = createRateLimitMiddleware('questions', RATE_LIMITS.GENERATE_QUESTIONS)
export const analysisRateLimit = createRateLimitMiddleware('analysis', RATE_LIMITS.GENERATE_ANALYSIS)
export const generalRateLimit = createRateLimitMiddleware('general', RATE_LIMITS.GENERAL_API)
