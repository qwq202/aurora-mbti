import { NextRequest } from 'next/server'
import { validateAnalysisAPI } from '@/lib/api-validation'
import { SECURITY_ERRORS } from '@/lib/security'
import { type AIAnalysis } from '@/lib/ai-types'
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

//  AIAPI - 
export async function POST(request: NextRequest) {
  try {
    //  
    const validationResult = await validateAnalysisAPI(request)
    
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
    
    const { profile, answers, questions, mbtiResult } = validationResult.data
    const clarifications = profile?.clarifications && typeof profile.clarifications === 'object'
      ? Object.entries(profile.clarifications as Record<string, string>)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n')
      : ''
    
    console.log(` AI: ${mbtiResult.type}`)

    //  
    let textBuffer = ''
    let funcArgsBuffer = ''
    let currentMode: 'text' | 'function_call' = 'text'

    //  - 
    const prompt = `MBTIMBTI

## 
- ${profile.name}
- ${profile.age}
- ${profile.gender === 'male' ? '' : profile.gender === 'female' ? '' : ''}
- ${profile.occupation}
- ${profile.education}
- ${profile.interests || ''}
- ${profile.socialPreference || ''}
- ${profile.learningStyle || ''}
- ${profile.emotionalExpression || ''}
${clarifications ? `- \n${clarifications}` : ''}

## 
- MBTI${mbtiResult.type}
- 
  - (E) vs (I)${mbtiResult.scores.EI.percentFirst}% vs ${mbtiResult.scores.EI.percentSecond}%
  - (S) vs (N)${mbtiResult.scores.SN.percentFirst}% vs ${mbtiResult.scores.SN.percentSecond}%
  - (T) vs (F)${mbtiResult.scores.TF.percentFirst}% vs ${mbtiResult.scores.TF.percentSecond}%
  - (J) vs (P)${mbtiResult.scores.JP.percentFirst}% vs ${mbtiResult.scores.JP.percentSecond}%

## 
1. ****
2. ****MBTI
3. ****
4. ****
5. ****

## 
JSON

{
  "analysis": {
    "summary": "${profile.age}${profile.occupation}60-80",
    "strengths": [
      "20-30", 
      "20-30", 
      "20-30"
    ],
    "challenges": [
      "25-35", 
      "25-35"
    ],
    "recommendations": [
      "20-30", 
      "20-30", 
      "20-30"
    ],
    "careerGuidance": "${profile.occupation}35-45",
    "personalGrowth": "MBTI30-40", 
    "relationships": "25-35"
  }
}

 JSON

`

    //  SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'start',
            message: '...'
          })}\n\n`))

          const aiConfig = resolveAIConfig()
          assertAIConfig(aiConfig)

          let funcArgsBuf = ''

          const streamIterator = streamAIText(aiConfig, {
            messages: [
              { role: 'system', content: 'You are a professional MBTI analyst. Output only valid JSON format with complete analysis structure.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
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

          //  
          if (funcArgsBuf) {
            try {
              const cleaned = heuristicsClean(funcArgsBuf)
              console.log('function_call.arguments:', cleaned.length)
              
              const parsedArgs = JSON.parse(cleaned) as { analysis?: AIAnalysis } | AIAnalysis
              
              await finalParseAndValidate(
                JSON.stringify(parsedArgs.analysis || parsedArgs),
                controller,
                encoder
              )
              
            } catch (err) {
              console.error('JSON:', err)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                message: 'AI',
                suggestion: 'retry'
              })}\n\n`))
            }
          } else if (textBuffer) {
            await finalParseAndValidate(textBuffer, controller, encoder)
          }

        } catch (error) {
          console.error(':', error)
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : '',
            retry: true
          })}\n\n`))
        } finally {
          controller.close()
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
        const jsonMatch = buffer.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return

        const potentialJson = jsonMatch[0]
        const parsed = JSON.parse(potentialJson) as { analysis?: AIAnalysis }
        
        if (parsed.analysis && typeof parsed.analysis === 'object') {
          //  
          const analysis = parsed.analysis
          const requiredFields = ['summary', 'strengths', 'challenges', 'recommendations', 'careerGuidance', 'personalGrowth', 'relationships']
          const hasAllFields = requiredFields.every(field => (analysis as Record<string, unknown>)[field])

          if (hasAllFields) {
            //  
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              message: '...',
              preview: {
                summary: analysis.summary,
                strengthsCount: Array.isArray(analysis.strengths) ? analysis.strengths.length : 0
              }
            })}\n\n`))
          }
        }
      } catch (error) {
        console.warn(':', error)
      }
    }

    //  
    async function finalParseAndValidate(
      buffer: string,
      controller: ReadableStreamDefaultController<Uint8Array>,
      encoder: TextEncoder
    ) {
      try {
        console.log(' ...')
        
        let analysis: AIAnalysis | null = null
        
        // 1: JSON
        try {
          const directParsed = JSON.parse(buffer) as { analysis?: AIAnalysis; summary?: string }
          if (directParsed.analysis) {
            analysis = directParsed.analysis
          } else if (directParsed.summary) {
            analysis = directParsed as AIAnalysis
          }
        } catch (error) {
          console.warn('JSON:', error)
        }

        // 2: JSON
        if (!analysis) {
          const jsonMatch = buffer.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]) as { analysis?: AIAnalysis; summary?: string }
              if (parsed.analysis) {
                analysis = parsed.analysis
              } else if (parsed.summary) {
                analysis = parsed as AIAnalysis
              }
            } catch (error) {
              console.warn('JSON:', error)
            }
          }
        }

        //  
        if (analysis && validateAnalysisStructure(analysis)) {
          //  
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'success',
            message: '',
            analysis: analysis,
            metadata: {
              generation_method: 'robust_structured',
              analysis_type: 'comprehensive'
            }
          })}\n\n`))
        } else {
          //  
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'partial_success',
            message: '',
            analysis: analysis || {},
            retry: true
          })}\n\n`))
        }

      } catch (error) {
        console.error(':', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'parse_error',
          error: '',
          retry: true
        })}\n\n`))
      }
    }

    //  
    function validateAnalysisStructure(analysis: AIAnalysis): boolean {
      if (!analysis || typeof analysis !== 'object') return false
      
      const requiredFields = [
        'summary',
        'strengths', 
        'challenges',
        'recommendations',
        'careerGuidance',
        'personalGrowth',
        'relationships'
      ]
      
      // 
      for (const field of requiredFields) {
        if (!analysis[field]) return false
        
        // 
        if (['strengths', 'challenges', 'recommendations'].includes(field)) {
          if (!Array.isArray(analysis[field]) || analysis[field].length === 0) return false
        }
        
        // 
        if (typeof analysis[field] === 'string' && analysis[field].trim().length < 10) return false
      }
      
      return true
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('API:', error)
    return Response.json(
      { error: '', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
