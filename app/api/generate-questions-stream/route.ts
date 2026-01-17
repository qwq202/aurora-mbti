import { NextRequest, NextResponse } from 'next/server'
import { type UserProfile } from '@/lib/mbti'

type OpenAIStreamDelta = { content?: string }
type OpenAIStreamChoice = { delta?: OpenAIStreamDelta }
type OpenAIStreamChunk = { choices?: OpenAIStreamChoice[] }

// API - OpenAIstreamtoken
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { profileData: UserProfile; questionCount?: number }
    const { profileData, questionCount = 30 } = body
    
    console.log(`: ${questionCount}`)
    
    // AI
    const accuracyAddendum = questionCount >= 100 ? `
## ${questionCount}
7. 
8. ////reverse-keyed
9. 
10. 30
11. 
12. 
` : ''

    const clarifications =
      profileData?.clarifications && typeof profileData.clarifications === 'object'
        ? Object.entries(profileData.clarifications as Record<string, string>)
            .map(([key, value]: [string, string]) => `- ${key}: ${value}`)
            .join('\n')
        : ''

    const prompt = `MBTI${questionCount}

## 
- ${profileData.age}
- ${profileData.occupation}
- ${profileData.interests || ''}
- ${profileData.socialPreference || ''}
- ${profileData.learningStyle || ''}
- ${profileData.emotionalExpression || ''}
${clarifications ? `- \n${clarifications}` : ''}

## 
1. ****${questionCount}
2. ****(EI/SN/TF/JP)${Math.ceil(questionCount/4)}
3. ****
4. ****
5. ****
6. ****
${accuracyAddendum}

## 
- **EI**vs
- **SN**vs  
- **TF**vs
- **JP**vs

## 
JSON

{
  "questions": [
    {"id": "1", "text": "${profileData.occupation}", "dimension": "EI", "agree": "E"},
    {"id": "2", "text": "${profileData.interests}", "dimension": "SN", "agree": "S"}
  ]
}

${questionCount}`

    // SSE
    const encoder = new TextEncoder()
    const temperature = questionCount >= 100 ? 0.35 : 0.7
    
    const stream = new ReadableStream({
      async start(controller) {
        //  finally 
        let pingTimer: ReturnType<typeof setInterval> | null = null
        let abortSignal: AbortSignal | null = null
        let onAbort: (() => void) | null = null
        try {
          let isClosed = false
          const safeEnqueue = (chunk: Uint8Array) => {
            if (isClosed) return
            try {
              controller.enqueue(chunk)
            } catch (error) {
              isClosed = true
              console.warn('SSE:', error)
            }
          }
          // 
          const heartbeat = () => safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping', t: Date.now() })}\n\n`))
          pingTimer = setInterval(heartbeat, 10000)
          // 
          safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`))
          heartbeat()

          // OpenAI API with stream=true
          const response = await fetch(process.env.OPENAI_API_URL + '/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL,
              messages: [
                { role: 'user', content: prompt }
              ],
              temperature,
              stream: true  // 
            })
          })

          if (!response.ok) {
            throw new Error(`OpenAI API: ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('')
          }

          // 
          abortSignal = request.signal
          onAbort = () => {
            isClosed = true
            try { if (pingTimer) clearInterval(pingTimer) } catch (error) { console.warn(':', error) }
            try { reader.cancel() } catch (error) { console.warn(':', error) }
            try { controller.close() } catch (error) { console.warn(':', error) }
          }
          if (abortSignal.aborted) onAbort()
          else abortSignal.addEventListener('abort', onAbort)

          let accumulatedContent = ''
          
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break
            
            // SSE
            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                
                if (data === '[DONE]') {
                  // 
                  safeEnqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'done',
                    content: accumulatedContent
                  })}\n\n`))
                  try { if (pingTimer) clearInterval(pingTimer) } catch (error) { console.warn(':', error) }
                  if (!isClosed) {
                    try {
                      controller.close()
                      isClosed = true
                    } catch (error) {
                      isClosed = true
                      console.warn(':', error)
                    }
                  }
                  return
                }
                
                try {
                  const parsed = JSON.parse(data) as OpenAIStreamChunk
                  const delta = parsed.choices?.[0]?.delta?.content
                  
                  if (delta) {
                    accumulatedContent += delta
                    
                    // 
                    safeEnqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'delta',
                      delta: delta,
                      content: accumulatedContent
                    })}\n\n`))
                  }
                } catch (parseError) {
                  console.warn(':', parseError)
                }
              }
            }
          }
          
        } catch (error) {
          // 
          const isAbort = error instanceof Error && (/abort/i.test(error.message) || error.name === 'AbortError' || /terminated/i.test(String(error)))
          if (isAbort) console.warn(':', error)
          else console.error(':', error)
          try {
            const payload = encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : ''
            })}\n\n`)
            // safe enqueue
            try { (controller as ReadableStreamDefaultController<Uint8Array>).enqueue(payload) } catch (enqueueError) { console.warn(':', enqueueError) }
          } finally {
            try { if (pingTimer) clearInterval(pingTimer) } catch (timerError) { console.warn(':', timerError) }
            try { if (abortSignal && onAbort) abortSignal.removeEventListener('abort', onAbort as EventListener) } catch (removeError) { console.warn(':', removeError) }
            try { (controller as ReadableStreamDefaultController<Uint8Array>).close() } catch (closeError) { console.warn(':', closeError) }
          }
        }
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'  // Nginx
      }
    })
    
  } catch (error) {
    console.error(':', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
