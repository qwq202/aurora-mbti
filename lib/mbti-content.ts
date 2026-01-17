import type { MbtiCelebrities, MbtiTypeGroup, MbtiTypeInfo, Question } from './mbti-types'
import { QUESTIONS as QUESTIONS_ZH } from './mbti-questions'
import { QUESTIONS as QUESTIONS_EN } from './mbti-questions.en'
import {
  TYPE_INFO as TYPE_INFO_ZH,
  TYPE_GROUPS as TYPE_GROUPS_ZH,
  CELEBRITIES as CELEBRITIES_ZH,
  UNKNOWN_TYPE as UNKNOWN_TYPE_ZH,
} from './mbti-type-data.zh'
import {
  TYPE_INFO as TYPE_INFO_EN,
  TYPE_GROUPS as TYPE_GROUPS_EN,
  CELEBRITIES as CELEBRITIES_EN,
  UNKNOWN_TYPE as UNKNOWN_TYPE_EN,
} from './mbti-type-data.en'

export type MbtiContent = {
  questions: Question[]
  typeInfo: Record<string, MbtiTypeInfo>
  typeGroups: MbtiTypeGroup[]
  celebrities: MbtiCelebrities
  unknownType: MbtiTypeInfo
}

export function getMbtiContent(locale?: string): MbtiContent {
  if (locale === 'en') {
    return {
      questions: QUESTIONS_EN,
      typeInfo: TYPE_INFO_EN,
      typeGroups: TYPE_GROUPS_EN,
      celebrities: CELEBRITIES_EN,
      unknownType: UNKNOWN_TYPE_EN,
    }
  }

  return {
    questions: QUESTIONS_ZH,
    typeInfo: TYPE_INFO_ZH,
    typeGroups: TYPE_GROUPS_ZH,
    celebrities: CELEBRITIES_ZH,
    unknownType: UNKNOWN_TYPE_ZH,
  }
}

export function getQuestions(locale?: string): Question[] {
  return getMbtiContent(locale).questions
}

export function getTypeInfoMap(locale?: string): Record<string, MbtiTypeInfo> {
  return getMbtiContent(locale).typeInfo
}

export function typeDisplayInfo(code: string, locale?: string): MbtiTypeInfo {
  const content = getMbtiContent(locale)
  return content.typeInfo[code] || content.unknownType
}

export function getTypeGroups(locale?: string): MbtiTypeGroup[] {
  return getMbtiContent(locale).typeGroups
}

export function getCelebrities(locale?: string): MbtiCelebrities {
  return getMbtiContent(locale).celebrities
}
