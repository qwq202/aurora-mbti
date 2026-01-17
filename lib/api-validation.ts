import { NextRequest, NextResponse } from 'next/server'
import { validateQuestionCount, validateProfile, validateAnswers, validateMBTIResult, SECURITY_ERRORS } from '@/lib/security'
import { type Answers, type MbtiResult, type Question, type UserProfile } from '@/lib/mbti'

/**
 *  API
 */

export interface ValidationConfig {
  maxBodySize?: number
  requiredFields?: string[]
  customValidation?: (data: unknown) => { valid: boolean; error?: string }
}

// 
export type ValidationResult<T = unknown> = 
  | NextResponse<{ error: string; details?: string }>  // 
  | { valid: true; data: T }                           // 

export function createValidationMiddleware(config: ValidationConfig = {}) {
  return async function validateRequest<T = unknown>(
    request: NextRequest,
    validator: (data: Record<string, unknown>) => { valid: boolean; error?: string; sanitized?: T }
  ): Promise<ValidationResult<T>> {
    try {
      // 1. Content-Type
      const contentType = request.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        return NextResponse.json(
          { error: SECURITY_ERRORS.INVALID_INPUT, details: 'Content-Typeapplication/json' },
          { status: 400 }
        )
      }

      // 2. 
      const maxSize = config.maxBodySize || 1024 * 1024 // 1MB
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > maxSize) {
        return NextResponse.json(
          { error: SECURITY_ERRORS.REQUEST_TOO_LARGE },
          { status: 413 }
        )
      }

      // 3. JSON
      let requestData: unknown
      try {
        requestData = await request.json()
      } catch (error) {
        return NextResponse.json(
          { error: SECURITY_ERRORS.INVALID_INPUT, details: 'JSON' },
          { status: 400 }
        )
      }

      if (typeof requestData !== 'object' || requestData === null) {
        return NextResponse.json(
          { error: SECURITY_ERRORS.INVALID_INPUT, details: 'JSON' },
          { status: 400 }
        )
      }

      const requestRecord = requestData as Record<string, unknown>

      // 4. 
      if (config.requiredFields) {
        for (const field of config.requiredFields) {
          if (!(field in requestRecord)) {
            return NextResponse.json(
              { error: SECURITY_ERRORS.INVALID_INPUT, details: `: ${field}` },
              { status: 400 }
            )
          }
        }
      }

      // 5. 
      if (config.customValidation) {
        const customResult = config.customValidation(requestRecord)
        if (!customResult.valid) {
          return NextResponse.json(
            { error: SECURITY_ERRORS.INVALID_INPUT, details: customResult.error },
            { status: 400 }
          )
        }
      }

      // 6. 
      const validationResult = validator(requestRecord)
      if (!validationResult.valid) {
        return NextResponse.json(
          { error: SECURITY_ERRORS.INVALID_INPUT, details: validationResult.error },
          { status: 400 }
        )
      }

      // 
      const sanitized = validationResult.sanitized !== undefined ? validationResult.sanitized : (requestRecord as unknown as T)
      return { valid: true, data: sanitized } as { valid: true; data: T }

    } catch (error) {
      console.error(':', error)
      return NextResponse.json(
        { error: '' },
        { status: 500 }
      )
    }
  }
}

// 
export const validateQuestionsRequest = createValidationMiddleware({
  maxBodySize: 512 * 1024, // 512KB
  requiredFields: ['questionCount']
})

export const validateAnalysisRequest = createValidationMiddleware({
  maxBodySize: 1024 * 1024, // 1MB  
  requiredFields: ['profile', 'answers', 'mbtiResult']
})

// 
type MbtiResultLite = Pick<MbtiResult, 'type' | 'scores'>

export interface QuestionsAPIData {
  questionCount: number
  profile: Partial<UserProfile>
  existingQuestions: Array<Record<string, unknown>>
  batchIndex: number
}


//   
export interface AnalysisAPIData {
  profile: UserProfile
  answers: Answers
  questions: Array<Record<string, unknown>>
  mbtiResult: MbtiResultLite
}

// 
export async function validateQuestionsAPI(request: NextRequest): Promise<ValidationResult<QuestionsAPIData>> {
  return validateQuestionsRequest(request, (data) => {
    const profile = data.profile
    const existingQuestions = Array.isArray(data.existingQuestions) ? data.existingQuestions : []
    const batchIndex = Number(data.batchIndex) || 0

    // questionCount
    const countResult = validateQuestionCount(data.questionCount)
    if (!countResult.valid) {
      return { valid: false, error: countResult.error }
    }

    let sanitizedProfile: Partial<UserProfile> = {}

    // profile
    if (profile) {
      const profileResult = validateProfile(profile)
      if (!profileResult.valid) {
        return { valid: false, error: profileResult.error }
      }
      sanitizedProfile = profileResult.sanitized || {}
    }

    return {
      valid: true,
      sanitized: {
        questionCount: countResult.sanitized ?? 0,
        profile: sanitizedProfile,
        existingQuestions,
        batchIndex
      }
    }
  })
}

// 
// 
export async function validateAnalysisAPI(request: NextRequest): Promise<ValidationResult<AnalysisAPIData>> {
  return validateAnalysisRequest(request, (data) => {
    // profile
    const profileResult = validateProfile(data.profile)
    if (!profileResult.valid || !profileResult.sanitized) {
      return { valid: false, error: profileResult.error }
    }

    // answers
    const answersResult = validateAnswers(data.answers)
    if (!answersResult.valid || !answersResult.sanitized) {
      return { valid: false, error: answersResult.error }
    }

    // mbtiResult
    const resultValidation = validateMBTIResult(data.mbtiResult)
    if (!resultValidation.valid || !resultValidation.sanitized) {
      return { valid: false, error: resultValidation.error }
    }

    return {
      valid: true,
      sanitized: {
        profile: profileResult.sanitized,
        answers: answersResult.sanitized,
        questions: Array.isArray(data.questions) ? (data.questions as Array<Record<string, unknown>>) : [],
        mbtiResult: resultValidation.sanitized
      }
    }
  })
}
