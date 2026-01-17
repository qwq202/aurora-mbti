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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let rateLimitHeaders: Record<string, string> = {}
  
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
  const response = intlMiddleware(request) ?? NextResponse.next()
  
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
    
    // CORS
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
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
