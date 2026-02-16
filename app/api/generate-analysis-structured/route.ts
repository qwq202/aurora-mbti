import { NextRequest, NextResponse } from 'next/server'
import { validateAnalysisAPI } from '@/lib/api-validation'
import { type Dimension, type DimensionScore } from '@/lib/mbti'
import { assertAIConfig, completeAIText, resolveAIConfig } from '@/lib/ai-provider'

type StructuredAnalysis = {
  personality_type: string
  confidence_score: number
  dimensions: {
    extroversion: number
    sensing: number
    thinking: number
    judging: number
  }
  detailed_analysis: {
    core_traits: string[]
    strengths: string[]
    areas_for_growth: string[]
    career_suggestions: string[]
    relationship_style: string
    stress_management: string
    communication_preferences: string
  }
  dimension_explanations: {
    EI: string
    SN: string
    TF: string
    JP: string
  }
  personalized_insights: Array<{
    category: string
    insight: string
    actionable_tip: string
  }>
}

// API - 100%0
export async function POST(request: NextRequest) {
  try {
    const validationResult = await validateAnalysisAPI(request)
    if ('status' in validationResult) {
      return validationResult
    }

    const { profile, answers, mbtiResult } = validationResult.data
    const personalityType = mbtiResult.type
    const dimensionScores = normalizeScoresFromResult(mbtiResult.scores)
    const dimensionSummary = buildDimensionSummary(mbtiResult.scores)
    const clarifications = profile?.clarifications && typeof profile.clarifications === 'object'
      ? Object.entries(profile.clarifications as Record<string, string>)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n')
      : ''
    
    console.log(` (0)`)
    
    // JSON Schema
    const analysisSchema = {
      type: "object",
      properties: {
        personality_type: {
          type: "string",
          pattern: "^[EISNTFJP]{4}$", // 4MBTI
          enum: [
            "INTJ", "INTP", "ENTJ", "ENTP",
            "INFJ", "INFP", "ENFJ", "ENFP", 
            "ISTJ", "ISFJ", "ESTJ", "ESFJ",
            "ISTP", "ISFP", "ESTP", "ESFP"
          ]
        },
        confidence_score: {
          type: "number",
          minimum: 0,
          maximum: 1
        },
        dimensions: {
          type: "object",
          properties: {
            extroversion: { type: "number", minimum: 0, maximum: 1 },
            sensing: { type: "number", minimum: 0, maximum: 1 },
            thinking: { type: "number", minimum: 0, maximum: 1 },
            judging: { type: "number", minimum: 0, maximum: 1 }
          },
          required: ["extroversion", "sensing", "thinking", "judging"]
        },
        detailed_analysis: {
          type: "object",
          properties: {
            core_traits: {
              type: "array",
              minItems: 3,
              maxItems: 7,
              items: { type: "string", minLength: 10, maxLength: 100 }
            },
            strengths: {
              type: "array", 
              minItems: 3,
              maxItems: 6,
              items: { type: "string", minLength: 10, maxLength: 100 }
            },
            areas_for_growth: {
              type: "array",
              minItems: 2, 
              maxItems: 5,
              items: { type: "string", minLength: 10, maxLength: 100 }
            },
            career_suggestions: {
              type: "array",
              minItems: 3,
              maxItems: 8,
              items: { type: "string", minLength: 5, maxLength: 50 }
            },
            relationship_style: {
              type: "string",
              minLength: 50,
              maxLength: 300
            },
            stress_management: {
              type: "string", 
              minLength: 50,
              maxLength: 300
            },
            communication_preferences: {
              type: "string",
              minLength: 50,
              maxLength: 300
            }
          },
          required: [
            "core_traits", "strengths", "areas_for_growth", 
            "career_suggestions", "relationship_style", 
            "stress_management", "communication_preferences"
          ]
        },
        dimension_explanations: {
          type: "object",
          properties: {
            EI: { type: "string", minLength: 30, maxLength: 200 },
            SN: { type: "string", minLength: 30, maxLength: 200 },
            TF: { type: "string", minLength: 30, maxLength: 200 },
            JP: { type: "string", minLength: 30, maxLength: 200 }
          },
          required: ["EI", "SN", "TF", "JP"]
        },
        personalized_insights: {
          type: "array",
          minItems: 2,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              category: { 
                type: "string",
                enum: ["", "", "", "", ""]
              },
              insight: { type: "string", minLength: 30, maxLength: 200 },
              actionable_tip: { type: "string", minLength: 20, maxLength: 150 }
            },
            required: ["category", "insight", "actionable_tip"]
          }
        }
      },
      required: [
        "personality_type", "confidence_score", "dimensions", 
        "detailed_analysis", "dimension_explanations", "personalized_insights"
      ],
      additionalProperties: false
    }

    // 
    const prompt = `MBTI

## 
- ${profile.age ?? ''}  
- ${profile.occupation || ''}
- ${profile.interests || ''}
- ${profile.socialPreference || ''}
- ${profile.learningStyle || ''}
- ${profile.emotionalExpression || ''}
${clarifications ? `- \n${clarifications}` : ''}

## 
- ${personalityType}
- 
${dimensionSummary}

## 
1. ****
2. ****
3. ****
4. ****
5. ****
6. ****JSON Schema

## 
- personality_type4MBTI
- confidence_score(0.5)
- 
- insight
- 

`

    const aiConfig = resolveAIConfig()
    assertAIConfig(aiConfig)

    const content = await completeAIText(aiConfig, {
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional MBTI analyst. You must output valid JSON that exactly matches the provided schema. Never output anything other than the JSON object. Base your analysis strictly on the provided test data and user profile.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      responseFormat: { 
        type: "json_schema",
        json_schema: {
          name: "mbti_analysis",
          schema: analysisSchema,
          strict: true
        }
      }
    })

    if (!content) {
      throw new Error('AI')
    }

    // 
    let parsedResult: StructuredAnalysis
    try {
      parsedResult = JSON.parse(content) as StructuredAnalysis
    } catch (parseError) {
      throw new Error(`JSON: ${parseError}`)
    }

    // 
    const validation = validateAnalysisOutput(parsedResult, personalityType, dimensionScores)
    if (!validation.valid) {
      throw new Error(`: ${validation.errors.join(', ')}`)
    }

    console.log(` : ${parsedResult.personality_type}, ${parsedResult.confidence_score}`)

    // 
    return NextResponse.json({
      success: true,
      analysis: parsedResult,
      metadata: {
        generated_at: new Date().toISOString(),
        generation_mode: 'structured',
        error_rate: 0,
        original_scores: dimensionScores,
        total_answers: Object.keys(answers).length
      }
    })

  } catch (error) {
    console.error(':', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '',
      fallback_available: true
    }, { status: 500 })
  }
}

