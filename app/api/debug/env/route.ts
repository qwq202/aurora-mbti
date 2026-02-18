import { NextRequest } from 'next/server'
import { debugError, debugLog } from '@/lib/logging'
import { apiError, apiOk } from '@/lib/api-response'

/**
 *  API - 
 */
export async function GET(request: NextRequest) {
  // 
  if (process.env.NODE_ENV === 'production' || process.env.DEBUG_API_LOGS !== 'true') {
    return apiError('FORBIDDEN', 'Debug endpoint is disabled.', 403)
  }

  debugLog(' ...')

  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    // OpenAI 
    OPENAI_API_KEY_SET: !!process.env.OPENAI_API_KEY,
    OPENAI_API_URL: process.env.OPENAI_API_URL || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || '',
    // 
    timestamp: new Date().toISOString(),
    // Docker
    hostname: process.env.HOSTNAME || '',
    // 
    memory: process.memoryUsage(),
  }

  debugLog(' :', envCheck)

  return apiOk({
    status: 'success',
    environment: envCheck,
    recommendations: {
      openai_configured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_URL && process.env.OPENAI_MODEL),
      missing_vars: [
        !process.env.OPENAI_API_KEY && 'OPENAI_API_KEY',
        !process.env.OPENAI_API_URL && 'OPENAI_API_URL', 
        !process.env.OPENAI_MODEL && 'OPENAI_MODEL',
      ].filter(Boolean)
    }
  })
}

/**
 *  OpenAI
 */
export async function POST(request: NextRequest) {
  // 
  if (process.env.NODE_ENV === 'production' || process.env.DEBUG_API_LOGS !== 'true') {
    return apiError('FORBIDDEN', 'Debug endpoint is disabled.', 403)
  }

  debugLog(' OpenAI...')

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY')
    }
    if (!process.env.OPENAI_API_URL) {
      throw new Error('OPENAI_API_URL')
    }
    if (!process.env.OPENAI_MODEL) {
      throw new Error('OPENAI_MODEL')
    }

    // 
    const response = await fetch(process.env.OPENAI_API_URL + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        messages: [
          { role: 'user', content: 'Hello, this is a test message. Please respond with "Test successful".' }
        ],
        max_tokens: 10,
        stream: false
      }),
      signal: AbortSignal.timeout(30000) // 30
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      debugError(' OpenAI API:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      })

      return apiError('UPSTREAM_ERROR', `OpenAI API: ${response.status}`, 502, responseText)
    }

    const responseData = JSON.parse(responseText) as { model?: string; choices?: unknown[]; usage?: unknown }
    debugLog(' OpenAI API')

    return apiOk({
      status: 'success',
      message: 'OpenAI API',
      response_preview: {
        model: responseData.model,
        choices: responseData.choices?.length || 0,
        usage: responseData.usage
      }
    })

  } catch (error) {
    debugError(' OpenAI:', error)
    
    return apiError('INTERNAL_ERROR', error instanceof Error ? error.message : '', 500)
  }
}
