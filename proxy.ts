import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { questionsRateLimit, analysisRateLimit, generalRateLimit, type RateLimitDecision } from '@/lib/rate-limit'
import { CSP_CONFIG } from '@/lib/security'
import { apiError } from '@/lib/api-response'
import {
  anonymousSessionCookieOptions,
  createAnonymousSessionToken,
  readAnonymousSessionToken,
  verifyAnonymousSessionToken,
} from '@/lib/anonymous-session'

/**
 *  Next.js 
 * 
 */

// CSP
function buildCSPHeader(): string {
  return Object.entries(CSP_CONFIG)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}

//  - CSP
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: buildCSPHeader()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
]

const intlMiddleware = createMiddleware(routing)

// CORS 跨域来源：仅允许同源请求，不支持通过环境变量配置
const allowedOrigins: string[] = []

function resolveAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  if (origin === request.nextUrl.origin) {
    return origin
  }

  if (allowedOrigins.includes(origin)) {
    return origin
  }

  return null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const normalizedApiPath = pathname.startsWith('/api/v1/')
    ? pathname.replace('/api/v1/', '/api/')
    : pathname
  const isApiRequest = pathname.startsWith('/api/')
  const sessionToken = readAnonymousSessionToken(request)
  const sessionValidation = sessionToken
    ? await verifyAnonymousSessionToken(request, sessionToken)
    : { valid: false as const }
  let rateLimitHeaders: Record<string, string> = {}
  const allowedOrigin = resolveAllowedOrigin(request)
  
  // 1. API
  if (isApiRequest) {
    if (
      request.method === 'POST' &&
      normalizedApiPath.startsWith('/api/generate-') &&
      !sessionValidation.valid
    ) {
      const unauthorizedResponse = apiError(
        'UNAUTHORIZED',
        '会话校验失败，请刷新页面后重试。',
        401,
        'SESSION_REQUIRED'
      )
      const refreshedToken = await createAnonymousSessionToken(request)
      unauthorizedResponse.cookies.set({
        ...anonymousSessionCookieOptions(),
        value: refreshedToken,
      })
      return unauthorizedResponse
    }

    let rateLimitDecision: RateLimitDecision | null = null
    
    if (normalizedApiPath.includes('generate-questions')) {
      rateLimitDecision = questionsRateLimit(request)
    } else if (normalizedApiPath.includes('generate-analysis')) {
      rateLimitDecision = analysisRateLimit(request)
    } else {
      rateLimitDecision = generalRateLimit(request)
    }
    
    if (rateLimitDecision?.action === 'block') {
      return rateLimitDecision.response
    }
    
    if (rateLimitDecision?.action === 'allow') {
      rateLimitHeaders = rateLimitDecision.headers
    }
  }
  
  // 2. 
  const response = isApiRequest
    ? (pathname.startsWith('/api/v1/')
        ? NextResponse.rewrite(new URL(normalizedApiPath, request.url))
        : NextResponse.next())
    : (intlMiddleware(request) ?? NextResponse.next())
  
  // 
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value)
  })
  
  // 3. API
  if (isApiRequest) {
    // 
    if (!['GET', 'POST', 'OPTIONS'].includes(request.method)) {
      return apiError('METHOD_NOT_ALLOWED', 'Method not allowed.', 405)
    }
    
    // POST 请求需 Content-Type: application/json（登出等无体请求豁免）
    if (request.method === 'POST' && !normalizedApiPath.includes('/auth/logout')) {
      const contentType = request.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        return apiError('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415)
      }
    }

    if (request.method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, { status: 204 })
      securityHeaders.forEach(({ key, value }) => {
        preflightResponse.headers.set(key, value)
      })
      if (allowedOrigin) {
        preflightResponse.headers.set('Access-Control-Allow-Origin', allowedOrigin)
        preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
        preflightResponse.headers.set('Vary', 'Origin')
      }
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        preflightResponse.headers.set(key, value)
      })
      return preflightResponse
    }

    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      response.headers.set('Vary', 'Origin')
    }
  }

  // 
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  if (!sessionValidation.valid) {
    const refreshedToken = await createAnonymousSessionToken(request)
    response.cookies.set({
      ...anonymousSessionCookieOptions(),
      value: refreshedToken,
    })
  }
  
  return response
}

// 
export const config = {
  matcher: [
    /*
     * API
     * Next.js
     */
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
