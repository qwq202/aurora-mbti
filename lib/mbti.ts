export type Dimension = "EI" | "SN" | "TF" | "JP"
export type Letter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P"
export type Likert = 1 | 2 | 3 | 4 | 5

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
}

export type QuestionContext = "work" | "social" | "personal" | "academic" | "general"
export type AgeGroup = "young" | "adult" | "mature" // 18-25, 26-40, 40+

export type Question = {
  id: string
  text: string
  dimension: Dimension
  agree: Letter // which letter agreement leans toward
  contexts?: QuestionContext[] // 适用场景
  ageGroups?: AgeGroup[] // 适用年龄段
  workRelevant?: boolean // 是否与工作相关
  socialRelevant?: boolean // 是否与社交相关
}

export const QUESTIONS: Question[] = [
  // EI（30题）- 添加个人化标签
  { id: "q1", text: "在热闹的社交场合我会充满能量。", dimension: "EI", agree: "E", contexts: ["social"], socialRelevant: true },
  { id: "q2", text: "长时间社交后我需要独处恢复能量。", dimension: "EI", agree: "I", contexts: ["social"], socialRelevant: true },
  { id: "q3", text: "认识新朋友让我感到兴奋。", dimension: "EI", agree: "E", contexts: ["social"], socialRelevant: true },
  { id: "q4", text: "我更享受与少数熟悉的人深谈。", dimension: "EI", agree: "I", contexts: ["social", "personal"], socialRelevant: true },
  { id: "q5", text: "我主动开启对话而不感到困难。", dimension: "EI", agree: "E", contexts: ["social"], socialRelevant: true },
  { id: "q6", text: "陌生场合我更倾向于观察而非参与。", dimension: "EI", agree: "I", contexts: ["social"], socialRelevant: true },
  { id: "q7", text: "团队合作比单独作业让我更有动力。", dimension: "EI", agree: "E", contexts: ["work"], workRelevant: true },
  { id: "q8", text: "独立完成任务让我更专注。", dimension: "EI", agree: "I", contexts: ["work"], workRelevant: true },
  { id: "q9", text: "我说出想法有助于我理清思路。", dimension: "EI", agree: "E", contexts: ["general"] },
  { id: "q10", text: "我倾向先在心里想清楚再开口。", dimension: "EI", agree: "I", contexts: ["general"] },
  { id: "q11", text: "我喜欢把时间安排得更丰富和外向。", dimension: "EI", agree: "E", contexts: ["personal"] },
  { id: "q12", text: "周末我偏好安静的个人活动。", dimension: "EI", agree: "I", contexts: ["personal"] },
  { id: "q13", text: "公开发表意见对我来说轻松自然。", dimension: "EI", agree: "E", contexts: ["work", "social"], workRelevant: true, socialRelevant: true },
  { id: "q14", text: "我更愿意在小范围内表达看法。", dimension: "EI", agree: "I", contexts: ["work", "social"], workRelevant: true, socialRelevant: true },
  { id: "q15", text: "我在社交中容易成为带动气氛的人。", dimension: "EI", agree: "E", contexts: ["social"], socialRelevant: true },
  { id: "q16", text: "我不喜欢成为众人焦点。", dimension: "EI", agree: "I", contexts: ["social"], socialRelevant: true },
  { id: "q17", text: "即兴聚会让我感到兴奋。", dimension: "EI", agree: "E", contexts: ["social"], socialRelevant: true },
  { id: "q18", text: "临时的社交安排会让我疲惫。", dimension: "EI", agree: "I", contexts: ["social"], socialRelevant: true },
  { id: "q19", text: "我乐于结识不同背景的人。", dimension: "EI", agree: "E", contexts: ["social"], socialRelevant: true },
  { id: "q20", text: "维系少数深度关系对我更重要。", dimension: "EI", agree: "I", contexts: ["social"], socialRelevant: true },
  { id: "q21", text: "我在群体讨论中越聊越有想法。", dimension: "EI", agree: "E", contexts: ["work", "social"], workRelevant: true, socialRelevant: true },
  { id: "q22", text: "我更擅长独立思考再给出结论。", dimension: "EI", agree: "I", contexts: ["work"], workRelevant: true },
  { id: "q23", text: "结识陌生人时我常先开口打招呼。", dimension: "EI", agree: "E", contexts: ["social"], socialRelevant: true },
  { id: "q24", text: "我更希望别人先来找我聊天。", dimension: "EI", agree: "I", contexts: ["social"], socialRelevant: true },
  { id: "q25", text: "我喜欢活动丰富的环境。", dimension: "EI", agree: "E", contexts: ["general"] },
  { id: "q26", text: "我偏好安静有序的环境。", dimension: "EI", agree: "I", contexts: ["general"] },
  { id: "q27", text: "与人同处让我更有安全感。", dimension: "EI", agree: "E", contexts: ["personal"] },
  { id: "q28", text: "独处能让我更快恢复平衡。", dimension: "EI", agree: "I", contexts: ["personal"] },
  { id: "q29", text: "我乐于把想法公开分享。", dimension: "EI", agree: "E", contexts: ["general"] },
  { id: "q30", text: "我更倾向把感受保留在心里。", dimension: "EI", agree: "I", contexts: ["personal"] },

  // SN（30题）- 添加个人化标签  
  { id: "q31", text: "我做决定更依赖事实与数据。", dimension: "SN", agree: "S", contexts: ["work"], workRelevant: true },
  { id: "q32", text: "我常联想到可能性与隐含含义。", dimension: "SN", agree: "N", contexts: ["general"] },
  { id: "q33", text: "我关注细节是否可行。", dimension: "SN", agree: "S", contexts: ["work"], workRelevant: true },
  { id: "q34", text: "我容易从小事推演大图景。", dimension: "SN", agree: "N", contexts: ["general"] },
  { id: "q35", text: "我信赖亲身经验胜过理论。", dimension: "SN", agree: "S", contexts: ["general"] },
  { id: "q36", text: "我喜欢构想全新点子与框架。", dimension: "SN", agree: "N", contexts: ["work"], workRelevant: true },
  { id: "q37", text: "我更看重当前现实而非远景。", dimension: "SN", agree: "S" },
  { id: "q38", text: "我经常畅想未来的发展方向。", dimension: "SN", agree: "N" },
  { id: "q39", text: "我偏好一步一步按部就班。", dimension: "SN", agree: "S" },
  { id: "q40", text: "我喜欢跳出框架寻找替代方案。", dimension: "SN", agree: "N" },
  { id: "q41", text: "我描述事物时更具体而非抽象。", dimension: "SN", agree: "S" },
  { id: "q42", text: "我描述事物时更偏向比喻与概念。", dimension: "SN", agree: "N" },
  { id: "q43", text: "我注意到环境中的实物细节。", dimension: "SN", agree: "S" },
  { id: "q44", text: "我更在意趋势与模式。", dimension: "SN", agree: "N" },
  { id: "q45", text: "我对“证据不足的想法”持保留态度。", dimension: "SN", agree: "S" },
  { id: "q46", text: "我愿意在不完整信息下探索可能。", dimension: "SN", agree: "N" },
  { id: "q47", text: "我喜欢已有流程与规范。", dimension: "SN", agree: "S" },
  { id: "q48", text: "我喜欢改良或重塑流程。", dimension: "SN", agree: "N" },
  { id: "q49", text: "我更容易记住事实与数字。", dimension: "SN", agree: "S" },
  { id: "q50", text: "我更容易记住灵感与点子。", dimension: "SN", agree: "N" },
  { id: "q51", text: "我做事讲究实用与落地。", dimension: "SN", agree: "S" },
  { id: "q52", text: "我做事注重意义与创新。", dimension: "SN", agree: "N" },
  { id: "q53", text: "我更相信“看得见的成果”。", dimension: "SN", agree: "S" },
  { id: "q54", text: "我更相信“看不见的潜力”。", dimension: "SN", agree: "N" },
  { id: "q55", text: "我偏爱具体指引而非开放命题。", dimension: "SN", agree: "S" },
  { id: "q56", text: "我偏爱开放问题而非固定答案。", dimension: "SN", agree: "N" },
  { id: "q57", text: "我常问“现在能怎么做？”。", dimension: "SN", agree: "S" },
  { id: "q58", text: "我常问“如果……会怎样？”。", dimension: "SN", agree: "N" },
  { id: "q59", text: "我喜欢按事实检验观点。", dimension: "SN", agree: "S" },
  { id: "q60", text: "我喜欢用假设启发思考。", dimension: "SN", agree: "N" },

  // TF（30题）
  { id: "q61", text: "我倾向以逻辑分析来判断是非。", dimension: "TF", agree: "T" },
  { id: "q62", text: "我会优先考虑他人的感受。", dimension: "TF", agree: "F" },
  { id: "q63", text: "直截了当的反馈更有效。", dimension: "TF", agree: "T" },
  { id: "q64", text: "言辞的温度与方式很重要。", dimension: "TF", agree: "F" },
  { id: "q65", text: "我做决定时重视规则一致性。", dimension: "TF", agree: "T" },
  { id: "q66", text: "我做决定时考虑关系的和谐。", dimension: "TF", agree: "F" },
  { id: "q67", text: "我愿意为正确的结果承担冲突。", dimension: "TF", agree: "T" },
  { id: "q68", text: "我愿意为关系的和谐做出让步。", dimension: "TF", agree: "F" },
  { id: "q69", text: "我欣赏理性且基于证据的讨论。", dimension: "TF", agree: "T" },
  { id: "q70", text: "我欣赏体贴与理解的沟通。", dimension: "TF", agree: "F" },
  { id: "q71", text: "批评是改进的工具而非人身评价。", dimension: "TF", agree: "T" },
  { id: "q72", text: "批评应兼顾感受与支持。", dimension: "TF", agree: "F" },
  { id: "q73", text: "我更容易先看问题与风险。", dimension: "TF", agree: "T" },
  { id: "q74", text: "我更容易先看人和动机。", dimension: "TF", agree: "F" },
  { id: "q75", text: "我在压力下更依靠理性切分问题。", dimension: "TF", agree: "T" },
  { id: "q76", text: "我在压力下更关注彼此情绪与支持。", dimension: "TF", agree: "F" },
  { id: "q77", text: "公平意味着标准一致。", dimension: "TF", agree: "T" },
  { id: "q78", text: "公平意味着考虑个体处境。", dimension: "TF", agree: "F" },
  { id: "q79", text: "我更看重事实胜过氛围。", dimension: "TF", agree: "T" },
  { id: "q80", text: "我更看重氛围胜过结果。", dimension: "TF", agree: "F" },
  { id: "q81", text: "我倾向于快速给出判断与方案。", dimension: "TF", agree: "T" },
  { id: "q82", text: "我倾向于先共情再给建议。", dimension: "TF", agree: "F" },
  { id: "q83", text: "我喜欢可量化的目标与指标。", dimension: "TF", agree: "T" },
  { id: "q84", text: "我喜欢对齐价值与愿景。", dimension: "TF", agree: "F" },
  { id: "q85", text: "我面对分歧更愿意辩论。", dimension: "TF", agree: "T" },
  { id: "q86", text: "我面对分歧更愿意协调。", dimension: "TF", agree: "F" },
  { id: "q87", text: "我乐于指出不合理之处。", dimension: "TF", agree: "T" },
  { id: "q88", text: "我会避免让人难堪。", dimension: "TF", agree: "F" },
  { id: "q89", text: "我常用因果关系解释现象。", dimension: "TF", agree: "T" },
  { id: "q90", text: "我常用人际与情境解释现象。", dimension: "TF", agree: "F" },

  // JP（30题）
  { id: "q91", text: "我喜欢把计划列得清楚可控。", dimension: "JP", agree: "J" },
  { id: "q92", text: "我喜欢灵活随性地推进。", dimension: "JP", agree: "P" },
  { id: "q93", text: "完成任务前我难以放松。", dimension: "JP", agree: "J" },
  { id: "q94", text: "我能接受事情边走边看。", dimension: "JP", agree: "P" },
  { id: "q95", text: "明确的截止日期让我更安心。", dimension: "JP", agree: "J" },
  { id: "q96", text: "宽松的时间让我发挥更好。", dimension: "JP", agree: "P" },
  { id: "q97", text: "我倾向先定范围再行动。", dimension: "JP", agree: "J" },
  { id: "q98", text: "我倾向先行动再调整方向。", dimension: "JP", agree: "P" },
  { id: "q99", text: "我讨厌临时变更计划。", dimension: "JP", agree: "J" },
  { id: "q100", text: "我能快速适应临时变化。", dimension: "JP", agree: "P" },
  { id: "q101", text: "我偏好结构化的文件与流程。", dimension: "JP", agree: "J" },
  { id: "q102", text: "我偏好轻量随时调整的流程。", dimension: "JP", agree: "P" },
  { id: "q103", text: "我喜欢提前做准备与备选方案。", dimension: "JP", agree: "J" },
  { id: "q104", text: "我更享受即兴与随机应变。", dimension: "JP", agree: "P" },
  { id: "q105", text: "我会把待办拆解并跟踪进度。", dimension: "JP", agree: "J" },
  { id: "q106", text: "我更依赖灵感与当下优先级。", dimension: "JP", agree: "P" },
  { id: "q107", text: "我希望把事情定下来再开始新的。", dimension: "JP", agree: "J" },
  { id: "q108", text: "我会保留多种可能同时推进。", dimension: "JP", agree: "P" },
  { id: "q109", text: "我习惯用清单与提醒管理生活。", dimension: "JP", agree: "J" },
  { id: "q110", text: "我更凭感觉安排日程。", dimension: "JP", agree: "P" },
  { id: "q111", text: "我认为规则保障效率。", dimension: "JP", agree: "J" },
  { id: "q112", text: "我认为规则应为灵活服务。", dimension: "JP", agree: "P" },
  { id: "q113", text: "我喜欢把空间与桌面保持整洁。", dimension: "JP", agree: "J" },
  { id: "q114", text: "我不介意适度的“有序混乱”。", dimension: "JP", agree: "P" },
  { id: "q115", text: "我对“按时交付”非常敏感。", dimension: "JP", agree: "J" },
  { id: "q116", text: "我对“保持选择空间”非常看重。", dimension: "JP", agree: "P" },
  { id: "q117", text: "我倾向尽快做决定。", dimension: "JP", agree: "J" },
  { id: "q118", text: "我倾向多收集信息再看时机。", dimension: "JP", agree: "P" },
  { id: "q119", text: "固定的节奏能促进我的产出。", dimension: "JP", agree: "J" },
  { id: "q120", text: "变化的节奏能激发我的活力。", dimension: "JP", agree: "P" },
]

