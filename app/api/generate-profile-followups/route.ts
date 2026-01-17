import { NextRequest, NextResponse } from 'next/server'
import { validateProfile, SECURITY_ERRORS } from '@/lib/security'
import { type UserProfile } from '@/lib/mbti'

type FollowupQuestion = {
  id: string
  question: string
  detail?: string
  required?: boolean
  expected_answer_type?: 'short_text' | 'long_text' | 'multiple_choice'
}

export async function POST(request: NextRequest) {
  try {
    let payload: { profile?: UserProfile } | null = null
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: SECURITY_ERRORS.INVALID_INPUT },
        { status: 400 }
      )
    }

    const profileValidation = validateProfile(payload?.profile)
    if (!profileValidation.valid) {
      return NextResponse.json(
        { success: false, error: profileValidation.error || SECURITY_ERRORS.INVALID_INPUT },
        { status: 400 }
      )
    }

    const profile = profileValidation.sanitized
    if (!profile) {
      return NextResponse.json(
        { success: false, error: SECURITY_ERRORS.INVALID_INPUT },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_URL || !process.env.OPENAI_MODEL) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI',
          fallback: [
            {
              id: 'clarify_experience',
              question: '',
              detail: ''
            }
          ]
        },
        { status: 503 }
      )
    }

    const prompt = buildPrompt(profile)
    console.log(' ', {
      profileSummary: {
        occupation: profile.occupation,
        interests: profile.interests,
        workStyle: profile.workStyle,
        stressLevel: profile.stressLevel,
        socialPreference: profile.socialPreference,
        clarificationsPresent: Boolean(profile.clarifications && Object.keys(profile.clarifications).length)
      }
    })

    const parsed = await generateFollowupQuestionsWithFallback(prompt, profile)

    let sanitizedQuestions = normalizeQuestions(parsed.questions || [])

    if (sanitizedQuestions.length === 0) {
      console.warn(' ')
      sanitizedQuestions = buildDefaultFollowupQuestions(profile)
    }

    console.log(' ', {
      questionCount: sanitizedQuestions.length
    })

    return NextResponse.json({
      success: true,
      questions: sanitizedQuestions,
      metadata: {
        generated_at: new Date().toISOString(),
        question_count: sanitizedQuestions.length
      }
    })
  } catch (error) {
    console.error(':', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '',
        fallback: []
      },
      { status: 500 }
    )
  }
}

function buildPrompt(profile: UserProfile): string {
  const sections: string[] = [
    `
- ${profile.name || ''}
- ${profile.age ?? ''}
- ${profile.gender || ''}
- ${profile.occupation || ''}
- ${profile.education || ''}
- ${profile.relationship || ''}
- ${profile.interests || ''}
- /${profile.workStyle || ''}
- ${profile.stressLevel || ''}
- ${profile.socialPreference || ''}`,
  ]

  const missingFields: string[] = []
  const fieldMap: Record<string, string> = {
    occupation: '/',
    interests: '',
    workStyle: '',
    stressLevel: '',
    socialPreference: '',
    education: '',
    relationship: ''
  }

  Object.entries(fieldMap).forEach(([key, label]) => {
    const value = profile[key as keyof UserProfile]
    if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim().toLowerCase() === '')) {
      missingFields.push(label)
    }
  })

  if (profile.clarifications) {
    sections.push(
      '\n' +
      Object.entries(profile.clarifications)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n')
    )
  }

  if (missingFields.length > 0) {
    sections.push(
      '\n' +
      missingFields.map((field, index) => `${index + 1}. ${field}`).join('\n')
    )
  }

  sections.push(`MBTI


1. 50
2. “${profile.occupation || '/'}”
3. 
4. detail
5.  required=true
6.  expected_answer_type  "multiple_choice" "short_text"  "long_text"
7. id  "clarify_1""clarify_2" `)

  return sections.join('\n\n')
}

function normalizeQuestions(questions: FollowupQuestion[]): FollowupQuestion[] {
  if (!Array.isArray(questions)) return []

  const seen = new Set<string>()
  const result: FollowupQuestion[] = []

  questions.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const id = typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : `clarify_${index + 1}`
    if (seen.has(id)) return
    const question = typeof item.question === 'string' ? item.question.trim() : ''
    if (!question) return

    seen.add(id)
    result.push({
      id,
      question,
      detail: typeof item.detail === 'string' ? item.detail.trim() : undefined,
      required: Boolean(item.required),
      expected_answer_type: ['short_text', 'long_text', 'multiple_choice'].includes(
        item.expected_answer_type || ''
      )
        ? item.expected_answer_type
        : 'short_text'
    })
  })

  return result
}

