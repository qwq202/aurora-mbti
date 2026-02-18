import { type MbtiResult, type UserProfile } from './mbti-types'
import { RESULT_KEY, ANSWERS_KEY, HISTORY_KEY, COMPARE_KEY } from './constants'

function getLocaleKind(locale?: string): 'zh' | 'en' | 'ja' {
  if (locale?.startsWith('ja')) return 'ja'
  if (locale === 'en') return 'en'
  return 'zh'
}

function pick(locale: 'zh' | 'en' | 'ja', zh: string, en: string, ja: string) {
  if (locale === 'en') return en
  if (locale === 'ja') return ja
  return zh
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
  const l = getLocaleKind(locale)
  if (!t) return pick(l, '因人而异，也会受情境影响。', 'Varies by person and context.', '人や状況によって異なります。')

  const parts: string[] = []
  parts.push(
    t.ei === 'E'
      ? pick(l, '更适合协作多、反馈快的环境。', 'You tend to thrive in collaborative, fast-feedback environments.', '協働が多く、フィードバックが速い環境で力を発揮しやすいです。')
      : pick(l, '更适合自主度高、深度专注、少打扰的环境。', 'You tend to thrive with autonomy, deep-focus time, and fewer interruptions.', '自律性が高く、深く集中でき、割り込みが少ない環境で力を発揮しやすいです。')
  )
  parts.push(
    t.sn === 'S'
      ? pick(l, '目标清晰、任务具体、进展可见会让你更有动力。', 'Clear goals, concrete tasks, and visible progress keep you energized.', '目標が明確で、タスクが具体的で、進捗が見えるとモチベーションが上がります。')
      : pick(l, '有探索空间、能做策略与长期思考会让你更投入。', 'Space for exploration, strategy, and long-term thinking keeps you engaged.', '探索の余地があり、戦略や長期思考ができる環境でより没頭できます。')
  )
  parts.push(
    t.jp === 'J'
      ? pick(l, '通常偏好明确流程和可预期的节奏。', 'You usually prefer defined processes and predictable timelines.', '明確なプロセスと予測可能なスケジュールを好む傾向があります。')
      : pick(l, '通常偏好灵活迭代、随时调整计划。', 'You usually prefer flexibility, iteration, and room to adjust plans.', '柔軟に反復し、計画を調整できる余地を好む傾向があります。')
  )
  return parts.join(l === 'en' ? ' ' : '；')
}

export function getCommunicationStyle(type: string, locale?: string): string {
  const t = parseType(type)
  const l = getLocaleKind(locale)
  if (!t) return pick(l, '沟通风格会因人和情境而变化。', 'Your communication style varies by person and situation.', 'コミュニケーションスタイルは人や状況によって変わります。')

  const parts: string[] = []
  parts.push(
    t.ei === 'E'
      ? pick(l, '更常“边聊边想”，从讨论中获得能量。', 'You often think out loud and gain energy from discussion.', '「話しながら考える」傾向があり、対話からエネルギーを得やすいです。')
      : pick(l, '更常“先想后说”，更偏好小范围或一对一沟通。', 'You often think first, then speak, and prefer smaller-group conversations.', '「まず考えてから話す」傾向があり、少人数や1対1の会話を好みます。')
  )
  parts.push(
    t.sn === 'S'
      ? pick(l, '偏好具体例子、细节信息和“下一步怎么做”。', 'You like concrete examples, specifics, and what can be done next.', '具体例・詳細・次に何をするかといった実践的な話を好みます。')
      : pick(l, '偏好概念与关联，喜欢讨论可能性与方向感。', 'You like concepts, patterns, and exploring possibilities and direction.', '概念やパターン、可能性や方向性の議論を好みます。')
  )
  parts.push(
    t.tf === 'T'
      ? pick(l, '更直接、以逻辑为先，关注结论与取舍。', 'You tend to be direct and logic-first, focusing on conclusions and trade-offs.', '論理優先で率直に話し、結論やトレードオフを重視します。')
      : pick(l, '更温和、注重感受与关系氛围。', 'You tend to be warm and people-aware, focusing on feelings and relationship harmony.', '温かく相手に配慮した伝え方で、感情や関係の調和を重視します。')
  )
  parts.push(
    t.jp === 'J'
      ? pick(l, '偏好有结构的沟通，喜欢明确结论与跟进。', 'You prefer structured conversations with clear decisions and follow-ups.', '構造化された会話を好み、明確な結論とフォローアップを重視します。')
      : pick(l, '偏好开放式沟通，给迭代与变化留空间。', 'You prefer open-ended conversations that leave room for iteration and change.', '反復や変更の余地を残す、オープンな会話を好みます。')
  )
  return parts.join(l === 'en' ? ' ' : '；')
}

