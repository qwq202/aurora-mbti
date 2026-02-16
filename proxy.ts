import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { questionsRateLimit, analysisRateLimit, generalRateLimit, type RateLimitDecision } from '@/lib/rate-limit'
import { CSP_CONFIG } from '@/lib/security'

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

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let rateLimitHeaders: Record<string, string> = {}
  const allowedOrigin = resolveAllowedOrigin(request)
  
  // 1. API
  if (pathname.startsWith('/api/')) {
    let rateLimitDecision: RateLimitDecision | null = null
    
    if (pathname.includes('generate-questions')) {
      rateLimitDecision = questionsRateLimit(request)
    } else if (pathname.includes('generate-analysis')) {
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
  const response = pathname.startsWith('/api/')
    ? NextResponse.next()
    : (intlMiddleware(request) ?? NextResponse.next())
  
  // 
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value)
  })
  
  // 3. API
  if (pathname.startsWith('/api/')) {
    // 
    if (!['GET', 'POST', 'OPTIONS'].includes(request.method)) {
      return NextResponse.json(
        { error: '' },
        { status: 405 }
      )
    }
    
    // POSTContent-Type
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Content-Typeapplication/json' },
          { status: 400 }
        )
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
