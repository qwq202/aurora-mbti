import { type AIQuestionInput, type Answers, type AnswerQuality, type ConfidenceAssessment, type Dimension, type DimensionScore, type Letter, type MbtiResult, type Question, type UserProfile, type AgeGroup, type QuestionContext } from './mbti-types'
import { QUESTIONS } from './mbti-questions'

const FIRST_LETTER: Record<Dimension, Letter> = {
  EI: "E",
  SN: "S",
  TF: "T",
  JP: "J",
}
const SECOND_LETTER: Record<Dimension, Letter> = {
  EI: "I",
  SN: "N",
  TF: "F",
  JP: "P",
}

// 
export function detectAnswerQuality(answers: Answers, questionsToUse?: Question[]): AnswerQuality {
  const questionsArray = questionsToUse || QUESTIONS
  const totalQuestions = questionsArray.length
  const answeredValues = Object.values(answers).filter(v => v !== undefined)
  const answeredCount = answeredValues.length
  
  // 
  const completionRate = answeredCount / totalQuestions
  
  //  (17)
  const extremeCount = answeredValues.filter(v => v === 1 || v === 7).length
  const extremeResponse = extremeCount / answeredCount > 0.8 && answeredCount > 10
  
  //  (4)
  const neutralCount = answeredValues.filter(v => v === 4).length
  const centralTendency = neutralCount / answeredCount > 0.6 && answeredCount > 10
  
  //  ()
  const valueCounts = [1, 2, 3, 4, 5, 6, 7].map(v => answeredValues.filter(a => a === v).length)
  const maxCount = Math.max(...valueCounts)
  const straightLining = maxCount / answeredCount > 0.7 && answeredCount > 15
  
  //  ()
  const mean = answeredValues.reduce((sum, v) => sum + v, 0) / answeredValues.length
  const variance = answeredValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / answeredValues.length
  const randomPattern = variance < 0.8 && answeredCount > 20
  
  // 
  let consistencyScore = 1.0
  if (answeredCount > 15) {
    const dimensionConsistency = calculateDimensionConsistency(answers, questionsArray)
    consistencyScore = Math.max(0.3, Math.min(1.0, dimensionConsistency))
  }
  
  return {
    straightLining,
    extremeResponse,
    centralTendency,
    randomPattern,
    completionRate,
    consistencyScore
  }
}

// 
function calculateDimensionConsistency(answers: Answers, questions: Question[]): number {
  const dimensionScores: Record<Dimension, number[]> = { EI: [], SN: [], TF: [], JP: [] }
  
  // 
  questions.forEach(q => {
    const answer = answers[q.id]
    if (answer) {
      // 
      const first = FIRST_LETTER[q.dimension]
      const normalizedScore = q.agree === first ? answer : (8 - answer)
      dimensionScores[q.dimension].push(normalizedScore)
    }
  })
  
  // 
  let totalConsistency = 0
  let validDimensions = 0
  
  Object.values(dimensionScores).forEach(scores => {
    if (scores.length >= 3) {
      const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
      //  = 1 - (/)0-1
      const consistency = 1 - Math.min(variance / 9, 1)
      totalConsistency += consistency
      validDimensions++
    }
  })
  
  return validDimensions > 0 ? totalConsistency / validDimensions : 0.5
}

// 
export function assessConfidence(quality: AnswerQuality, scores: Record<Dimension, DimensionScore>): ConfidenceAssessment {
  const qualityFlags: string[] = []
  const recommendations: string[] = []
  
  // 
  let baseConfidence = 100
  
  // 
  if (quality.completionRate < 0.5) {
    baseConfidence -= 40
    qualityFlags.push('')
    recommendations.push('')
  } else if (quality.completionRate < 0.8) {
    baseConfidence -= 15
  }
  
  // 
  if (quality.straightLining) {
    baseConfidence -= 30
    qualityFlags.push('')
    recommendations.push('')
  }
  
  if (quality.extremeResponse) {
    baseConfidence -= 20
    qualityFlags.push('')
    recommendations.push('')
  }
  
  if (quality.centralTendency) {
    baseConfidence -= 25
    qualityFlags.push('')
    recommendations.push('')
  }
  
  if (quality.randomPattern) {
    baseConfidence -= 35
    qualityFlags.push('')
    recommendations.push('')
  }
  
  // 
  if (quality.consistencyScore < 0.6) {
    baseConfidence -= 20
    qualityFlags.push('')
    recommendations.push('')
  }
  
  const overall = Math.max(20, Math.min(100, baseConfidence))
  
  // 
  const dimensions: Record<Dimension, number> = {} as Record<Dimension, number>
  ;(["EI", "SN", "TF", "JP"] as Dimension[]).forEach(d => {
    const score = scores[d]
    let dimConfidence = overall
    
    // 
    if (score.answered < 5) {
      dimConfidence -= 25
    } else if (score.answered < 10) {
      dimConfidence -= 10
    }
    
    //  (50%)
    const strength = Math.abs(score.percentFirst - 50)
    if (strength < 10) {
      dimConfidence -= 15
    } else if (strength < 20) {
      dimConfidence -= 8
    }
    
    dimensions[d] = Math.max(20, Math.min(100, dimConfidence))
  })
  
  // 
  if (overall >= 80) {
    recommendations.push('')
  } else if (overall >= 60) {
    recommendations.push('')
  }
  
  return {
    overall,
    dimensions,
    qualityFlags,
    recommendations
  }
}

