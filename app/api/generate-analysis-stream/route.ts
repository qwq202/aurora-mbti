import { NextRequest, NextResponse } from 'next/server'
import { type Answers, type MbtiResult, type Question, type UserProfile } from '@/lib/mbti'

type OpenAIStreamDelta = { content?: string }
type OpenAIStreamChoice = { delta?: OpenAIStreamDelta }
type OpenAIStreamChunk = { choices?: OpenAIStreamChoice[] }

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
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
              temperature: 0.7,
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
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'done',
                    content: accumulatedContent
                  })}\n\n`))
                  controller.close()
                  return
                }
                
                try {
                  const parsed = JSON.parse(data) as OpenAIStreamChunk
                  const delta = parsed.choices?.[0]?.delta?.content
                  
                  if (delta) {
                    accumulatedContent += delta
                    
                    // 
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
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