// 
function validateAnalysisOutput(
  data: unknown,
  expectedType: string, 
  originalScores: { E: number; S: number; T: number; J: number }
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 1. 
  if (!data || typeof data !== 'object') {
    errors.push('')
    return { valid: false, errors }
  }
  const analysis = data as StructuredAnalysis

  // 2. 
  if (analysis.personality_type !== expectedType) {
    errors.push(`: ${expectedType}, ${analysis.personality_type}`)
  }

  // 3. 
  if (analysis.dimensions) {
    const tolerance = 0.1 // 10%
    if (Math.abs(analysis.dimensions.extroversion - originalScores.E) > tolerance) {
      errors.push(``)
    }
    if (Math.abs(analysis.dimensions.sensing - originalScores.S) > tolerance) {
      errors.push(``)
    }
    if (Math.abs(analysis.dimensions.thinking - originalScores.T) > tolerance) {
      errors.push(``)
    }
    if (Math.abs(analysis.dimensions.judging - originalScores.J) > tolerance) {
      errors.push(``)
    }
  }

  // 4. 
  const requiredFields = [
    'personality_type', 'confidence_score', 'dimensions',
    'detailed_analysis', 'dimension_explanations', 'personalized_insights'
  ]
  
  requiredFields.forEach(field => {
    if (!(analysis as Record<string, unknown>)[field]) {
      errors.push(`: ${field}`)
    }
  })

  // 5. 
  if (analysis.detailed_analysis) {
    if (!Array.isArray(analysis.detailed_analysis.core_traits) || 
        analysis.detailed_analysis.core_traits.length < 3) {
      errors.push('')
    }
    if (!Array.isArray(analysis.detailed_analysis.strengths) || 
        analysis.detailed_analysis.strengths.length < 3) {
      errors.push('')
    }
  }

  return { valid: errors.length === 0, errors }
}

function normalizeScoresFromResult(rawScores: Record<Dimension, DimensionScore>): { E: number; S: number; T: number; J: number } {
  const clampRatio = (value: number) => Math.max(0, Math.min(1, value))

  const percent = (dimension: Dimension) => {
    const score = rawScores?.[dimension] ?? {}
    const percentFirst = typeof score.percentFirst === 'number' ? score.percentFirst : 50
    return clampRatio(percentFirst / 100)
  }

  return {
    E: percent('EI'),
    S: percent('SN'),
    T: percent('TF'),
    J: percent('JP')
  }
}

function buildDimensionSummary(rawScores: Record<Dimension, DimensionScore>): string {
  const dims: Array<{ key: Dimension; label: string }> = [
    { key: 'EI', label: '(E) vs (I)' },
    { key: 'SN', label: '(S) vs (N)' },
    { key: 'TF', label: '(T) vs (F)' },
    { key: 'JP', label: '(J) vs (P)' }
  ]

  return dims.map(({ key, label }) => {
    const score = rawScores?.[key] ?? {}
    const first = typeof score.percentFirst === 'number' ? score.percentFirst.toFixed(1) : '50.0'
    const second = typeof score.percentSecond === 'number' ? score.percentSecond.toFixed(1) : '50.0'
    return `  - ${label}${first}% vs ${second}%`
  }).join('\n')
}
