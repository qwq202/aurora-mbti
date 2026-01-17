import { NextRequest } from 'next/server'

type OpenAIStreamDelta = { content?: string }
type OpenAIStreamChoice = { delta?: OpenAIStreamDelta }
type OpenAIStreamChunk = { choices?: OpenAIStreamChoice[] }

type NDJSONQuestion = {
  question: string
  options: string[]
  type: string
}

type NDJSONSSEEvent = {
  type: 'start' | 'progress' | 'question' | 'complete' | 'error'
  message?: string
  total?: number
  batchIndex?: number
  question?: NDJSONQuestion
  questions?: NDJSONQuestion[]
  count?: number
  current?: number
  progress?: number
  index?: number
  error?: string
}

//  NDJSONAPI - 
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      questionCount?: number
      profile?: unknown
      existingQuestions?: Array<{ question?: string }>
      batchIndex?: number
    }
    const questionCount = body.questionCount ?? 0
    const profile = body.profile ?? {}
    const existingQuestions = Array.isArray(body.existingQuestions) ? body.existingQuestions : []
    const batchIndex = Number.isFinite(body.batchIndex) ? Number(body.batchIndex) : 0

    //  NDJSON
    const prompt = `${questionCount}MBTI

: ${JSON.stringify(profile)}

${existingQuestions.length > 0 ? `: ${existingQuestions.map((q) => q.question).filter(Boolean).join('; ')}` : ''}


1. NDJSONnewline-delimited JSON
2. {"question":"","options":["A","B"],"type":"E/I"}
3. type: E/I, S/N, T/F, J/P 
4. 
5. ${questionCount}
6. JSON


{"question":"","options":["",""],"type":"E/I"}
{"question":"","options":["",""],"type":"T/F"}`

    //  SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        //  SSE
        function pushSSE(data: NDJSONSSEEvent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          //  OpenAI API
          const openaiResponse = await fetch(process.env.OPENAI_API_URL + '/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL,
              messages: [
                { role: 'system', content: 'You are a professional MBTI test generator. Output ONLY NDJSON format as requested.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              stream: true
            })
          })

          if (!openaiResponse.ok) {
            throw new Error(`OpenAI API: ${openaiResponse.status}`)
          }

          const reader = openaiResponse.body?.getReader()
          if (!reader) {
            throw new Error('')
          }

          //  NDJSON - 
          const decoder = new TextDecoder('utf-8')
          let buffer = ''
          let currentQuestionCount = 0
          const generatedQuestions: NDJSONQuestion[] = []
          
          //  
          pushSSE({
            type: 'start',
            message: '',
            total: questionCount,
            batchIndex
          })

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            //  chunk
            const chunk = decoder.decode(value, { stream: true })
            
            //  contentSSE
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]' || data === '') continue
                
                try {
                  const parsed = JSON.parse(data) as OpenAIStreamChunk
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    buffer += content
                  }
                } catch (e) {
                  console.warn('SSE:', e)
                  continue
                }
              }
            }

            //  NDJSON - 
            let newlineIndex: number
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, newlineIndex).trim()
              buffer = buffer.slice(newlineIndex + 1)
              
              if (!line) continue

              try {
                //  JSON
                const questionObj = JSON.parse(line) as NDJSONQuestion
                
                //  
                if (questionObj.question && 
                    Array.isArray(questionObj.options) && 
                    questionObj.options.length === 2 &&
                    ['E/I', 'S/N', 'T/F', 'J/P'].includes(questionObj.type)) {
                  
                  currentQuestionCount++
                  generatedQuestions.push(questionObj)
                  
                  //  
                  pushSSE({
                    type: 'progress',
                    current: currentQuestionCount,
                    total: questionCount,
                    progress: Math.round((currentQuestionCount / questionCount) * 100),
                    batchIndex
                  })
                  
                  //  
                  pushSSE({
                    type: 'question',
                    question: questionObj,
                    index: currentQuestionCount,
                    batchIndex
                  })
                  
                  //  
                  if (currentQuestionCount >= questionCount) {
                    break
                  }
                } else {
                  //  
                  console.warn(':', line)
                }
              } catch (e) {
                console.warn('NDJSON:', e)
                //  JSONbuffer
                buffer = line + '\n' + buffer
                break
              }
            }
            
            //  
            if (currentQuestionCount >= questionCount) {
              break
            }
          }

          //  
          pushSSE({
            type: 'success',
            message: `AI${currentQuestionCount}`,
            questions: generatedQuestions,
            count: currentQuestionCount,
            batchIndex
          })

        } catch (error) {
          console.error('NDJSON:', error)
          
          //  
          pushSSE({
            type: 'error',
            message: 'AI',
            suggestion: 'retry',
            error: error instanceof Error ? error.message : String(error)
          })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('NDJSON API:', error)
    return Response.json({ 
      error: 'API',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
