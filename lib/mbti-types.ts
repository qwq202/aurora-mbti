export type Dimension = "EI" | "SN" | "TF" | "JP"
export type Letter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P"
export type Likert = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type UserProfile = {
  name: string
  age: number
  gender: "male" | "female" | "other" | ""
  occupation: string
  education: "junior_high" | "high_school" | "college" | "bachelor" | "master" | "phd" | ""
  relationship: "single" | "dating" | "married" | "other" | ""
  interests: string
  workStyle: "individual" | "team" | "mixed" | ""
  stressLevel: "low" | "medium" | "high" | ""
  socialPreference: "quiet" | "social" | "balanced" | ""
  learningStyle?: string
  emotionalExpression?: string
  clarifications?: Record<string, string>
}

export type QuestionContext = "work" | "social" | "personal" | "academic" | "general"
export type AgeGroup = "young" | "adult" | "mature"

export type Question = {
  id: string
  text: string
  dimension: Dimension
  agree: Letter
  contexts?: QuestionContext[]
  ageGroups?: AgeGroup[]
  workRelevant?: boolean
  socialRelevant?: boolean
}

export type AIQuestionInput = {
  text?: string
  dimension?: string
  agree?: string
  contexts?: QuestionContext[]
  ageGroups?: AgeGroup[]
  workRelevant?: boolean
  socialRelevant?: boolean
}

export type Answers = Record<string, Likert>

export type AnswerQuality = {
  straightLining: boolean
  extremeResponse: boolean
  centralTendency: boolean
  randomPattern: boolean
  completionRate: number
  consistencyScore: number
}

export type ConfidenceAssessment = {
  overall: number
  dimensions: Record<Dimension, number>
  qualityFlags: string[]
  recommendations: string[]
}

export type DimensionScore = {
  dimension: Dimension
  first: Letter
  second: Letter
  net: number
  maxAbs: number
  winner: Letter
  percentFirst: number
  percentSecond: number
  confidence: number
  answered: number
}

export type MbtiResult = {
  type: string
  scores: Record<Dimension, DimensionScore>
  quality: AnswerQuality
  confidence: ConfidenceAssessment
}

export type MbtiTypeInfo = {
  name: string
  blurb: string
  vibe: string
  gradient: string
  strengths: string[]
  growth: string[]
}

export type MbtiTypeGroup = {
  title: string
  code: string
  description: string
  types: string[]
}

export type MbtiCelebrities = Record<string, string[]>