// 
export function calculatePersonalizedWeight(question: Question, profile?: UserProfile | null): number {
  if (!profile) return 1.0
  
  let weight = 1.0
  
  // 
  const age = profile.age
  if (age && question.ageGroups) {
    let ageGroup: AgeGroup
    if (age <= 25) ageGroup = "young"
    else if (age <= 40) ageGroup = "adult"
    else ageGroup = "mature"
    
    if (question.ageGroups.includes(ageGroup)) {
      weight *= 1.2 // 
    } else {
      weight *= 0.8 // 
    }
  }
  
  // 
  if (profile.occupation && question.workRelevant) {
    const occupation = profile.occupation.toLowerCase()
    if (occupation.includes("")) {
      weight *= question.contexts?.includes("academic") ? 1.3 : 0.9
    } else if (occupation.includes("") || occupation.includes("") || occupation.includes("")) {
      weight *= question.contexts?.includes("work") ? 1.2 : 0.95
    } else if (occupation.includes("") || occupation.includes("")) {
      weight *= (question.dimension === "EI" && question.agree === "E") ? 1.1 : 1.0
    }
  }
  
  // 
  if (profile.socialPreference && question.socialRelevant) {
    if (profile.socialPreference === "quiet" && question.dimension === "EI") {
      weight *= question.agree === "I" ? 1.2 : 0.9
    } else if (profile.socialPreference === "social" && question.dimension === "EI") {
      weight *= question.agree === "E" ? 1.2 : 0.9
    }
  }
  
  // 
  if (profile.workStyle && question.workRelevant) {
    if (profile.workStyle === "individual" && question.dimension === "EI") {
      weight *= question.agree === "I" ? 1.15 : 0.95
    } else if (profile.workStyle === "team" && question.dimension === "EI") {
      weight *= question.agree === "E" ? 1.15 : 0.95
    }
  }
  
  // 
  if (profile.stressLevel) {
    if (profile.stressLevel === "high" && question.dimension === "JP") {
      weight *= question.agree === "J" ? 1.1 : 0.95 // 
    } else if (profile.stressLevel === "low" && question.dimension === "JP") {
      weight *= question.agree === "P" ? 1.05 : 1.0 // 
    }
  }
  
  // 
  if (profile.interests) {
    const interests = profile.interests.toLowerCase()
    
    // 
    if (interests.includes("") || interests.includes("") || interests.includes("") || 
        interests.includes("") || interests.includes("github")) {
      if (question.dimension === "TF") {
        weight *= question.agree === "T" ? 1.1 : 0.95 // 
      }
      if (question.dimension === "SN") {
        weight *= question.agree === "N" ? 1.1 : 0.95 // 
      }
    }
    
    // 
    if (interests.includes("") || interests.includes("") || interests.includes("") || 
        interests.includes("") || interests.includes("")) {
      if (question.dimension === "TF") {
        weight *= question.agree === "F" ? 1.1 : 0.95 // 
      }
      if (question.dimension === "SN") {
        weight *= question.agree === "N" ? 1.15 : 0.9 // 
      }
    }
    
    // 
    if (interests.includes("") || interests.includes("") || interests.includes("")) {
      if (question.dimension === "EI") {
        weight *= question.agree === "I" ? 1.2 : 0.8 // 
      }
    }
    
    // 
    if (interests.includes("") || interests.includes("") || interests.includes("")) {
      if (question.dimension === "EI") {
        weight *= question.agree === "E" ? 1.2 : 0.8 // 
      }
    }
  }
  
  // 
  return Math.max(0.3, Math.min(2.0, weight))
}

