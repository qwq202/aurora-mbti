import { NextRequest } from 'next/server'
import { validateQuestionsAPI } from '@/lib/api-validation'
import { SECURITY_ERRORS } from '@/lib/security'
import { debugError, debugLog, debugWarn } from '@/lib/logging'
import { type Question } from '@/lib/mbti'
import { assertAIConfig, resolveAIConfig, streamAIText } from '@/lib/ai-provider'

/**  heuristics */
function heuristicsClean(s: string): string {
  if (!s) return s
  let t = s
  // / -> 
  t = t.replace(/，/g, ",").replace(/：/g, ":")
  t = t.replace(/[\u201c\u201d\u2018\u2019]/g, '"')
  //  \n \t
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  // },  ],
  t = t.replace(/,\s*(?=[}\]])/g, "")
  return t
}

//  API - +
export async function POST(request: NextRequest) {
  try {
    //  
    const validationResult = await validateQuestionsAPI(request)
    
    // 
    if ('status' in validationResult) {
      return validationResult // 
    }
    
    if (!validationResult.valid) {
      return Response.json(
        { error: SECURITY_ERRORS.INVALID_INPUT },
        { status: 400 }
      )
    }
    
    const { questionCount, profile, existingQuestions, batchIndex } = validationResult.data
    
    debugLog(` : ${questionCount} - ${batchIndex + 1}`)
    if (existingQuestions.length > 0) {
      debugLog(` : ${existingQuestions.length}`)
    }

    //  
    let textBuffer = ''
    let funcArgsBuffer = ''
    let currentMode: 'text' | 'function_call' = 'text'
    
    //  
    let validatedQuestions: Question[] = []
    let totalExpected = questionCount

    //  
    const existingQuestionSummaries = existingQuestions
      .map((q) => ({
        text: typeof q.text === 'string' ? q.text : '',
        dimension: typeof q.dimension === 'string' ? q.dimension : 'EI'
      }))
      .filter((q) => q.text)

    const existingQuestionsPrompt = existingQuestionSummaries.length > 0 ? `

##   (${batchIndex + 1})
****
${existingQuestionSummaries.map((q, index) => 
  `${index + 1}. [${q.dimension}] ${q.text}`
).join('\n')}

****
- 
- 
- 
- ` : ''

    //  - 
    const prompt = `MBTI${questionCount}

##  
**${questionCount}**
**ID"1""${questionCount}"**
**EI=${Math.ceil(questionCount/4)}, SN=${Math.ceil(questionCount/4)}, TF=${Math.ceil(questionCount/4)}, JP=${Math.floor(questionCount/4)}**

## 
- ${profile.age}  
- ${profile.occupation}
- ${profile.interests || ''}
- ${profile.socialPreference || ''}
- ${profile.learningStyle || ''}
- ${profile.emotionalExpression || ''}
${profile.clarifications && Object.keys(profile.clarifications).length > 0 ? `- \n${Object.entries(profile.clarifications).map(([key, value]: [string, string]) => `  - ${key}: ${value}`).join('\n')}` : ''}
${existingQuestionsPrompt}

## 
${questionCount}
1. EI${Math.ceil(questionCount/4)}1-${Math.ceil(questionCount/4)}
2. SN${Math.ceil(questionCount/4)}${Math.ceil(questionCount/4)+1}-${Math.ceil(questionCount/4)*2}
3. TF${Math.ceil(questionCount/4)}${Math.ceil(questionCount/4)*2+1}-${Math.ceil(questionCount/4)*3}
4. JP${questionCount-Math.ceil(questionCount/4)*3}${Math.ceil(questionCount/4)*3+1}-${questionCount}

## 
JSON${questionCount}
[
  {"id": "1", "text": "EI1", "dimension": "EI", "agree": "E"},
  {"id": "2", "text": "EI2", "dimension": "EI", "agree": "I"},
  ...
  {"id": "${questionCount}", "text": "JP${questionCount-Math.ceil(questionCount/4)*3}", "dimension": "JP", "agree": "P"}
]

${questionCount}`

    //  SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        //  start
        let heartbeat: NodeJS.Timeout | null = null
        
        try {
          // 
          const startData = JSON.stringify({
            type: 'start',
            message: '...',
            progress: { current: 0, total: questionCount }
          })
          controller.enqueue(encoder.encode(`data: ${startData}\n\n`))

          const aiConfig = resolveAIConfig()
          assertAIConfig(aiConfig)
          debugLog(' AI Provider:', {
            provider: aiConfig.provider,
            baseUrl: aiConfig.baseUrl,
            model: aiConfig.model
          })

          let funcArgsBuf = ''         // function_call.argumentsJSON
          
          //  HTTP/2heartbeat
          heartbeat = setInterval(() => {
            try {
              const heartbeatData = JSON.stringify({
                type: 'ping',
                timestamp: Date.now()
              })
              controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`))
            } catch (error) {
              debugWarn(':', error)
              if (heartbeat) {
                clearInterval(heartbeat)
                heartbeat = null
              }
            }
          }, 10000) // 10
          
          const streamIterator = streamAIText(aiConfig, {
            messages: [
              { role: 'system', content: 'You are a professional MBTI test generator. Output only valid JSON array format.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            maxTokens: 4000,
            timeoutMs: 60000
          })

          for await (const chunk of streamIterator) {
            if (chunk.functionArgs) {
              funcArgsBuf += chunk.functionArgs
              currentMode = 'function_call'
            }
            if (chunk.text) {
              textBuffer += chunk.text
              await tryParseAndValidate(textBuffer, controller, encoder)
            }
          }

          //  funcArgsBuftextBuffer
          if (funcArgsBuf) {
            // funcArgsBufJSON
            try {
              // 
              const cleaned = heuristicsClean(funcArgsBuf)
              debugLog('function_call.arguments:', cleaned.length)
              
              const parsedArgs = JSON.parse(cleaned) as { questions?: Question[] } | Question[]
              // parsedArgs{questions: [...]}
              
              //  Schema
              await finalParseAndValidate(
                JSON.stringify(parsedArgs.questions || parsedArgs),
                controller,
                encoder,
                questionCount
              )
              
            } catch (err) {
              // 
              debugError('JSON:', funcArgsBuf.substring(0, 200), err)
              
              //  
              const errorData = JSON.stringify({
                type: 'error',
                message: 'AIJSON',
                suggestion: 'retry',
                rawContent: funcArgsBuf.substring(0, 500)
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            }
          } else if (textBuffer) {
            // 
            await finalParseAndValidate(textBuffer, controller, encoder, questionCount)
          }

          //  
          if (heartbeat) {
            clearInterval(heartbeat)
            heartbeat = null
          }
          debugLog(' ')

        } catch (error) {
          debugError(' :', error)
          debugError(' :', error instanceof Error ? error.stack : 'No stack trace')
          
          //  
          try {
            if (heartbeat) {
              clearInterval(heartbeat)
              heartbeat = null
            }
          } catch (cleanupError) {
            debugWarn(':', cleanupError)
          }
          
          //  
          try {
            const errorData = JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : '',
              retry: true, // 
              details: error instanceof Error ? error.stack : ''
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          } catch (sendError) {
            debugError(':', sendError)
          }
        } finally {
          //  
          try {
            if (heartbeat) {
              clearInterval(heartbeat)
              heartbeat = null
            }
            controller.close()
            debugLog(' ')
          } catch (finalError) {
            debugError(':', finalError)
          }
        }
      }
    })

    //   - 
    async function tryParseAndValidate(
      buffer: string,
      controller: ReadableStreamDefaultController<Uint8Array>,
      encoder: TextEncoder
    ) {
      try {
        // JSON
        const jsonMatch = buffer.match(/\[[\s\S]*\]/)
        if (!jsonMatch) return

        const potentialJson = jsonMatch[0]
        const parsed = safeParseJson<unknown[]>(potentialJson, '')
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          //  Schema
          const validQuestions = parsed.filter(isQuestion)

          if (validQuestions.length > validatedQuestions.length) {
            //  
            validatedQuestions = validQuestions
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              message: `${validQuestions.length}...`,
              progress: { current: validQuestions.length, total: questionCount },
              questions: validQuestions.slice(-1) // 
            })}\n\n`))
          }
        }
      } catch (error) {
        debugWarn(':', error)
      }
    }

    //  
    async function finalParseAndValidate(
      buffer: string,
      controller: ReadableStreamDefaultController<Uint8Array>,
      encoder: TextEncoder,
      expectedCount: number
    ) {
      try {
        debugLog(' ...')
        
        // 
        let questions: Question[] = []
        
        // 1: JSON
        try {
          const directParsed = JSON.parse(buffer) as unknown
          if (Array.isArray(directParsed)) {
            questions = directParsed.filter(isQuestion)
          }
        } catch (error) {
          debugWarn('JSON:', error)
        }

        // 2: JSON
        if (questions.length === 0) {
          const jsonMatch = buffer.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const parsed = safeParseJson<unknown[]>(jsonMatch[0], 'JSON')
            if (Array.isArray(parsed)) {
              questions = parsed.filter(isQuestion)
            }
          }
        }

        // 3: 
        if (questions.length === 0) {
          const objectMatches = buffer.match(/\{[^}]*\}/g)
          if (objectMatches) {
            questions = objectMatches
              .map(match => safeParseJson<unknown>(match, ''))
              .filter(isQuestion)
          }
        }

        //  Schema
        const validQuestions = questions.filter(isQuestion)

        //  
        const normalizedQuestions = normalizeQuestions(validQuestions, expectedCount)

        if (normalizedQuestions.length === expectedCount) {
          //  
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'success',
            message: `${normalizedQuestions.length}`,
            questions: normalizedQuestions,
            metadata: {
              total_count: normalizedQuestions.length,
              batch_number: batchIndex + 1,
              generation_method: 'robust_streaming'
            }
          })}\n\n`))
        } else {
          //  
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'partial_success',
            message: `${normalizedQuestions.length}${expectedCount}`,
            questions: normalizedQuestions,
            retry: true
          })}\n\n`))
        }

      } catch (error) {
        debugError(':', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'parse_error',
          error: '',
          retry: true
        })}\n\n`))
      }
    }

    //   - 
    function normalizeQuestions(questions: Question[], targetCount: number): Question[] {
      // 
      const uniqueQuestions = questions.filter((q, index, arr) => 
        arr.findIndex(item => item.text === q.text) === index
      )

      // 
      let reindexed = uniqueQuestions.map((q, index) => ({
        ...q,
        id: String(index + 1)
      }))

      // 
      if (reindexed.length < targetCount) {
        debugLog(` AI: ${reindexed.length}/${targetCount}...`)
        
        // 
        const dims = ['EI', 'SN', 'TF', 'JP'] as const
        const dimCounts: Record<string, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }
        reindexed.forEach(q => {
          if (dimCounts[q.dimension] !== undefined) {
            dimCounts[q.dimension]++
          }
        })

        // 
        const base = Math.floor(targetCount / 4)
        const rem = targetCount % 4
        const targets: Record<string, number> = {
          EI: base + (rem > 0 ? 1 : 0),
          SN: base + (rem > 1 ? 1 : 0), 
          TF: base + (rem > 2 ? 1 : 0),
          JP: base,
        }

        // 
        const fallbackTemplates: Record<string, string[]> = {
          EI: [
            '',
            '',
            '',
            '',
            '',
          ],
          SN: [
            '',
            '',
            '',
            '',
            '',
          ],
          TF: [
            '',
            '',
            '',
            '',
            '',
          ],
          JP: [
            '',
            '',
            '',
            '',
            '',
          ]
        }

        // 
        let currentId = reindexed.length + 1
        for (const dim of dims) {
          const needed = targets[dim] - dimCounts[dim]
          if (needed > 0) {
            const templates = fallbackTemplates[dim]
            for (let i = 0; i < needed && currentId <= targetCount; i++) {
              const templateIndex = i % templates.length
              reindexed.push({
                id: String(currentId++),
                text: templates[templateIndex],
                dimension: dim,
                agree: dim[0] // E, S, T, J
              })
            }
          }
        }

        debugLog(` : ${reindexed.length}/${targetCount}`)
      }

      // 
      if (reindexed.length > targetCount) {
        reindexed = reindexed.slice(0, targetCount)
      }
      
      return reindexed
    }

    function isQuestion(value: unknown): value is Question {
      if (!value || typeof value !== 'object') return false
      const q = value as Question
      return typeof q.id === 'string' &&
        typeof q.text === 'string' &&
        ['EI', 'SN', 'TF', 'JP'].includes(q.dimension) &&
        ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'].includes(q.agree)
    }

    function safeParseJson<T>(input: string, context: string): T | null {
      try {
        return JSON.parse(input) as T
      } catch (error) {
        debugWarn(`${context} JSON:`, error)
        return null
      }
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        //  HTTP/2
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (error) {
    debugError('API:', error)
    return Response.json(
      { error: '', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
