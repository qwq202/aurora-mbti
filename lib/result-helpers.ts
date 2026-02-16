import { type MbtiResult, type UserProfile } from './mbti-types'
import { RESULT_KEY, ANSWERS_KEY, HISTORY_KEY, COMPARE_KEY } from './constants'

function isEnglish(locale?: string) {
  return locale === 'en'
}

function parseType(type: string) {
  const code = (type || '').toUpperCase().trim()
  if (!/^[EI][SN][TF][JP]$/.test(code)) return null
  return {
    ei: code[0] as 'E' | 'I',
    sn: code[1] as 'S' | 'N',
    tf: code[2] as 'T' | 'F',
    jp: code[3] as 'J' | 'P',
  }
}

export function getWorkEnvironment(type: string, locale?: string): string {
  const t = parseType(type)
  const en = isEnglish(locale)
  if (!t) return en ? 'Varies by person and context.' : '因人而异，也会受情境影响。'

  const parts: string[] = []
  parts.push(
    t.ei === 'E'
      ? en
        ? 'You tend to thrive in collaborative, fast-feedback environments.'
        : '更适合协作多、反馈快的环境。'
      : en
        ? 'You tend to thrive with autonomy, deep-focus time, and fewer interruptions.'
        : '更适合自主度高、深度专注、少打扰的环境。'
  )
  parts.push(
    t.sn === 'S'
      ? en
        ? 'Clear goals, concrete tasks, and visible progress keep you energized.'
        : '目标清晰、任务具体、进展可见会让你更有动力。'
      : en
        ? 'Space for exploration, strategy, and long-term thinking keeps you engaged.'
        : '有探索空间、能做策略与长期思考会让你更投入。'
  )
  parts.push(
    t.jp === 'J'
      ? en
        ? 'You usually prefer defined processes and predictable timelines.'
        : '通常偏好明确流程和可预期的节奏。'
      : en
        ? 'You usually prefer flexibility, iteration, and room to adjust plans.'
        : '通常偏好灵活迭代、随时调整计划。'
  )
  return parts.join(en ? ' ' : '；')
}

export function getCommunicationStyle(type: string, locale?: string): string {
  const t = parseType(type)
  const en = isEnglish(locale)
  if (!t) return en ? 'Your communication style varies by person and situation.' : '沟通风格会因人和情境而变化。'

  const parts: string[] = []
  parts.push(
    t.ei === 'E'
      ? en
        ? 'You often think out loud and gain energy from discussion.'
        : '更常“边聊边想”，从讨论中获得能量。'
      : en
        ? 'You often think first, then speak, and prefer smaller-group conversations.'
        : '更常“先想后说”，更偏好小范围或一对一沟通。'
  )
  parts.push(
    t.sn === 'S'
      ? en
        ? 'You like concrete examples, specifics, and what can be done next.'
        : '偏好具体例子、细节信息和“下一步怎么做”。'
      : en
        ? 'You like concepts, patterns, and exploring possibilities and direction.'
        : '偏好概念与关联，喜欢讨论可能性与方向感。'
  )
  parts.push(
    t.tf === 'T'
      ? en
        ? 'You tend to be direct and logic-first, focusing on conclusions and trade-offs.'
        : '更直接、以逻辑为先，关注结论与取舍。'
      : en
        ? 'You tend to be warm and people-aware, focusing on feelings and relationship harmony.'
        : '更温和、注重感受与关系氛围。'
  )
  parts.push(
    t.jp === 'J'
      ? en
        ? 'You prefer structured conversations with clear decisions and follow-ups.'
        : '偏好有结构的沟通，喜欢明确结论与跟进。'
      : en
        ? 'You prefer open-ended conversations that leave room for iteration and change.'
        : '偏好开放式沟通，给迭代与变化留空间。'
  )
  return parts.join(en ? ' ' : '；')
}

export function getPotentialChallenges(type: string, locale?: string): string {
  const t = parseType(type)
  const en = isEnglish(locale)
  if (!t) return en ? 'It depends on your context and habits.' : '取决于你的情境与习惯。'

  const parts: string[] = []
  if (t.ei === 'E') parts.push(en ? 'May speak too quickly before fully thinking through.' : '可能在想清楚前就先说出口。')
  else parts.push(en ? 'May hold back ideas and share too late.' : '可能想得很多但表达得偏晚。')

  if (t.sn === 'N') parts.push(en ? 'May overlook details or execution constraints.' : '可能忽略细节或落地约束。')
  else parts.push(en ? 'May miss the bigger picture or long-term implications.' : '可能忽略更大的图景或长期影响。')

  if (t.tf === 'T') parts.push(en ? 'May sound blunt when aiming for clarity.' : '追求清晰时可能显得过于直接。')
  else parts.push(en ? 'May avoid conflict and delay hard decisions.' : '可能回避冲突，推迟艰难决定。')

  if (t.jp === 'J') parts.push(en ? 'May get stressed when plans change.' : '计划变化时可能更容易压力上升。')
  else parts.push(en ? 'May procrastinate or struggle to close decisions.' : '可能拖延或不易收敛决策。')

  return parts.join(en ? ' ' : '；')
}

export function getPracticalTips(type: string, locale?: string): string {
  const t = parseType(type)
  const en = isEnglish(locale)
  if (!t) return en ? 'Try to balance clarity, empathy, and follow-through.' : '尝试在清晰、共情与执行之间找到平衡。'

  const parts: string[] = []
  parts.push(
    t.ei === 'E'
      ? en
        ? 'Pause briefly before responding; summarize your point in one sentence.'
        : '回应前先停一拍，用一句话总结你的核心观点。'
      : en
        ? 'Prepare a short “headline” first; share earlier instead of waiting for perfection.'
        : '先准备一个“标题句”，别等到完美才开口。'
  )
  parts.push(
    t.sn === 'S'
      ? en
        ? 'Add one “why it matters” statement to connect actions to meaning.'
        : '补充一句“为什么重要”，把行动与意义连接起来。'
      : en
        ? 'Add one concrete example and a clear next step to ground ideas.'
        : '补充一个具体例子和明确下一步，让想法更落地。'
  )
  parts.push(
    t.tf === 'T'
      ? en
        ? 'Name feelings explicitly when needed; ask how others are impacted.'
        : '需要时直接点出感受，并问一句“对你有什么影响”。'
      : en
        ? 'State your reasoning and constraints; separate empathy from decision criteria.'
        : '把理由与约束讲清楚，并把共情与决策标准分开。'
  )
  parts.push(
    t.jp === 'J'
      ? en
        ? 'Leave a small buffer for changes; agree on a review checkpoint.'
        : '预留一点变更缓冲，并约定复盘检查点。'
      : en
        ? 'Timebox exploration; end meetings with a clear decision owner and deadline.'
        : '给探索设定时间盒，会议最后明确负责人和截止时间。'
  )
  return parts.join(en ? ' ' : '；')
}

export interface HistoryEntry {
  id: string
  createdAt: number
  testMode?: string
  result: MbtiResult
  profile?: UserProfile | null
}

export { RESULT_KEY, ANSWERS_KEY, HISTORY_KEY, COMPARE_KEY }