// AI
export function inferQuestionMetadata(question: Question): Question {
  const text = question.text.toLowerCase()
  const inferredData: Partial<Question> = { ...question }
  
  //  (contexts)
  const contexts: QuestionContext[] = []
  if (text.includes('') || text.includes('') || text.includes('') || text.includes('') || 
      text.includes('') || text.includes('')) {
    contexts.push('work', 'academic')
  }
  if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
    contexts.push('social')
  }
  if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
    contexts.push('personal')
  }
  if (contexts.length === 0) contexts.push('general')
  inferredData.contexts = contexts
  
  //  (ageGroups) 
  const ageGroups: AgeGroup[] = []
  if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
    ageGroups.push('young')
  }
  if (text.includes('') || text.includes('') || text.includes('')) {
    ageGroups.push('adult')
  }
  if (text.includes('') || text.includes('')) {
    ageGroups.push('mature')
  }
  if (ageGroups.length === 0) ageGroups.push('young', 'adult', 'mature') // 
  inferredData.ageGroups = ageGroups
  
  //  (workRelevant)
  inferredData.workRelevant = text.includes('') || text.includes('') || 
                              text.includes('') || text.includes('') ||
                              text.includes('') || text.includes('')
                              
  //  (socialRelevant)
  inferredData.socialRelevant = text.includes('') || text.includes('') || 
                               text.includes('') || text.includes('') ||
                               text.includes('') || text.includes('')
  
  //  (AI)
  if (!question.agree) {
    // 
    if (question.dimension === 'EI') {
      if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
        inferredData.agree = 'I'
      } else if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
        inferredData.agree = 'E'
      }
    } else if (question.dimension === 'TF') {
      if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
        inferredData.agree = 'T'
      } else if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
        inferredData.agree = 'F'
      }
    } else if (question.dimension === 'SN') {
      if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
        inferredData.agree = 'S'
      } else if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
        inferredData.agree = 'N'
      }
    } else if (question.dimension === 'JP') {
      if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
        inferredData.agree = 'J'
      } else if (text.includes('') || text.includes('') || text.includes('') || text.includes('')) {
        inferredData.agree = 'P'
      }
    }
    
    // 
    if (!inferredData.agree) {
      inferredData.agree = FIRST_LETTER[question.dimension]
    }
  }
  
  return inferredData as Question
}

// AI
export function calculatePersonalizedWeightForAI(question: Question, profile?: UserProfile | null): number {
  if (!profile) return 1.0
  
  // 
  const enrichedQuestion = inferQuestionMetadata(question)
  
  // 
  return calculatePersonalizedWeight(enrichedQuestion, profile)
}

// MBTI
function computeMbtiInternal(
  answers: Answers,
  questionsArray: Question[],
  profile?: UserProfile | null
): MbtiResult {
  const dims: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }
  const perDimCounts: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }

  for (const q of questionsArray) {
    const v = answers[q.id]
    if (!v) continue
    perDimCounts[q.dimension] += 1
    const delta = v - 4
    const first = FIRST_LETTER[q.dimension]
    const direction = q.agree === first ? 1 : -1
    const weight = profile ? calculatePersonalizedWeight(q, profile) : 1
    dims[q.dimension] += delta * direction * weight
  }

  const quality = detectAnswerQuality(answers, questionsArray)

  const scores = {} as Record<Dimension, DimensionScore>
  ;(["EI", "SN", "TF", "JP"] as Dimension[]).forEach((d) => {
    const net = dims[d]
    const maxAbs = (perDimCounts[d] || 1) * 3
    const winner = net >= 0 ? FIRST_LETTER[d] : SECOND_LETTER[d]
    const percentFirst = Math.round(50 + (net / maxAbs) * 50)
    const percentSecond = 100 - percentFirst

    const answeredCount = perDimCounts[d]
    const strength = Math.abs(percentFirst - 50)
    let dimConfidence = 85

    if (answeredCount < 5) dimConfidence -= 25
    else if (answeredCount < 10) dimConfidence -= 10

    if (strength < 10) dimConfidence -= 15
    else if (strength < 20) dimConfidence -= 8

    dimConfidence *= quality.consistencyScore
    if (profile) dimConfidence *= 1.1

    scores[d] = {
      dimension: d,
      first: FIRST_LETTER[d],
      second: SECOND_LETTER[d],
      net,
      maxAbs,
      winner,
      percentFirst,
      percentSecond,
      confidence: Math.round(Math.max(20, Math.min(100, dimConfidence))),
      answered: answeredCount,
    }
  })

  const confidence = assessConfidence(quality, scores)
  if (profile) {
    confidence.overall = Math.min(100, confidence.overall * 1.05)
    confidence.recommendations.push('')
  }

  const type =
    (scores.EI.winner as string) +
    (scores.SN.winner as string) +
    (scores.TF.winner as string) +
    (scores.JP.winner as string)

  return { type, scores, quality, confidence }
}

export function computeMbtiWithProfile(
  answers: Answers,
  profile?: UserProfile | null,
  questionsToUse?: Question[]
): MbtiResult {
  const questionsArray = questionsToUse || QUESTIONS
  return computeMbtiInternal(answers, questionsArray, profile)
}

