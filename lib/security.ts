import { type Answers, type Dimension, type DimensionScore, type Letter, type MbtiResult, type UserProfile } from './mbti-types'

/**
 *   - 
 * XSSSQL
 */

// HTML
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

// 
export function sanitizeUserInput(input: unknown): string {
  if (typeof input !== 'string') return ''
  
  return input
    // HTML
    .replace(/<[^>]*>/g, '')
    // 
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // 
    .replace(/[\x00-\x1F\x7F]/g, '')
    // 
    .slice(0, 1000)
    .trim()
}

// MBTI
export interface ValidationResult<T = unknown> {
  valid: boolean
  error?: string
  sanitized?: T
}

export function validateQuestionCount(count: unknown): ValidationResult<number> {
  const num = Number(count)
  
  if (!Number.isInteger(num)) {
    return { valid: false, error: '' }
  }
  
  if (num < 10 || num > 120) {
    return { valid: false, error: ' 10-120 ' }
  }
  
  return { valid: true, sanitized: num }
}

export function validateProfile(profile: unknown): ValidationResult<UserProfile> {
  if (!profile || typeof profile !== 'object') {
    return { valid: false, error: '' }
  }
  
  const p = profile as Record<string, unknown>
  
  // 
  const requiredFields = ['name', 'age', 'gender', 'occupation']
  for (const field of requiredFields) {
    if (!p[field]) {
      const fieldNames: Record<string, string> = {
        name: '姓名',
        age: '年龄',
        gender: '性别',
        occupation: '职业'
      }
      return { valid: false, error: `请填写${fieldNames[field]}` }
    }
  }
  
  // 
  const age = Number(p.age)
  if (!Number.isInteger(age) || age < 13 || age > 100) {
    return { valid: false, error: ' 13-100 ' }
  }
  
  // 
  const validGenders = ['male', 'female', 'other', 'preferNotToSay']
  if (!validGenders.includes(p.gender as string)) {
    return { valid: false, error: '' }
  }
  
  // 
  const sanitized: UserProfile = {
    name: sanitizeUserInput(p.name),
    age: age,
    gender: p.gender as UserProfile['gender'],
    occupation: sanitizeUserInput(p.occupation),
    education: sanitizeUserInput(p.education || '') as UserProfile['education'],
    relationship: sanitizeUserInput(p.relationship || '') as UserProfile['relationship'],
    interests: sanitizeUserInput(p.interests || ''),
    workStyle: sanitizeUserInput(p.workStyle || '') as UserProfile['workStyle'],
    stressLevel: sanitizeUserInput(p.stressLevel || '') as UserProfile['stressLevel'],
    socialPreference: sanitizeUserInput(p.socialPreference || '') as UserProfile['socialPreference'],
  }

  if (p.learningStyle) {
    sanitized.learningStyle = sanitizeUserInput(p.learningStyle)
  }
  if (p.emotionalExpression) {
    sanitized.emotionalExpression = sanitizeUserInput(p.emotionalExpression)
  }

  if (p.clarifications && typeof p.clarifications === 'object') {
    const clarifications: Record<string, string> = {}
    for (const [rawKey, rawValue] of Object.entries(p.clarifications as Record<string, unknown>)) {
      const key = sanitizeUserInput(String(rawKey)).slice(0, 64)
      if (!key) continue
      if (typeof rawValue === 'string' && rawValue.trim()) {
        clarifications[key] = sanitizeUserInput(rawValue).slice(0, 400)
      }
    }
    if (Object.keys(clarifications).length > 0) {
      sanitized.clarifications = clarifications
    }
  }
  
  return { valid: true, sanitized }
}

export function validateAnswers(answers: unknown): ValidationResult<Answers> {
  if (!answers || typeof answers !== 'object') {
    return { valid: false, error: '' }
  }
  
  const answerObj = answers as Record<string, unknown>
  const sanitized: Answers = {}
  
  for (const [key, value] of Object.entries(answerObj)) {
    // ID
    if (!/^(?:ai_[a-z0-9]+|q\d+|\d+)$/i.test(key)) {
      return { valid: false, error: `ID: ${key}` }
    }
    
    // 
    const answer = Number(value)
    if (!Number.isInteger(answer) || answer < 1 || answer > 7) {
      return { valid: false, error: `: ${value}` }
    }
    
    sanitized[key] = answer as 1 | 2 | 3 | 4 | 5 | 6 | 7
  }
  
  // 
  if (Object.keys(sanitized).length === 0) {
    return { valid: false, error: '' }
  }
  
  if (Object.keys(sanitized).length > 120) {
    return { valid: false, error: '' }
  }
  
  return { valid: true, sanitized }
}