export type Answers = Record<string, Likert>

// 答题质量检测结果
export type AnswerQuality = {
  straightLining: boolean      // 是否全选同一个选项
  extremeResponse: boolean     // 是否只选极端选项(1或5)
  centralTendency: boolean     // 是否过度偏向中立(3)
  randomPattern: boolean       // 是否存在随机答题模式
  completionRate: number       // 答题完成率 0-1
  consistencyScore: number     // 答题一致性 0-1
}

// 置信度评估结果
export type ConfidenceAssessment = {
  overall: number              // 整体置信度 0-100
  dimensions: Record<Dimension, number>  // 各维度置信度 0-100
  qualityFlags: string[]       // 质量问题标记
  recommendations: string[]    // 建议
}

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

export type DimensionScore = {
  dimension: Dimension
  first: Letter // e.g., 'E'
  second: Letter // e.g., 'I'
  net: number // negative means leaning to second
  maxAbs: number
  winner: Letter
  percentFirst: number // 0-100
  percentSecond: number // 0-100
  confidence: number // 0-100，该维度结果的置信度
  answered: number   // 该维度实际答题数量
}

export type MbtiResult = {
  type: string
  scores: Record<Dimension, DimensionScore>
  quality: AnswerQuality
  confidence: ConfidenceAssessment
}

