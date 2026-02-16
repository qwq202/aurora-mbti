import { NextRequest } from 'next/server'
import { debugError, debugLog } from '@/lib/logging'

/**
 *  API - 
 */
export async function GET(request: NextRequest) {
  // 
  if (process.env.NODE_ENV === 'production' || process.env.DEBUG_API_LOGS !== 'true') {
    return Response.json({ error: '' }, { status: 403 })
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

  return Response.json({
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
    return Response.json({ error: '' }, { status: 403 })
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

      return Response.json({
        status: 'error',
        error: `OpenAI API: ${response.status}`,
        details: responseText
      }, { status: 500 })
    }

    const responseData = JSON.parse(responseText) as { model?: string; choices?: unknown[]; usage?: unknown }
    debugLog(' OpenAI API')

    return Response.json({
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
    
    return Response.json({
      status: 'error',
      error: error instanceof Error ? error.message : ''
    }, { status: 500 })
  }
}
