import { NextRequest } from 'next/server'
import { validateQuestionsAPI } from '@/lib/api-validation'
import { debugError, debugLog, debugWarn } from '@/lib/logging'
import { type Question } from '@/lib/mbti'
import { assertAIConfig, resolveAIConfig, streamAIText } from '@/lib/ai-provider'
import { apiError } from '@/lib/api-response'
import { checkAnonymousTestAccess } from '@/lib/anonymous-access'

function heuristicsClean(s: string): string {
  if (!s) return s
  let t = s
  t = t.replace(/，/g, ",").replace(/：/g, ":")
  t = t.replace(/[\u201c\u201d\u2018\u2019]/g, '"')
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  t = t.replace(/,\s*(?=[}\]])/g, "")
  return t
}

function getLocalizedPrompt(
  questionCount: number,
  profile: Partial<{ age?: number; occupation?: string; interests?: string; socialPreference?: string; learningStyle?: string; emotionalExpression?: string; clarifications?: Record<string, string> }>,
  existingQuestions: Array<{ text: string; dimension: string }>,
  batchIndex: number,
  locale: string
): string {
  const existingQuestionSummaries = existingQuestions
    .map((q) => ({
      text: typeof q.text === 'string' ? q.text : '',
      dimension: typeof q.dimension === 'string' ? q.dimension : 'EI'
    }))
    .filter((q) => q.text)

  const isEn = locale === 'en'
  const isJa = locale === 'ja'

  const existingPrompt = existingQuestionSummaries.length > 0
    ? isEn
      ? `\n## Existing Questions (Batch ${batchIndex + 1})\n**Avoid duplicating these questions:**\n${existingQuestionSummaries.map((q, i) => `${i + 1}. [${q.dimension}] ${q.text}`).join('\n')}\n\n**Requirements:**\n- Questions must be distinct from existing ones\n- Generate new questions only\n- Maintain dimension balance\n`
      : isJa
      ? `\n## 既存の問題（バッチ ${batchIndex + 1}）\n**以下の問題と重複しないようにしてください：**\n${existingQuestionSummaries.map((q, i) => `${i + 1}. [${q.dimension}] ${q.text}`).join('\n')}\n\n**要件：**\n- 既存の問題と重複しない\n- 新しい問題のみを生成\n- 次元のバランスを維持\n`
      : `\n## 已有题目（第${batchIndex + 1}批）\n**请勿重复以下题目：**\n${existingQuestionSummaries.map((q, i) => `${i + 1}. [${q.dimension}] ${q.text}`).join('\n')}\n\n**要求：**\n- 题目不得与已有题目重复\n- 只生成新题目\n- 保持维度平衡\n`
    : ''

  const clarificationsText = profile.clarifications && Object.keys(profile.clarifications).length > 0
    ? isEn
      ? `\n- Clarifications:\n${Object.entries(profile.clarifications).map(([k, v]: [string, string]) => `  - ${k}: ${v}`).join('\n')}`
      : isJa
      ? `\n- 補足情報:\n${Object.entries(profile.clarifications).map(([k, v]: [string, string]) => `  - ${k}: ${v}`).join('\n')}`
      : `\n- 补充信息:\n${Object.entries(profile.clarifications).map(([k, v]: [string, string]) => `  - ${k}: ${v}`).join('\n')}`
    : ''

  if (isEn) {
    return `MBTI Test Question Generation (${questionCount} questions)

## Requirements
**Generate ${questionCount} MBTI test questions**
**Question IDs from "1" to "${questionCount}"**
**Dimension distribution: EI=${Math.ceil(questionCount/4)}, SN=${Math.ceil(questionCount/4)}, TF=${Math.ceil(questionCount/4)}, JP=${Math.floor(questionCount/4)}**

## User Profile
- Age: ${profile.age || 'unknown'} years old
- Occupation: ${profile.occupation || 'unknown'}
- Interests: ${profile.interests || 'unknown'}
- Social preference: ${profile.socialPreference || 'unknown'}
- Learning style: ${profile.learningStyle || 'unknown'}
- Emotional expression: ${profile.emotionalExpression || 'unknown'}${clarificationsText}
${existingPrompt}

## Dimension Distribution
Total ${questionCount} questions:
1. EI dimension: ${Math.ceil(questionCount/4)} questions (IDs 1-${Math.ceil(questionCount/4)})
2. SN dimension: ${Math.ceil(questionCount/4)} questions (IDs ${Math.ceil(questionCount/4)+1}-${Math.ceil(questionCount/4)*2})
3. TF dimension: ${Math.ceil(questionCount/4)} questions (IDs ${Math.ceil(questionCount/4)*2+1}-${Math.ceil(questionCount/4)*3})
4. JP dimension: ${questionCount-Math.ceil(questionCount/4)*3} questions (IDs ${Math.ceil(questionCount/4)*3+1}-${questionCount})

## Output Format
JSON array with ${questionCount} questions:
[
  {"id": "1", "text": "EI question text in English", "dimension": "EI", "agree": "E"},
  {"id": "2", "text": "EI question text in English", "dimension": "EI", "agree": "I"},
  ...
  {"id": "${questionCount}", "text": "JP question text in English", "dimension": "JP", "agree": "P"}
]

**IMPORTANT: All questions must be written in English. Generate exactly ${questionCount} questions.**`
  }

  if (isJa) {
    return `MBTIテスト問題生成（${questionCount}問）

## 要件
**${questionCount}問のMBTIテスト問題を生成してください**
**ID番号は「1」から「${questionCount}」まで**
**次元の分布: EI=${Math.ceil(questionCount/4)}, SN=${Math.ceil(questionCount/4)}, TF=${Math.ceil(questionCount/4)}, JP=${Math.floor(questionCount/4)}**

## ユーザープロフィール
- 年齢: ${profile.age || '不明'} 歳
- 職業: ${profile.occupation || '不明'}
- 趣味: ${profile.interests || '不明'}
- 社交的嗜好: ${profile.socialPreference || '不明'}
- 学習スタイル: ${profile.learningStyle || '不明'}
- 感情表現: ${profile.emotionalExpression || '不明'}${clarificationsText}
${existingPrompt}

## 次元の分布
合計${questionCount}問:
1. EI次元: ${Math.ceil(questionCount/4)}問（ID 1-${Math.ceil(questionCount/4)}）
2. SN次元: ${Math.ceil(questionCount/4)}問（ID ${Math.ceil(questionCount/4)+1}-${Math.ceil(questionCount/4)*2}）
3. TF次元: ${Math.ceil(questionCount/4)}問（ID ${Math.ceil(questionCount/4)*2+1}-${Math.ceil(questionCount/4)*3}）
4. JP次元: ${questionCount-Math.ceil(questionCount/4)*3}問（ID ${Math.ceil(questionCount/4)*3+1}-${questionCount}）

## 出力形式
${questionCount}問のJSON配列:
[
  {"id": "1", "text": "EI日本語の問題文", "dimension": "EI", "agree": "E"},
  {"id": "2", "text": "EI日本語の問題文", "dimension": "EI", "agree": "I"},
  ...
  {"id": "${questionCount}", "text": "JP日本語の問題文", "dimension": "JP", "agree": "P"}
]

**重要: すべての問題は日本語で書かれている必要があります。正確に${questionCount}問生成してください。**`
  }

  // 默认中文
  return `MBTI测试题目生成（${questionCount}题）

## 要求
**生成${questionCount}道MBTI测试题目**
**ID编号从"1"开始到"${questionCount}"结束**
**维度分布: EI=${Math.ceil(questionCount/4)}, SN=${Math.ceil(questionCount/4)}, TF=${Math.ceil(questionCount/4)}, JP=${Math.floor(questionCount/4)}**

## 用户档案
- 年龄: ${profile.age || '未知'} 岁
- 职业: ${profile.occupation || '未知'}
- 兴趣爱好: ${profile.interests || '未知'}
- 社交偏好: ${profile.socialPreference || '未知'}
- 学习风格: ${profile.learningStyle || '未知'}
- 情感表达: ${profile.emotionalExpression || '未知'}${clarificationsText}
${existingPrompt}

## 维度分布
共${questionCount}题:
1. EI维度: ${Math.ceil(questionCount/4)}题（ID 1-${Math.ceil(questionCount/4)}）
2. SN维度: ${Math.ceil(questionCount/4)}题（ID ${Math.ceil(questionCount/4)+1}-${Math.ceil(questionCount/4)*2}）
3. TF维度: ${Math.ceil(questionCount/4)}题（ID ${Math.ceil(questionCount/4)*2+1}-${Math.ceil(questionCount/4)*3}）
4. JP维度: ${questionCount-Math.ceil(questionCount/4)*3}题（ID ${Math.ceil(questionCount/4)*3+1}-${questionCount}）

## 输出格式
${questionCount}题的JSON数组:
[
  {"id": "1", "text": "EI题目文本", "dimension": "EI", "agree": "E"},
  {"id": "2", "text": "EI题目文本", "dimension": "EI", "agree": "I"},
  ...
  {"id": "${questionCount}", "text": "JP题目文本", "dimension": "JP", "agree": "P"}
]

**重要: 所有题目必须用中文书写。请准确生成${questionCount}题。**`
}