async function generateFollowupQuestionsWithFallback(
  prompt: string,
  profile: UserProfile
): Promise<{ questions: FollowupQuestion[] }> {
  const messages = [
    {
      role: 'system',
      content: 'You are an onboarding assistant that prepares follow-up questions to enrich a personality profile before generating MBTI questions. Always answer with JSON that matches the provided schema. Ask between 0 and 5 questions.'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  const schemaPayload = {
    model: process.env.OPENAI_MODEL,
    messages,
    temperature: 0.3,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'followup_questions',
        schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              maxItems: 5,
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  question: { type: 'string' },
                  detail: { type: 'string' },
                  required: { type: 'boolean' },
                  expected_answer_type: {
                    type: 'string',
                    enum: ['short_text', 'long_text', 'multiple_choice']
                  }
                },
                required: ['id', 'question'],
                additionalProperties: false
              }
            }
          },
          required: ['questions'],
          additionalProperties: false
        },
        strict: true
      }
    }
  }

  const primary = await invokeOpenAI(schemaPayload, 'json_schema')
  if (primary.success) {
    return primary.data!
  }
  console.warn('  json_schema ', {
    error: primary.errorMessage
  })
  if (!primary.shouldFallback) {
    throw new Error(primary.errorMessage)
  }

  const jsonObjectPayload = {
    model: process.env.OPENAI_MODEL,
    messages,
    temperature: 0.3,
    response_format: { type: 'json_object' }
  }

  const secondary = await invokeOpenAI(jsonObjectPayload, 'json_object')
  if (secondary.success) {
    return secondary.data!
  }
  console.warn('  json_object ', {
    error: secondary.errorMessage
  })

  if (!secondary.shouldFallback) {
    throw new Error(secondary.errorMessage)
  }

  const strictMessages = [
    {
      role: 'system',
      content: 'You are an onboarding assistant for an MBTI app. Output ONLY a JSON object exactly following the format {"questions":[{"id": "...", "question": "...", "detail": "...", "required": false, "expected_answer_type": "short_text"}]} with 0-5 questions.'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  const finalAttempt = await invokeOpenAI({
    model: process.env.OPENAI_MODEL,
    messages: strictMessages,
    temperature: 0.3
  }, 'strict_prompt')

  if (!finalAttempt.success) {
    console.warn(' AI', finalAttempt.errorMessage)
    return { questions: buildDefaultFollowupQuestions(profile) }
  }

  return finalAttempt.data!
}

async function invokeOpenAI(payload: Record<string, unknown>, strategy: 'json_schema' | 'json_object' | 'strict_prompt'): Promise<{
  success: boolean
  data?: { questions: FollowupQuestion[] }
  errorMessage: string
  shouldFallback: boolean
}> {
  console.log(' AI', {
    strategy,
    endpoint: `${process.env.OPENAI_API_URL}/v1/chat/completions`
  })
  const response = await fetch(`${process.env.OPENAI_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  })

  const text = await response.text()

  if (!response.ok) {
    let errorMessage = `OpenAI API: ${response.status} - ${text}`
    let shouldFallback = false
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string; code?: string } }
      const msg = parsed?.error?.message || parsed?.error?.code || ''
      errorMessage = `OpenAI API: ${msg || text}`
      if (typeof msg === 'string' && (msg.toLowerCase().includes('response_format') || msg.toLowerCase().includes('unsupported'))) {
        shouldFallback = true
      }
    } catch (error) {
      console.warn('OpenAI:', error)
    }
    console.warn(' AI', {
      strategy,
      status: response.status,
      errorBody: text.slice(0, 500)
    })
    return {
      success: false,
      errorMessage,
      shouldFallback: shouldFallback || response.status >= 500
    }
  }

  let resultJson: unknown
  try {
    resultJson = JSON.parse(text) as unknown
  } catch (error) {
    return {
      success: false,
      errorMessage: `OpenAI: ${error}`,
      shouldFallback: false
    }
  }

  const responseObj = resultJson as { choices?: Array<{ message?: { content?: string } }> }
  const content = responseObj.choices?.[0]?.message?.content
  if (!content) {
    return {
      success: false,
      errorMessage: 'AI',
      shouldFallback: false
    }
  }

  const parsed = tryParseJsonContent(content)
  if (!parsed) {
    return {
      success: false,
      errorMessage: 'JSON: AI',
      shouldFallback: false
    }
  }

  console.log(' AI', {
    strategy,
    rawLength: content.length,
    questionCount: Array.isArray(parsed.questions) ? parsed.questions.length : 0
  })

  return { success: true, data: parsed, errorMessage: '', shouldFallback: false }
}

function tryParseJsonContent(content: string): { questions: FollowupQuestion[] } | null {
  const attempts: Array<(input: string) => unknown> = [
    (input: string) => JSON.parse(input) as unknown,
    (input: string) => JSON.parse(input.replace(/```json|```/g, '').trim()) as unknown,
    (input: string) => {
      const cleaned = input.replace(/```json|```/g, '').trim()
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      if (start >= 0 && end > start) {
        const slice = cleaned.slice(start, end + 1)
        return JSON.parse(slice) as unknown
      }
      return null
    }
  ]

  for (const attempt of attempts) {
    try {
      const result = attempt(content)
      if (result && typeof result === 'object') {
        return result as { questions: FollowupQuestion[] }
      }
    } catch (error) {
      console.warn('JSON:', error)
    }
  }

  return null
}

function buildDefaultFollowupQuestions(profile: UserProfile): FollowupQuestion[] {
  const occupation = (profile.occupation && String(profile.occupation).trim()) || '/'
  const interests = (profile.interests && String(profile.interests).trim()) || ''

  return [
    {
      id: 'clarify_role',
      question: `${occupation}`,
      detail: '',
      required: false,
      expected_answer_type: 'long_text'
    },
    {
      id: 'clarify_collaboration',
      question: `${occupation}`,
      detail: 'AI',
      required: false,
      expected_answer_type: 'short_text'
    },
    {
      id: 'clarify_growth',
      question: `${occupation}`,
      detail: 'AI',
      required: false,
      expected_answer_type: 'short_text'
    }
  ]
}