export function validateMBTIResult(result: unknown): ValidationResult<Pick<MbtiResult, 'type' | 'scores'>> {
  if (!result || typeof result !== 'object') {
    return { valid: false, error: 'MBTI' }
  }

  const r = result as Record<string, unknown>

  // MBTI
  const validTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ]

  const rawType = typeof r.type === 'string' ? r.type.toUpperCase().trim() : ''
  if (!validTypes.includes(rawType)) {
    return { valid: false, error: 'MBTI' }
  }

  if (!r.scores || typeof r.scores !== 'object') {
    return { valid: false, error: '' }
  }

  const rawScores = r.scores as Record<string, unknown>
  const dimensions: Dimension[] = ['EI', 'SN', 'TF', 'JP']
  const letters = new Set<Letter>(['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'])

  const toLetter = (value: unknown, fallback: Letter): Letter => {
    if (typeof value === 'string') {
      const upper = value.toUpperCase()
      if (letters.has(upper as Letter)) {
        return upper as Letter
      }
    }
    return fallback
  }

  const clampPercent = (value: unknown, fallback: number): number => {
    const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback
    return Math.max(0, Math.min(100, num))
  }

  const sanitizedScores = {} as Record<Dimension, DimensionScore>

  for (const dim of dimensions) {
    const dimScore = rawScores[dim]
    if (!dimScore || typeof dimScore !== 'object') {
      return { valid: false, error: `: ${dim}` }
    }

    const score = dimScore as Record<string, unknown>
    const defaultFirst = dim[0] as Letter
    const defaultSecond = dim[1] as Letter
    const first = toLetter(score.first, defaultFirst)
    const second = toLetter(score.second, defaultSecond)
    const percentFirst = clampPercent(score.percentFirst, 50)
    const percentSecond = clampPercent(score.percentSecond, 100 - percentFirst)
    const winnerFallback = percentFirst >= percentSecond ? first : second
    const winner = toLetter(score.winner, winnerFallback)
    const confidence = typeof score.confidence === 'number' && Number.isFinite(score.confidence)
      ? Math.max(0, Math.min(100, score.confidence))
      : 0
    const answered = typeof score.answered === 'number' && Number.isFinite(score.answered)
      ? Math.max(0, Math.round(score.answered))
      : 0
    const net = typeof score.net === 'number' && Number.isFinite(score.net) ? score.net : 0
    const maxAbs = typeof score.maxAbs === 'number' && Number.isFinite(score.maxAbs) ? score.maxAbs : 0

    sanitizedScores[dim] = {
      dimension: dim,
      first,
      second,
      net,
      maxAbs,
      winner,
      percentFirst,
      percentSecond,
      confidence,
      answered,
    }
  }

  return { valid: true, sanitized: { type: rawType, scores: sanitizedScores } }
}


// API
export const RATE_LIMITS = {
  // 
  GENERATE_QUESTIONS: 5,
  GENERATE_ANALYSIS: 3,
  GENERAL_API: 10,
  
  // 
  WINDOW_SIZE: 60,
  
  // IP
  WHITELIST: process.env.NODE_ENV === 'development' ? ['127.0.0.1', '::1'] : []
} as const

// 
export const SECURITY_ERRORS = {
  INVALID_INPUT: '请求参数不合法。',
  RATE_LIMIT: '请求过于频繁，请稍后重试。',
  UNAUTHORIZED: '未授权访问。',
  INVALID_CONTENT: '请求内容类型不受支持。',
  REQUEST_TOO_LARGE: '请求体过大。'
} as const

//  - Next.js
const isDevelopment = process.env.NODE_ENV === 'development'

export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': isDevelopment
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"]
    : ["'self'", "blob:"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:", "blob:"],
  'font-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https:", "wss:", "ws:"],
  'worker-src': ["'self'", "blob:"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'media-src': ["'self'", "data:", "https:"]
} as const