function getSystemPrompt(locale: string): string {
  const isEn = locale === 'en'
  const isJa = locale === 'ja'

  if (isEn) {
    return 'You are a professional MBTI test generator. Generate valid JSON array format. All questions must be written in English.'
  }
  if (isJa) {
    return 'You are a professional MBTI test generator. Generate valid JSON array format. All questions must be written in Japanese.'
  }
  return 'You are a professional MBTI test generator. Generate valid JSON array format. All questions must be written in Chinese.'
}

//  API - +
export async function POST(request: NextRequest) {
  // 检查匿名测试访问权限
  const accessDenied = checkAnonymousTestAccess(request)
  if (accessDenied) return accessDenied

  try {
    //  
    const validationResult = await validateQuestionsAPI(request)
    
    // 
    if ('status' in validationResult) {
      return validationResult // 
    }

    const { questionCount, profile, existingQuestions, batchIndex, locale } = validationResult.data
    
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
      .filter((q) => q.text) as Array<{ text: string; dimension: string }>

    const prompt = getLocalizedPrompt(questionCount, profile, existingQuestionSummaries, batchIndex, locale || 'zh')
    const systemPrompt = getSystemPrompt(locale || 'zh')

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
              { role: 'system', content: systemPrompt },
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
              const parsedQuestions = (typeof parsedArgs === 'object' && parsedArgs !== null && 'questions' in parsedArgs)
                ? parsedArgs.questions
                : undefined
              // parsedArgs{questions: [...]}
              
              //  Schema
              await finalParseAndValidate(
                JSON.stringify(parsedQuestions || parsedArgs),
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
                agree: dim[0] as Question['agree'] // E, S, T, J
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
        //  HTTP/2
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (error) {
    debugError('API:', error)
    return apiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', 500)
  }
}
