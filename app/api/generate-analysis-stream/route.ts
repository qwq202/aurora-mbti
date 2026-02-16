import { NextRequest, NextResponse } from 'next/server'
import { type Answers, type MbtiResult, type Question, type UserProfile } from '@/lib/mbti'
import { assertAIConfig, resolveAIConfig, streamAIText } from '@/lib/ai-provider'

// AIAPI - token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      profile: UserProfile
      answers: Answers
      questions: Question[]
      mbtiResult: MbtiResult
    }
    const { profile, answers, questions, mbtiResult } = body
    
    console.log(`AI: ${mbtiResult.type}`)
    
    // AI
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
6. ****300

## 
JSON

{
  "analysis": {
    "summary": "${profile.age}${profile.occupation}70",
    "strengths": [
      "25", 
      "25", 
      "25"
    ],
    "challenges": [
      "30", 
      "30"
    ],
    "recommendations": [
      "25", 
      "25", 
      "25"
    ],
    "careerGuidance": "${profile.occupation}40",
    "personalGrowth": "MBTI35", 
    "relationships": "30"
  }
}

 

`

    // SSE
    const encoder = new TextEncoder()
    
    const aiConfig = resolveAIConfig()
    assertAIConfig(aiConfig)

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let accumulatedContent = ''

          const iterator = streamAIText(aiConfig, {
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            timeoutMs: 60000
          })

          for await (const chunk of iterator) {
            if (!chunk.text) continue
            accumulatedContent += chunk.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'delta',
              delta: chunk.text,
              content: accumulatedContent
            })}\n\n`))
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            content: accumulatedContent
          })}\n\n`))
          controller.close()
          
        } catch (error) {
          console.error(':', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : ''
          })}\n\n`))
          controller.close()
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