// 答题质量检测函数
export function detectAnswerQuality(answers: Answers, questionsToUse?: Question[]): AnswerQuality {
  const questionsArray = questionsToUse || QUESTIONS
  const totalQuestions = questionsArray.length
  const answeredValues = Object.values(answers).filter(v => v !== undefined)
  const answeredCount = answeredValues.length
  
  // 完成率
  const completionRate = answeredCount / totalQuestions
  
  // 检测极端回答 (只选1或5)
  const extremeCount = answeredValues.filter(v => v === 1 || v === 5).length
  const extremeResponse = extremeCount / answeredCount > 0.8 && answeredCount > 10
  
  // 检测中立倾向 (过多选择3)
  const neutralCount = answeredValues.filter(v => v === 3).length
  const centralTendency = neutralCount / answeredCount > 0.6 && answeredCount > 10
  
  // 检测直线作答 (同一个选项占比过高)
  const valueCounts = [1, 2, 3, 4, 5].map(v => answeredValues.filter(a => a === v).length)
  const maxCount = Math.max(...valueCounts)
  const straightLining = maxCount / answeredCount > 0.7 && answeredCount > 15
  
  // 检测随机模式 (方差过小，说明答案分布过于均匀)
  const mean = answeredValues.reduce((sum, v) => sum + v, 0) / answeredValues.length
  const variance = answeredValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / answeredValues.length
  const randomPattern = variance < 0.8 && answeredCount > 20
  
  // 一致性评分：计算同维度题目间的相关性
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

// 计算各维度内部一致性
function calculateDimensionConsistency(answers: Answers, questions: Question[]): number {
  const dimensionScores: Record<Dimension, number[]> = { EI: [], SN: [], TF: [], JP: [] }
  
  // 按维度分组答案
  questions.forEach(q => {
    const answer = answers[q.id]
    if (answer) {
      // 标准化分数：同意倾向题目保持原值，不同意倾向题目反转
      const first = FIRST_LETTER[q.dimension]
      const normalizedScore = q.agree === first ? answer : (6 - answer)
      dimensionScores[q.dimension].push(normalizedScore)
    }
  })
  
  // 计算各维度的内部一致性（方差）
  let totalConsistency = 0
  let validDimensions = 0
  
  Object.values(dimensionScores).forEach(scores => {
    if (scores.length >= 3) {
      const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
      // 一致性 = 1 - (方差/最大可能方差)，范围0-1
      const consistency = 1 - Math.min(variance / 4, 1)
      totalConsistency += consistency
      validDimensions++
    }
  })
  
  return validDimensions > 0 ? totalConsistency / validDimensions : 0.5
}

// 计算置信度评估
export function assessConfidence(quality: AnswerQuality, scores: Record<Dimension, DimensionScore>): ConfidenceAssessment {
  const qualityFlags: string[] = []
  const recommendations: string[] = []
  
  // 基础置信度计算
  let baseConfidence = 100
  
  // 完成率影响
  if (quality.completionRate < 0.5) {
    baseConfidence -= 40
    qualityFlags.push('完成率过低')
    recommendations.push('建议完成更多题目以获得准确结果')
  } else if (quality.completionRate < 0.8) {
    baseConfidence -= 15
  }
  
  // 答题模式异常检测
  if (quality.straightLining) {
    baseConfidence -= 30
    qualityFlags.push('答题模式单一')
    recommendations.push('建议重新测试时更仔细考虑每个问题')
  }
  
  if (quality.extremeResponse) {
    baseConfidence -= 20
    qualityFlags.push('过多极端选择')
    recommendations.push('考虑选择更贴近真实感受的选项')
  }
  
  if (quality.centralTendency) {
    baseConfidence -= 25
    qualityFlags.push('过度中立回答')
    recommendations.push('尝试明确表达你的偏好和倾向')
  }
  
  if (quality.randomPattern) {
    baseConfidence -= 35
    qualityFlags.push('答题模式异常')
    recommendations.push('建议重新测试并认真回答每个问题')
  }
  
  // 一致性影响
  if (quality.consistencyScore < 0.6) {
    baseConfidence -= 20
    qualityFlags.push('答题一致性较低')
    recommendations.push('答题时保持一致的理解和标准')
  }
  
  const overall = Math.max(20, Math.min(100, baseConfidence))
  
  // 计算各维度置信度
  const dimensions: Record<Dimension, number> = {} as Record<Dimension, number>
  ;(["EI", "SN", "TF", "JP"] as Dimension[]).forEach(d => {
    const score = scores[d]
    let dimConfidence = overall
    
    // 答题数量影响
    if (score.answered < 5) {
      dimConfidence -= 25
    } else if (score.answered < 10) {
      dimConfidence -= 10
    }
    
    // 结果强度影响 (越接近50%越不确定)
    const strength = Math.abs(score.percentFirst - 50)
    if (strength < 10) {
      dimConfidence -= 15
    } else if (strength < 20) {
      dimConfidence -= 8
    }
    
    dimensions[d] = Math.max(20, Math.min(100, dimConfidence))
  })
  
  // 添加成功建议
  if (overall >= 80) {
    recommendations.push('测试结果可信度较高')
  } else if (overall >= 60) {
    recommendations.push('测试结果具有一定参考价值')
  }
  
  return {
    overall,
    dimensions,
    qualityFlags,
    recommendations
  }
}

// 个性化权重计算
export function calculatePersonalizedWeight(question: Question, profile?: UserProfile | null): number {
  if (!profile) return 1.0
  
  let weight = 1.0
  
  // 年龄相关权重调整
  const age = profile.age
  if (age && question.ageGroups) {
    let ageGroup: AgeGroup
    if (age <= 25) ageGroup = "young"
    else if (age <= 40) ageGroup = "adult"
    else ageGroup = "mature"
    
    if (question.ageGroups.includes(ageGroup)) {
      weight *= 1.2 // 增加适用年龄段题目的权重
    } else {
      weight *= 0.8 // 降低不适用年龄段题目的权重
    }
  }
  
  // 职业相关权重调整
  if (profile.occupation && question.workRelevant) {
    const occupation = profile.occupation.toLowerCase()
    if (occupation.includes("学生")) {
      weight *= question.contexts?.includes("academic") ? 1.3 : 0.9
    } else if (occupation.includes("技术") || occupation.includes("程序") || occupation.includes("工程")) {
      weight *= question.contexts?.includes("work") ? 1.2 : 0.95
    } else if (occupation.includes("管理") || occupation.includes("领导")) {
      weight *= (question.dimension === "EI" && question.agree === "E") ? 1.1 : 1.0
    }
  }
  
  // 社交偏好相关权重调整
  if (profile.socialPreference && question.socialRelevant) {
    if (profile.socialPreference === "quiet" && question.dimension === "EI") {
      weight *= question.agree === "I" ? 1.2 : 0.9
    } else if (profile.socialPreference === "social" && question.dimension === "EI") {
      weight *= question.agree === "E" ? 1.2 : 0.9
    }
  }
  
  // 工作风格相关权重调整
  if (profile.workStyle && question.workRelevant) {
    if (profile.workStyle === "individual" && question.dimension === "EI") {
      weight *= question.agree === "I" ? 1.15 : 0.95
    } else if (profile.workStyle === "team" && question.dimension === "EI") {
      weight *= question.agree === "E" ? 1.15 : 0.95
    }
  }
  
  // 压力水平相关权重调整
  if (profile.stressLevel) {
    if (profile.stressLevel === "high" && question.dimension === "JP") {
      weight *= question.agree === "J" ? 1.1 : 0.95 // 高压力倾向于更有计划性
    } else if (profile.stressLevel === "low" && question.dimension === "JP") {
      weight *= question.agree === "P" ? 1.05 : 1.0 // 低压力可能更灵活
    }
  }
  
  // 兴趣爱好文本分析权重调整
  if (profile.interests) {
    const interests = profile.interests.toLowerCase()
    
    // 技术相关兴趣
    if (interests.includes("编程") || interests.includes("代码") || interests.includes("技术") || 
        interests.includes("计算机") || interests.includes("github")) {
      if (question.dimension === "TF") {
        weight *= question.agree === "T" ? 1.1 : 0.95 // 技术人员倾向逻辑思维
      }
      if (question.dimension === "SN") {
        weight *= question.agree === "N" ? 1.1 : 0.95 // 技术人员倾向直觉思维
      }
    }
    
    // 艺术创作相关兴趣
    if (interests.includes("艺术") || interests.includes("音乐") || interests.includes("绘画") || 
        interests.includes("写作") || interests.includes("设计")) {
      if (question.dimension === "TF") {
        weight *= question.agree === "F" ? 1.1 : 0.95 // 艺术人员倾向情感决策
      }
      if (question.dimension === "SN") {
        weight *= question.agree === "N" ? 1.15 : 0.9 // 艺术人员强烈倾向直觉
      }
    }
    
    // 独处相关偏好
    if (interests.includes("宅") || interests.includes("独处") || interests.includes("安静")) {
      if (question.dimension === "EI") {
        weight *= question.agree === "I" ? 1.2 : 0.8 // 明确的内向偏好
      }
    }
    
    // 社交相关偏好
    if (interests.includes("聚会") || interests.includes("交友") || interests.includes("社交")) {
      if (question.dimension === "EI") {
        weight *= question.agree === "E" ? 1.2 : 0.8 // 明确的外向偏好
      }
    }
  }
  
  // 确保权重在合理范围内
  return Math.max(0.3, Math.min(2.0, weight))
}

// 为AI生成的题目推断元数据
export function inferQuestionMetadata(question: Question): Question {
  const text = question.text.toLowerCase()
  const inferredData: Partial<Question> = { ...question }
  
  // 推断场景类型 (contexts)
  const contexts: QuestionContext[] = []
  if (text.includes('工作') || text.includes('项目') || text.includes('团队') || text.includes('任务') || 
      text.includes('竞赛班') || text.includes('学习')) {
    contexts.push('work', 'academic')
  }
  if (text.includes('朋友') || text.includes('社交') || text.includes('聚会') || text.includes('讨论')) {
    contexts.push('social')
  }
  if (text.includes('独处') || text.includes('个人') || text.includes('宅') || text.includes('自己')) {
    contexts.push('personal')
  }
  if (contexts.length === 0) contexts.push('general')
  inferredData.contexts = contexts
  
  // 推断年龄段适用性 (ageGroups) 
  const ageGroups: AgeGroup[] = []
  if (text.includes('学生') || text.includes('学校') || text.includes('竞赛班') || text.includes('课')) {
    ageGroups.push('young')
  }
  if (text.includes('工作') || text.includes('职业') || text.includes('管理')) {
    ageGroups.push('adult')
  }
  if (text.includes('经验') || text.includes('阅历')) {
    ageGroups.push('mature')
  }
  if (ageGroups.length === 0) ageGroups.push('young', 'adult', 'mature') // 通用
  inferredData.ageGroups = ageGroups
  
  // 推断工作相关性 (workRelevant)
  inferredData.workRelevant = text.includes('工作') || text.includes('团队') || 
                              text.includes('项目') || text.includes('任务') ||
                              text.includes('竞赛班') || text.includes('学习')
                              
  // 推断社交相关性 (socialRelevant)
  inferredData.socialRelevant = text.includes('朋友') || text.includes('社交') || 
                               text.includes('聚会') || text.includes('讨论') ||
                               text.includes('同伴') || text.includes('人际')
  
  // 推断同意倾向 (如果AI没提供的话)
  if (!question.agree) {
    // 基于关键词推断同意倾向
    if (question.dimension === 'EI') {
      if (text.includes('独处') || text.includes('安静') || text.includes('宅') || text.includes('内向')) {
        inferredData.agree = 'I'
      } else if (text.includes('社交') || text.includes('聚会') || text.includes('同伴') || text.includes('讨论')) {
        inferredData.agree = 'E'
      }
    } else if (question.dimension === 'TF') {
      if (text.includes('逻辑') || text.includes('数据') || text.includes('分析') || text.includes('技术')) {
        inferredData.agree = 'T'
      } else if (text.includes('感受') || text.includes('情感') || text.includes('关心') || text.includes('和谐')) {
        inferredData.agree = 'F'
      }
    } else if (question.dimension === 'SN') {
      if (text.includes('具体') || text.includes('事实') || text.includes('细节') || text.includes('实际')) {
        inferredData.agree = 'S'
      } else if (text.includes('想象') || text.includes('可能') || text.includes('创新') || text.includes('未来')) {
        inferredData.agree = 'N'
      }
    } else if (question.dimension === 'JP') {
      if (text.includes('计划') || text.includes('安排') || text.includes('组织') || text.includes('规划')) {
        inferredData.agree = 'J'
      } else if (text.includes('随性') || text.includes('灵活') || text.includes('即兴') || text.includes('自由')) {
        inferredData.agree = 'P'
      }
    }
    
    // 默认回退到维度的第一个字母
    if (!inferredData.agree) {
      inferredData.agree = FIRST_LETTER[question.dimension]
    }
  }
  
  return inferredData as Question
}

// AI题目优化的个性化权重计算
export function calculatePersonalizedWeightForAI(question: Question, profile?: UserProfile | null): number {
  if (!profile) return 1.0
  
  // 首先推断题目的元数据
  const enrichedQuestion = inferQuestionMetadata(question)
  
  // 然后使用标准的个性化权重计算
  return calculatePersonalizedWeight(enrichedQuestion, profile)
}

// 支持个性化权重的MBTI计算函数重载
export function computeMbtiWithProfile(
  answers: Answers, 
  profile?: UserProfile | null, 
  questionsToUse?: Question[]
): MbtiResult {
  // aggregate net scores per dimension (positive => first letter)
  const dims: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }
  const perDimCounts: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }

  // 使用传入的题目数组，如果没有则使用标准题库
  const questionsArray = questionsToUse || QUESTIONS

  for (const q of questionsArray) {
    const v = answers[q.id]
    if (!v) continue
    perDimCounts[q.dimension] += 1
    const delta = v - 3 // -2..+2
    // if agree letter equals the first letter of the dimension => positive supports first
    const first = FIRST_LETTER[q.dimension]
    const direction = q.agree === first ? 1 : -1
    
    // 应用个性化权重
    const personalizedWeight = calculatePersonalizedWeight(q, profile)
    dims[q.dimension] += delta * direction * personalizedWeight
  }

  // 进行答题质量检测
  const quality = detectAnswerQuality(answers, questionsArray)

  const scores: Record<Dimension, DimensionScore> = {
    EI: null as any,
    SN: null as any,
    TF: null as any,
    JP: null as any,
  }
  ;(["EI", "SN", "TF", "JP"] as Dimension[]).forEach((d) => {
    const net = dims[d]
    const maxAbs = (perDimCounts[d] || 1) * 2 // each question contributes max 2
    const winner = net >= 0 ? FIRST_LETTER[d] : SECOND_LETTER[d]
    const percentFirst = Math.round(50 + (net / maxAbs) * 50)
    const percentSecond = 100 - percentFirst
    
    // 计算该维度的基础置信度
    const answeredCount = perDimCounts[d]
    const strength = Math.abs(percentFirst - 50)
    let dimConfidence = 85 // 基础置信度
    
    // 根据答题数量调整
    if (answeredCount < 5) dimConfidence -= 25
    else if (answeredCount < 10) dimConfidence -= 10
    
    // 根据结果强度调整
    if (strength < 10) dimConfidence -= 15
    else if (strength < 20) dimConfidence -= 8
    
    // 应用质量因子
    dimConfidence *= quality.consistencyScore
    
    // 个性化加权提升置信度
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

  // 计算整体置信度评估
  const confidence = assessConfidence(quality, scores)
  
  // 个性化加权提升整体置信度
  if (profile) {
    confidence.overall = Math.min(100, confidence.overall * 1.05)
    confidence.recommendations.push('已应用个性化权重分析，结果更精准')
  }

  const type =
    (scores.EI.winner as string) +
    (scores.SN.winner as string) +
    (scores.TF.winner as string) +
    (scores.JP.winner as string)

  return { type, scores, quality, confidence }
}

export function computeMbti(answers: Answers, questionsToUse?: Question[]): MbtiResult {
  // aggregate net scores per dimension (positive => first letter)
  const dims: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }
  const perDimCounts: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }

  // 使用传入的题目数组，如果没有则使用标准题库
  const questionsArray = questionsToUse || QUESTIONS

  for (const q of questionsArray) {
    const v = answers[q.id]
    if (!v) continue
    perDimCounts[q.dimension] += 1
    const delta = v - 3 // -2..+2
    // if agree letter equals the first letter of the dimension => positive supports first
    const first = FIRST_LETTER[q.dimension]
    const direction = q.agree === first ? 1 : -1
    dims[q.dimension] += delta * direction
  }

  // 进行答题质量检测
  const quality = detectAnswerQuality(answers, questionsArray)

  const scores: Record<Dimension, DimensionScore> = {
    EI: null as any,
    SN: null as any,
    TF: null as any,
    JP: null as any,
  }
  ;(["EI", "SN", "TF", "JP"] as Dimension[]).forEach((d) => {
    const net = dims[d]
    const maxAbs = (perDimCounts[d] || 1) * 2 // each question contributes max 2
    const winner = net >= 0 ? FIRST_LETTER[d] : SECOND_LETTER[d]
    const percentFirst = Math.round(50 + (net / maxAbs) * 50)
    const percentSecond = 100 - percentFirst
    
    // 计算该维度的基础置信度
    const answeredCount = perDimCounts[d]
    const strength = Math.abs(percentFirst - 50)
    let dimConfidence = 85 // 基础置信度
    
    // 根据答题数量调整
    if (answeredCount < 5) dimConfidence -= 25
    else if (answeredCount < 10) dimConfidence -= 10
    
    // 根据结果强度调整
    if (strength < 10) dimConfidence -= 15
    else if (strength < 20) dimConfidence -= 8
    
    // 应用质量因子
    dimConfidence *= quality.consistencyScore
    
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

  // 计算整体置信度评估
  const confidence = assessConfidence(quality, scores)

  const type =
    (scores.EI.winner as string) +
    (scores.SN.winner as string) +
    (scores.TF.winner as string) +
    (scores.JP.winner as string)

  return { type, scores, quality, confidence }
}

export const TYPE_INFO: Record<
  string,
  {
    name: string
    blurb: string
    vibe: string
    gradient: string // tailwind gradient classes
    strengths: string[]
    growth: string[]
  }
> = {
  INTJ: {
    name: "建筑师",
    blurb: "独立、理性、擅长系统性思考，习惯为长期目标规划路径。",
    vibe: "战略 | 深度 | 自主",
    gradient: "from-fuchsia-500 to-emerald-500",
    strengths: ["长远视角", "结构化规划", "高自驱"],
    growth: ["练习表达情感", "避免完美主义", "在不确定中迭代"],
  },
  INTP: {
    name: "逻辑学家",
    blurb: "好奇、分析、热衷原理探索，喜欢从多角度验证假设。",
    vibe: "好奇 | 理解 | 系统",
    gradient: "from-violet-500 to-rose-500",
    strengths: ["抽象能力强", "独立思辨", "快速建模"],
    growth: ["将想法落地", "设定节奏", "提升协作反馈频率"],
  },
  ENTJ: {
    name: "指挥官",
    blurb: "目标导向、行动果断，善于组织资源实现愿景。",
    vibe: "领导 | 执行 | 果敢",
    gradient: "from-rose-500 to-amber-500",
    strengths: ["决策力", "组织统筹", "结果导向"],
    growth: ["倾听多元声音", "关注节奏与可持续", "容纳试错"],
  },
  ENTP: {
    name: "辩论家",
    blurb: "思维跳跃、点子多，喜欢在碰撞中孵化新可能。",
    vibe: "创意 | 挑战 | 变革",
    gradient: "from-amber-500 to-fuchsia-500",
    strengths: ["创意爆发", "问题重构", "快速联想"],
    growth: ["聚焦优先级", "推进到闭环", "稳定节奏"],
  },
  INFJ: {
    name: "提倡者",
    blurb: "洞察人心、价值驱动，致力于推动意义与改变。",
    vibe: "共情 | 使命 | 指导",
    gradient: "from-emerald-500 to-fuchsia-500",
    strengths: ["洞察深刻", "价值判断", "长期主义"],
    growth: ["能量管理", "设置边界", "公开表达需求"],
  },
  INFP: {
    name: "调停者",
    blurb: "理想主义、真诚温柔，追求与自我价值一致的选择。",
    vibe: "理想 | 真诚 | 温暖",
    gradient: "from-rose-500 to-emerald-500",
    strengths: ["同理心", "创造力", "价值感强"],
    growth: ["把握现实约束", "训练决断力", "小步快跑"],
  },
  ENFJ: {
    name: "主人公",
    blurb: "富有影响力与组织力，擅长凝聚团队实现目标。",
    vibe: "鼓舞 | 组织 | 赋能",
    gradient: "from-fuchsia-500 to-amber-500",
    strengths: ["沟通感染力", "组织协调", "关注人心"],
    growth: ["避免过度承担", "自我照顾", "授权与边界"],
  },
  ENFP: {
    name: "竞选者",
    blurb: "热情且富有想象，向往多彩体验与自我实现。",
    vibe: "热情 | 想象 | 自由",
    gradient: "from-amber-500 to-violet-500",
    strengths: ["创意驱动", "连接感强", "机会敏感"],
    growth: ["聚焦与收敛", "建立节奏", "推进落地"],
  },
  ISTJ: {
    name: "物流师",
    blurb: "踏实可靠、注重细节，遵循规则保证稳定。",
    vibe: "秩序 | 稳定 | 可靠",
    gradient: "from-emerald-600 to-amber-500",
    strengths: ["强执行", "细致周到", "守时守信"],
    growth: ["拥抱适度变化", "提升灵活性", "关注体验"],
  },
  ISFJ: {
    name: "守护者",
    blurb: "体贴耐心、责任感强，乐于维护和谐与稳定。",
    vibe: "关怀 | 稳定 | 责任",
    gradient: "from-emerald-500 to-rose-500",
    strengths: ["同理与支持", "细节到位", "长期投入"],
    growth: ["表达真实想法", "避免过度付出", "适度冒险"],
  },
  ESTJ: {
    name: "总经理",
    blurb: "务实高效、结构清晰，善于制定规则推动执行。",
    vibe: "效率 | 结构 | 管理",
    gradient: "from-amber-600 to-rose-500",
    strengths: ["强组织力", "执行推动", "清晰标准"],
    growth: ["提升灵活度", "倾听与共情", "鼓励创新"],
  },
  ESFJ: {
    name: "执政官",
    blurb: "热心协作、乐于服务，打造有温度的秩序。",
    vibe: "协作 | 关怀 | 秩序",
    gradient: "from-rose-500 to-amber-500",
    strengths: ["人际协调", "团队氛围", "责任担当"],
    growth: ["关注自我需求", "容纳差异", "避免过度求稳"],
  },
  ISTP: {
    name: "鉴赏家",
    blurb: "冷静实干、喜欢动手解决问题，享受技巧与效率。",
    vibe: "技巧 | 冷静 | 适应",
    gradient: "from-emerald-500 to-violet-600",
    strengths: ["临场应变", "动手能力", "客观分析"],
    growth: ["关注长期目标", "沟通透明", "规律节奏"],
  },
  ISFP: {
    name: "探险家",
    blurb: "敏感细腻、追求美与自由，在体验中发现自我。",
    vibe: "美感 | 自由 | 体验",
    gradient: "from-rose-500 to-emerald-500",
    strengths: ["审美与创造", "温柔包容", "灵活自在"],
    growth: ["设定边界", "表达立场", "长远规划"],
  },
  ESTP: {
    name: "企业家",
    blurb: "大胆直接、行动力强，乐于在变化中抓住机会。",
    vibe: "行动 | 机敏 | 结果",
    gradient: "from-amber-500 to-fuchsia-500",
    strengths: ["快速执行", "洞察机会", "实战导向"],
    growth: ["评估风险", "思考长期影响", "耐心打磨"],
  },
  ESFP: {
    name: "表演者",
    blurb: "活力四射、热爱舞台，带来欢乐与关注当下。",
    vibe: "能量 | 感染 | 体验",
    gradient: "from-rose-500 to-amber-500",
    strengths: ["氛围营造", "乐观开放", "连接他人"],
    growth: ["持续性建设", "财务与节奏", "面对困难"],
  },
}

export function typeDisplayInfo(code: string) {
  const found = TYPE_INFO[code]
  if (found) return found
  // fallback style
  return {
    name: "个性类型",
    blurb: "你拥有独一无二的气质与偏好组合。",
    vibe: "独特 | 多元 | 发展",
    gradient: "from-fuchsia-500 to-rose-500",
    strengths: ["自我觉察", "持续学习", "探索尝试"],
    growth: ["接纳差异", "拥抱变化", "迭代前进"],
  }
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

// 个人化题目选择函数
export function getPersonalizedQuestions(profile?: UserProfile | null): Question[] {
  if (!profile) {
    // 没有个人资料时返回标准题库
    return QUESTIONS.slice(0, 60) // 每个维度15题，共60题
  }

  const ageGroup: AgeGroup = profile.age <= 25 ? "young" : profile.age <= 40 ? "adult" : "mature"
  const isWorking = profile.occupation && profile.occupation.toLowerCase() !== "学生"
  
  // 根据个人资料筛选题目
  const filteredQuestions = QUESTIONS.filter(q => {
    // 基础筛选
    if (q.ageGroups && !q.ageGroups.includes(ageGroup)) return false
    
    // 工作相关筛选
    if (isWorking && profile.workStyle) {
      // 如果是工作人士且有工作偏好，优先选择工作相关题目
      if (q.workRelevant) return true
    } else if (!isWorking) {
      // 如果不是工作人士，降低工作相关题目的权重
      if (q.workRelevant && !q.contexts?.includes("general")) return Math.random() < 0.3
    }
    
    // 社交偏好筛选
    if (profile.socialPreference) {
      if (profile.socialPreference === "quiet" && q.socialRelevant) {
        // 偏好安静的人，减少社交相关题目
        return Math.random() < 0.6
      } else if (profile.socialPreference === "social" && q.socialRelevant) {
        // 喜欢社交的人，增加社交相关题目权重
        return true
      }
    }
    
    return true
  })

  // 确保每个维度有足够的题目
  const questionsByDimension: Record<Dimension, Question[]> = {
    EI: [],
    SN: [],
    TF: [],
    JP: []
  }
  
  filteredQuestions.forEach(q => {
    questionsByDimension[q.dimension].push(q)
  })
  
  // 每个维度选择15道题
  const selectedQuestions: Question[] = []
  ;(["EI", "SN", "TF", "JP"] as Dimension[]).forEach(dim => {
    const dimQuestions = questionsByDimension[dim]
    const selected = dimQuestions.slice(0, 15) // 选择前15题
    
    // 如果不够15题，从剩余题目中补充
    if (selected.length < 15) {
      const remaining = QUESTIONS.filter(q => 
        q.dimension === dim && !selected.find(s => s.id === q.id)
      )
      selected.push(...remaining.slice(0, 15 - selected.length))
    }
    
    selectedQuestions.push(...selected)
  })
  
  // 打乱题目顺序
  return shuffleArray(selectedQuestions)
}

// 打乱数组的辅助函数
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