export function getPotentialChallenges(type: string, locale?: string): string {
  const t = parseType(type)
  const l = getLocaleKind(locale)
  if (!t) return pick(l, '取决于你的情境与习惯。', 'It depends on your context and habits.', 'あなたの状況や習慣によって異なります。')

  const parts: string[] = []
  if (t.ei === 'E') parts.push(pick(l, '可能在想清楚前就先说出口。', 'May speak too quickly before fully thinking through.', '十分に考える前に話し始めてしまうことがあります。'))
  else parts.push(pick(l, '可能想得很多但表达得偏晚。', 'May hold back ideas and share too late.', '考えすぎて共有のタイミングが遅れることがあります。'))

  if (t.sn === 'N') parts.push(pick(l, '可能忽略细节或落地约束。', 'May overlook details or execution constraints.', '細部や実行上の制約を見落とすことがあります。'))
  else parts.push(pick(l, '可能忽略更大的图景或长期影响。', 'May miss the bigger picture or long-term implications.', '全体像や長期的な影響を見落とすことがあります。'))

  if (t.tf === 'T') parts.push(pick(l, '追求清晰时可能显得过于直接。', 'May sound blunt when aiming for clarity.', '明確さを重視するあまり、きつく聞こえることがあります。'))
  else parts.push(pick(l, '可能回避冲突，推迟艰难决定。', 'May avoid conflict and delay hard decisions.', '衝突を避けることで、難しい判断が遅れることがあります。'))

  if (t.jp === 'J') parts.push(pick(l, '计划变化时可能更容易压力上升。', 'May get stressed when plans change.', '計画変更時にストレスを感じやすいです。'))
  else parts.push(pick(l, '可能拖延或不易收敛决策。', 'May procrastinate or struggle to close decisions.', '先延ばししたり、意思決定を収束しにくいことがあります。'))

  return parts.join(l === 'en' ? ' ' : '；')
}

export function getPracticalTips(type: string, locale?: string): string {
  const t = parseType(type)
  const l = getLocaleKind(locale)
  if (!t) return pick(l, '尝试在清晰、共情与执行之间找到平衡。', 'Try to balance clarity, empathy, and follow-through.', '明確さ・共感・実行のバランスを意識してみてください。')

  const parts: string[] = []
  parts.push(
    t.ei === 'E'
      ? pick(l, '回应前先停一拍，用一句话总结你的核心观点。', 'Pause briefly before responding; summarize your point in one sentence.', '返答前に一呼吸おき、要点を一文でまとめてから話しましょう。')
      : pick(l, '先准备一个“标题句”，别等到完美才开口。', 'Prepare a short “headline” first; share earlier instead of waiting for perfection.', '先に短い「見出し文」を用意し、完璧を待たず早めに共有しましょう。')
  )
  parts.push(
    t.sn === 'S'
      ? pick(l, '补充一句“为什么重要”，把行动与意义连接起来。', 'Add one “why it matters” statement to connect actions to meaning.', '「なぜ重要か」を一言加え、行動と意味をつなげましょう。')
      : pick(l, '补充一个具体例子和明确下一步，让想法更落地。', 'Add one concrete example and a clear next step to ground ideas.', '具体例と次の一歩を加えて、アイデアを実行しやすくしましょう。')
  )
  parts.push(
    t.tf === 'T'
      ? pick(l, '需要时直接点出感受，并问一句“对你有什么影响”。', 'Name feelings explicitly when needed; ask how others are impacted.', '必要に応じて感情を言語化し、「相手にどう影響するか」を確認しましょう。')
      : pick(l, '把理由与约束讲清楚，并把共情与决策标准分开。', 'State your reasoning and constraints; separate empathy from decision criteria.', '理由と制約を明確にし、共感と判断基準を切り分けて伝えましょう。')
  )
  parts.push(
    t.jp === 'J'
      ? pick(l, '预留一点变更缓冲，并约定复盘检查点。', 'Leave a small buffer for changes; agree on a review checkpoint.', '変更に備えたバッファを確保し、見直しチェックポイントを設定しましょう。')
      : pick(l, '给探索设定时间盒，会议最后明确负责人和截止时间。', 'Timebox exploration; end meetings with a clear decision owner and deadline.', '探索には時間枠を設け、会議の最後に担当者と期限を明確にしましょう。')
  )
  return parts.join(l === 'en' ? ' ' : '；')
}

export interface HistoryEntry {
  id: string
  createdAt: number
  testMode?: string
  result: MbtiResult
  profile?: UserProfile | null
}

export { RESULT_KEY, ANSWERS_KEY, HISTORY_KEY, COMPARE_KEY }
