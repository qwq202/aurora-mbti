import { type Dimension, type Letter } from './mbti-types'

export type StructuredQuestion = {
  id: string
  text: string
  dimension: Dimension
  agree: Letter
}

export type StructuredQuestionsMetadata = {
  total_count: number
  dimensions_distribution: Record<Dimension, number>
}

export type StructuredQuestionsPayload = {
  questions: StructuredQuestion[]
  metadata: StructuredQuestionsMetadata
}

export type AIAnalysis = {
  summary: string
  strengths: string[]
  challenges: string[]
  recommendations: string[]
  careerGuidance: string
  personalGrowth: string
  relationships: string
}
