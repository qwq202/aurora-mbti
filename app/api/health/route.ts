/**
 *  API - Docker
 */
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
    }

    const allEnvSet = Object.values(envCheck).every(Boolean)

    const responseTime = Date.now() - startTime

    return Response.json({
      ...healthStatus,
      environment_check: envCheck,
      all_env_configured: allEnvSet,
      response_time_ms: responseTime,
      checks: {
        memory_usage_mb: Math.round(healthStatus.memory.heapUsed / 1024 / 1024),
        memory_limit_ok: healthStatus.memory.heapUsed < 400 * 1024 * 1024, // 400MB
        uptime_ok: healthStatus.uptime > 10, // 10
        env_ok: allEnvSet,
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
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error(' :', error)
    return Response.json({
      error: error instanceof Error ? error.message : ''
    }, { status: 500 })
  }
}