export function computeMbti(answers: Answers, questionsToUse?: Question[]): MbtiResult {
  const questionsArray = questionsToUse || QUESTIONS
  return computeMbtiInternal(answers, questionsArray)
}

export function formatScoresForShare(result: MbtiResult) {
  const d = result.scores
  const line = (dim: Dimension) => {
    const s = d[dim]
    const left = `${s.first} ${s.percentFirst}%`
    const right = `${s.second} ${s.percentSecond}%`
    return `${dim}: ${left} | ${right}`
  }
  return [line("EI"), line("SN"), line("TF"), line("JP")].join("\n")
}

// 
export function getPersonalizedQuestions(profile?: UserProfile | null, questions: Question[] = QUESTIONS): Question[] {
  if (!profile) {
    // 
    return questions.slice(0, 60) // 1560
  }

  const ageGroup: AgeGroup = profile.age <= 25 ? "young" : profile.age <= 40 ? "adult" : "mature"
  const isWorking = profile.occupation && profile.occupation.toLowerCase() !== ""
  
  // 
  const filteredQuestions = questions.filter(q => {
    // 
    if (q.ageGroups && !q.ageGroups.includes(ageGroup)) return false
    
    // 
    if (isWorking && profile.workStyle) {
      // 
      if (q.workRelevant) return true
    } else if (!isWorking) {
      // 
      if (q.workRelevant && !q.contexts?.includes("general")) return Math.random() < 0.3
    }
    
    // 
    if (profile.socialPreference) {
      if (profile.socialPreference === "quiet" && q.socialRelevant) {
        // 
        return Math.random() < 0.6
      } else if (profile.socialPreference === "social" && q.socialRelevant) {
        // 
        return true
      }
    }
    
    return true
  })

  // 
  const questionsByDimension: Record<Dimension, Question[]> = {
    EI: [],
    SN: [],
    TF: [],
    JP: []
  }
  
  filteredQuestions.forEach(q => {
    questionsByDimension[q.dimension].push(q)
  })
  
  // 15
  const selectedQuestions: Question[] = []
  ;(["EI", "SN", "TF", "JP"] as Dimension[]).forEach(dim => {
    const dimQuestions = questionsByDimension[dim]
    const selected = dimQuestions.slice(0, 15) // 15
    
    // 15
    if (selected.length < 15) {
    const remaining = questions.filter(q => 
        q.dimension === dim && !selected.find(s => s.id === q.id)
      )
      selected.push(...remaining.slice(0, 15 - selected.length))
    }
    
    selectedQuestions.push(...selected)
  })
  
  // 
  return shuffleArray(selectedQuestions)
}

// 
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// AIMBTI
export function convertAIQuestionToMBTI(aiQuestion: AIQuestionInput): Question {
  // IDID
  const generateStableId = (text: string, dimension: string, agree: string): string => {
    const content = `${text}_${dimension}_${agree}`
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `ai_${Math.abs(hash).toString(36)}`
  }

  // 
  const text = typeof aiQuestion.text === 'string' && aiQuestion.text.trim() ? aiQuestion.text : ''
  const dimension = convertDimensionFormat(aiQuestion.dimension ?? '') || 'EI'
  const agreeRaw = typeof aiQuestion.agree === 'string' ? aiQuestion.agree.toUpperCase() : ''
  const agree = (['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as Letter[]).includes(agreeRaw as Letter)
    ? (agreeRaw as Letter)
    : (dimension[0] as Letter)
  const stableId = generateStableId(text, dimension, agree)

  const converted: Question = {
    // ID ai_ 
    id: stableId,
    text,
    dimension,
    agree,
    contexts: aiQuestion.contexts || ['general'],
    ageGroups: aiQuestion.ageGroups || ['young', 'adult', 'mature'],
    workRelevant: aiQuestion.workRelevant || false,
    socialRelevant: aiQuestion.socialRelevant || false
  }
  
  return converted
}

//  (E/I -> EI, T/F -> TF )
function convertDimensionFormat(dimension: string): Dimension | undefined {
  if (!dimension) return undefined
  
  const mapping: Record<string, Dimension> = {
    'E/I': 'EI',
    'EI': 'EI',
    'S/N': 'SN',
    'SN': 'SN',
    'T/F': 'TF',
    'TF': 'TF',
    'J/P': 'JP',
    'JP': 'JP'
  }
  
  return mapping[dimension.toUpperCase()]
}

// AI
export function convertAIQuestionsToMBTI(aiQuestions: AIQuestionInput[]): Question[] {
  if (!Array.isArray(aiQuestions)) return []
  
  return aiQuestions.map(convertAIQuestionToMBTI)
}
