import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { apiError, apiOk } from '@/lib/api-response'
import { assertAIConfig, completeAIText, resolveAIConfig } from '@/lib/ai-provider'

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'ADMIN_USERNAME and ADMIN_PASSWORD are not configured on server.', 503)
  }

  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  let payload: { customPrompt?: string; questionCount?: number } | null = null
  try {
    payload = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON payload.', 400)
  }

  const customPrompt = payload?.customPrompt?.trim() || ''
  const questionCount = Math.min(Math.max(payload?.questionCount || 5, 1), 10)

  const config = resolveAIConfig()
  try {
    assertAIConfig(config)
  } catch (error) {
    return apiError('BAD_REQUEST', error instanceof Error ? error.message : 'Invalid AI config', 400)
  }

  const systemPrompt = `You are an expert MBTI test designer. Generate ${questionCount} insightful personality questions.

${customPrompt ? `Custom instructions: ${customPrompt}\n\n` : ''}Each question should force a choice between two opposing tendencies. Questions should be clear, specific, and avoid obvious answers.

Return exactly ${questionCount} questions in this JSON format:
{
  "questions": [
    {
      "id": "preview-1",
      "text": "The question text here",
      "dimension": "EI|SN|TF|JP",
      "agree": "E|I|S|N|T|F|J|P"
    }
  ]
}

Distribute questions evenly across the 4 dimensions (EI, SN, TF, JP).`

  try {
    const response = await completeAIText(config, {
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat: { type: 'json_object' },
    })

    let questions: Array<{ id: string; text: string; dimension: string; agree: string }> = []
    try {
      const parsed = JSON.parse(response)
      if (Array.isArray(parsed.questions)) {
        questions = parsed.questions.slice(0, questionCount)
      }
    } catch {
      // 如果解析失败，尝试提取数组
      const match = response.match(/"questions"\s*:\s*\[([\s\S]*?)\]/)
      if (match) {
        try {
          questions = JSON.parse(`[${match[1]}]`)
        } catch {
          // 忽略解析错误
        }
      }
    }

    return apiOk({
      success: true,
      questions: questions.map((q, i) => ({
        id: q.id || `preview-${i + 1}`,
        text: q.text || '',
        dimension: q.dimension || 'EI',
        agree: q.agree || 'E',
      })),
      raw: response.slice(0, 500),
    })
  } catch (error) {
    console.error('Preview prompt error:', error)
    return apiError('UPSTREAM_ERROR', error instanceof Error ? error.message : 'AI generation failed', 500)
  }
}