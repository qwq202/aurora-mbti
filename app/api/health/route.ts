/**
 *  API - Docker
 */
import { resolveAIConfig } from '@/lib/ai-provider'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // 
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV,
      hostname: process.env.HOSTNAME || 'unknown',
    }

    // 
    const envCheck = {
      openai_api_key: !!process.env.OPENAI_API_KEY,
      openai_api_url: !!process.env.OPENAI_API_URL,
      openai_model: !!process.env.OPENAI_MODEL,
      ai_provider: process.env.AI_PROVIDER || '',
      ai_api_key: !!process.env.AI_API_KEY,
      ai_base_url: !!process.env.AI_BASE_URL,
      ai_model: !!process.env.AI_MODEL,
    }

    const aiConfig = resolveAIConfig()
    const aiConfigured = aiConfig.spec.requiresApiKey ? !!aiConfig.apiKey : true

    const allEnvSet = Object.values({
      openai_api_key: envCheck.openai_api_key,
      openai_api_url: envCheck.openai_api_url,
      openai_model: envCheck.openai_model
    }).every(Boolean)

    const responseTime = Date.now() - startTime

    return Response.json({
      ...healthStatus,
      environment_check: envCheck,
      all_env_configured: allEnvSet,
      ai_provider: aiConfig.provider,
      ai_configured: aiConfigured,
      response_time_ms: responseTime,
      checks: {
        memory_usage_mb: Math.round(healthStatus.memory.heapUsed / 1024 / 1024),
        memory_limit_ok: healthStatus.memory.heapUsed < 400 * 1024 * 1024, // 400MB
        uptime_ok: healthStatus.uptime > 10, // 10
        env_ok: allEnvSet,
        ai_ok: aiConfigured,
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error(' :', error)
    
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '',
      response_time_ms: Date.now() - startTime,
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    })
  }
}

/**
 *   - HTTP/2
 */
export async function POST() {
  try {
    // 
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        let count = 0
        const interval = setInterval(() => {
          count++
          const data = JSON.stringify({
            type: 'test',
            count,
            timestamp: Date.now(),
            message: ` ${count}`
          })
          
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          
          if (count >= 5) {
            clearInterval(interval)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              message: ''
            })}\n\n`))
            controller.close()
          }
        }, 1000) // 
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
    })

  } catch (error) {
    console.error(' :', error)
    return Response.json({
      error: error instanceof Error ? error.message : ''
    }, { status: 500 })
  }
}
