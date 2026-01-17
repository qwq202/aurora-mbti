// 
import { type MbtiResult, type UserProfile } from './mbti-types'
import { RESULT_KEY, ANSWERS_KEY, HISTORY_KEY, COMPARE_KEY } from './constants'

export function getWorkEnvironment(type: string): string {
  const environments: Record<string, string> = {
    INTJ: "",
    INTP: "",
    ENTJ: "",
    ENTP: "",
    INFJ: "",
    INFP: "",
    ENFJ: "",
    ENFP: "",
    ISTJ: "",
    ISFJ: "",
    ESTJ: "",
    ESFJ: "",
    ISTP: "",
    ISFP: "",
    ESTP: "",
    ESFP: ""
  }
  return environments[type] || ""
}

export function getCommunicationStyle(type: string): string {
  const styles: Record<string, string> = {
    INTJ: "",
    INTP: "",
    ENTJ: "",
    ENTP: "",
    INFJ: "",
    INFP: "",
    ENFJ: "",
    ENFP: "",
    ISTJ: "",
    ISFJ: "",
    ESTJ: "",
    ESFJ: "",
    ISTP: "",
    ISFP: "",
    ESTP: "",
    ESFP: ""
  }
  return styles[type] || ""
}

export function getPotentialChallenges(type: string): string {
  const challenges: Record<string, string> = {
    INTJ: "",
    INTP: "",
    ENTJ: "",
    ENTP: "",
    INFJ: "",
    INFP: "",
    ENFJ: "",
    ENFP: "",
    ISTJ: "",
    ISFJ: "",
    ESTJ: "",
    ESFJ: "",
    ISTP: "",
    ISFP: "",
    ESTP: "",
    ESFP: ""
  }
  return challenges[type] || ""
}

export function getPracticalTips(type: string): string {
  const tips: Record<string, string> = {
    INTJ: "",
    INTP: "",
    ENTJ: "",
    ENTP: "",
    INFJ: "",
    INFP: "",
    ENFJ: "",
    ENFP: "",
    ISTJ: "",
    ISFJ: "",
    ESTJ: "",
    ESFJ: "",
    ISTP: "",
    ISFP: "",
    ESTP: "",
    ESFP: ""
  }
  return tips[type] || ""
}

export interface HistoryEntry {
  id: string
  createdAt: number
  testMode?: string
  result: MbtiResult
  profile?: UserProfile | null
}

export { RESULT_KEY, ANSWERS_KEY, HISTORY_KEY, COMPARE_KEY }
