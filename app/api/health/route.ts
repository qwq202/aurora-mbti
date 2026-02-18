/**
 *  API - Docker
 */
import { resolveAIConfig } from '@/lib/ai-provider'
import { readStoredAIConfig } from '@/lib/ai-settings-store'
import { apiError, apiOk } from '@/lib/api-response'

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
    const storedConfig = readStoredAIConfig()
    const envCheck = {
      ai_provider_env: process.env.AI_PROVIDER || '',
      ai_api_key_env: !!process.env.AI_API_KEY,
      ai_base_url_env: !!process.env.AI_BASE_URL,
      ai_model_env: !!process.env.AI_MODEL,
      panel_configured: Boolean(storedConfig),
    }
    const aiConfig = resolveAIConfig()
    const aiConfigured = aiConfig.spec.requiresApiKey ? !!aiConfig.apiKey : true

    const responseTime = Date.now() - startTime

    return apiOk({
      ...healthStatus,
      environment_check: envCheck,
      config_source: storedConfig ? 'panel' : 'env',
      ai_provider: aiConfig.provider,
      ai_configured: aiConfigured,
      response_time_ms: responseTime,
      checks: {
        memory_usage_mb: Math.round(healthStatus.memory.heapUsed / 1024 / 1024),
        memory_limit_ok: healthStatus.memory.heapUsed < 400 * 1024 * 1024, // 400MB
        uptime_ok: healthStatus.uptime > 10, // 10
        env_ok: Boolean(storedConfig) || !!process.env.AI_PROVIDER,
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
    
    return apiError('SERVICE_UNAVAILABLE', error instanceof Error ? error.message : '', 503)
  }
}

/**
 *   - HTTP/2
 */
export async function POST() {
  try {
    // 
    const encoder = new TextEncoder()
    
    // 用闭包让 start 和 cancel 共享 interval 引用
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null

    const stream = new ReadableStream({
      start(controller) {
        let count = 0
        heartbeatInterval = setInterval(() => {
          count++
          const data = JSON.stringify({
            type: 'test',
            count,
            timestamp: Date.now(),
            message: ` ${count}`
          })
          
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          
          if (count >= 5) {
            clearInterval(heartbeatInterval!)
            heartbeatInterval = null
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              message: ''
            })}\n\n`))
            controller.close()
          }
        }, 1000)
      },
      // 客户端提前断开（如关闭页面）时触发，清理定时器防止泄漏
      cancel() {
        if (heartbeatInterval !== null) {
          clearInterval(heartbeatInterval)
          heartbeatInterval = null
        }
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
    return apiError('INTERNAL_ERROR', error instanceof Error ? error.message : '', 500)
  }
}
