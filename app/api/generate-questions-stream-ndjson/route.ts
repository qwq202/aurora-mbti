import { NextRequest } from 'next/server'
import { assertAIConfig, resolveAIConfig, streamAIText } from '@/lib/ai-provider'
import { apiError } from '@/lib/api-response'

type NDJSONQuestion = {
  question: string
  options: string[]
  type: string
}

type NDJSONEvent = {
  type: 'start' | 'progress' | 'question' | 'complete' | 'success' | 'error'
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
  suggestion?: string
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
        
        function pushNDJSON(data: NDJSONEvent) {
          controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`))
        }

        try {
          const aiConfig = resolveAIConfig()
          assertAIConfig(aiConfig)

          let buffer = ''
          let currentQuestionCount = 0
          const generatedQuestions: NDJSONQuestion[] = []
          
          //  
          pushNDJSON({
            type: 'start',
            message: '',
            total: questionCount,
            batchIndex
          })

          const iterator = streamAIText(aiConfig, {
            messages: [
              { role: 'system', content: 'You are a professional MBTI test generator. Output ONLY NDJSON format as requested.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            timeoutMs: 60000
          })

          for await (const chunk of iterator) {
            if (chunk.text) {
              buffer += chunk.text
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
                  pushNDJSON({
                    type: 'progress',
                    current: currentQuestionCount,
                    total: questionCount,
                    progress: Math.round((currentQuestionCount / questionCount) * 100),
                    batchIndex
                  })
                  
                  //  
                  pushNDJSON({
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
          pushNDJSON({
            type: 'success',
            message: `AI${currentQuestionCount}`,
            questions: generatedQuestions,
            count: currentQuestionCount,
            batchIndex
          })

        } catch (error) {
          console.error('NDJSON:', error)
          
          //  
          pushNDJSON({
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
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('NDJSON API:', error)
    return apiError('INTERNAL_ERROR', 'NDJSON API failed', 500, error instanceof Error ? error.message : String(error))
  }
}
