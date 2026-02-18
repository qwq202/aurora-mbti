import { NextRequest } from 'next/server'
import { validateQuestionsAPI } from '@/lib/api-validation'
import { type StructuredQuestion, type StructuredQuestionsPayload } from '@/lib/ai-types'
import { assertAIConfig, completeAIText, resolveAIConfig } from '@/lib/ai-provider'
import { apiError, apiOk } from '@/lib/api-response'

// API - 100%0
export async function POST(request: NextRequest) {
  try {
    const validationResult = await validateQuestionsAPI(request)
    if ('status' in validationResult) {
      return validationResult
    }

    const {
      questionCount,
      profile,
      existingQuestions = [],
      batchIndex = 0
    } = validationResult.data

    const batchNumber = (Number.isInteger(batchIndex) ? batchIndex : 0) + 1
    const sanitizedProfile = profile || {}
    const safeExistingQuestions = Array.isArray(existingQuestions) ? existingQuestions : []
    const clarifications = sanitizedProfile.clarifications && typeof sanitizedProfile.clarifications === 'object'
      ? Object.entries(sanitizedProfile.clarifications as Record<string, string>)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n')
      : ''
    
    console.log(`: ${questionCount} (0) - ${batchNumber}`)
    if (safeExistingQuestions.length > 0) {
      console.log(` : ${safeExistingQuestions.length}`)
    }
    
    console.log(`: ${questionCount} (0)`)
    
    // JSON Schema
    const questionSchema = {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { 
                type: "string"
              },
              text: { 
                type: "string"
              },
              dimension: { 
                type: "string",
                enum: ["EI", "SN", "TF", "JP"]
              },
              agree: { 
                type: "string",
                enum: ["E", "I", "S", "N", "T", "F", "J", "P"]
              }
            },
            required: ["id", "text", "dimension", "agree"],
            additionalProperties: false
          }
        },
        metadata: {
          type: "object",
          properties: {
            total_count: { 
              type: "number"
            },
            dimensions_distribution: {
              type: "object",
              properties: {
                EI: { type: "number" },
                SN: { type: "number" },
                TF: { type: "number" },
                JP: { type: "number" }
              },
              required: ["EI", "SN", "TF", "JP"],
              additionalProperties: false
            }
          },
          required: ["total_count", "dimensions_distribution"],
          additionalProperties: false
        }
      },
      required: ["questions", "metadata"],
      additionalProperties: false
    }

    // 
    const existingQuestionsPrompt = safeExistingQuestions.length > 0 ? `

##   (${batchNumber})
****
${safeExistingQuestions
  .map((q, index) => {
    const question = q as { text?: unknown; dimension?: unknown }
    return `${index + 1}. [${typeof question.dimension === 'string' ? question.dimension : 'EI'}] ${typeof question.text === 'string' ? question.text : ''}`
  })
  .join('\n')}

****
- 
- 
- 
- ` : ''

    //  - 
    const prompt = `MBTI${questionCount}

## 
- ${sanitizedProfile.age ?? ''}
- ${sanitizedProfile.occupation || ''}
- ${sanitizedProfile.interests || ''}
- ${sanitizedProfile.socialPreference || ''}
- ${sanitizedProfile.learningStyle || ''}
- ${sanitizedProfile.emotionalExpression || ''}
${clarifications ? `- \n${clarifications}` : ''}
${existingQuestionsPrompt}

## 
1. ****${questionCount}
2. **ID**"1", "2", "3", ..., "${questionCount}"
3. ****EI/SN/TF/JP
4. **100%**JSON Schema
5. ****
6. ****

## 
JSON Schemaquestionsmetadata
questionid()text()dimension(EI/SN/TF/JP)agree(E/I/S/N/T/F/J/P)

`

    const aiConfig = resolveAIConfig()
    assertAIConfig(aiConfig)

    const content = await completeAIText(aiConfig, {
      messages: [
        { 
          role: 'system', 
          content: 'You are a precision MBTI test generator. You must output valid JSON that exactly matches the provided schema. Never output anything other than the JSON object.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      responseFormat: { 
        type: "json_schema",
        json_schema: {
          name: "mbti_questions",
          schema: questionSchema,
          strict: true
        }
      }
    })

    if (!content) {
      throw new Error('AI')
    }

    // 
    let parsedResult: StructuredQuestionsPayload
    try {
      parsedResult = JSON.parse(content) as StructuredQuestionsPayload
    } catch (parseError) {
      throw new Error(`JSON: ${parseError}`)
    }

    // 
    const validation = validateStructuredOutput(parsedResult, questionCount)
    if (!validation.valid) {
      throw new Error(`: ${validation.errors.join(', ')}`)
    }

    console.log(` : ${parsedResult.questions.length}, 0`)

    // 
    return apiOk({
      questions: parsedResult.questions,
      metadata: {
        ...parsedResult.metadata,
        generation_mode: 'structured',
        error_rate: 0,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error(':', error)
    
    return apiError(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : '',
      500,
      'fallback_available=true'
    )
  }
}

//  - 0
function validateStructuredOutput(data: unknown, expectedCount: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 1. 
  if (!data || typeof data !== 'object') {
    errors.push('')
    return { valid: false, errors }
  }
  const payload = data as StructuredQuestionsPayload

  // 2. questions
  if (!Array.isArray(payload.questions)) {
    errors.push('questions')
  } else {
    // 
    if (payload.questions.length !== expectedCount) {
      errors.push(`: ${expectedCount}, ${payload.questions.length}`)
    }

    // 
    payload.questions.forEach((q: StructuredQuestion, index: number) => {
      const expectedId = String(index + 1)
      
      if (!q.id || q.id !== expectedId) {
        errors.push(`${index + 1} ID: "${expectedId}", "${q.id}"`)
      }
      
      if (!q.text || typeof q.text !== 'string' || q.text.length < 10) {
        errors.push(`${index + 1} `)
      }
      
      if (!['EI', 'SN', 'TF', 'JP'].includes(q.dimension)) {
        errors.push(`${index + 1} : "${q.dimension}"`)
      }
      
      if (!['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'].includes(q.agree)) {
        errors.push(`${index + 1} : "${q.agree}"`)
      }
    })
  }

  // 3. metadata
  if (!payload.metadata) {
    errors.push('metadata')
  } else {
    if (payload.metadata.total_count !== expectedCount) {
      errors.push(`metadatatotal_count`)
    }
  }

  return { valid: errors.length === 0, errors }
}
