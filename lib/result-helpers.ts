// 结果页面辅助函数模块

export function getWorkEnvironment(type: string): string {
  const environments: Record<string, string> = {
    INTJ: "独立思考空间，长期项目规划，最小化不必要会议",
    INTP: "灵活自由的研究环境，允许深度探索，鼓励创新实验",
    ENTJ: "目标明确的领导岗位，快节奏决策环境，资源充足的团队",
    ENTP: "多样化挑战，头脑风暴文化，变化丰富的项目内容",
    INFJ: "价值导向的组织，一对一深度协作，有意义的工作内容",
    INFP: "创意表达空间，价值观契合，灵活的工作方式",
    ENFJ: "团队协作环境，人员发展机会，正面影响他人的平台",
    ENFP: "多元化团队，创意项目，人际互动丰富的环境",
    ISTJ: "稳定有序的流程，明确的角色职责，可预期的工作节奏",
    ISFJ: "支持型团队角色，和谐的人际关系，服务导向的文化",
    ESTJ: "结构化管理岗位，效率驱动环境，清晰的组织层级",
    ESFJ: "团队协调角色，人际关系重要，温暖的组织文化",
    ISTP: "动手实践机会，技术导向环境，独立解决问题的空间",
    ISFP: "创意表达自由，价值观包容，低压力的协作环境",
    ESTP: "快节奏行动环境，实际问题解决，多样化的挑战",
    ESFP: "活跃的团队氛围，人际互动频繁，正能量的工作文化"
  }
  return environments[type] || "多元化环境，发挥个人特长"
}

export function getCommunicationStyle(type: string): string {
  const styles: Record<string, string> = {
    INTJ: "偏好简洁高效的沟通，喜欢事先准备，重视深度而非频率",
    INTP: "享受概念探讨，需要时间整理思路，欣赏逻辑清晰的对话",
    ENTJ: "直接明确的表达，快速决策导向，善于激励他人行动",
    ENTP: "思维跳跃式交流，喜欢辩论探讨，能够快速适应话题变化",
    INFJ: "一对一深度交流，重视情感共鸣，需要安全的表达环境",
    INFP: "真诚温和的沟通，重视个人价值观，需要被理解和接纳",
    ENFJ: "善于倾听他人，富有感染力，能够营造温暖的交流氛围",
    ENFP: "热情开放的交流，善于连接不同观点，喜欢启发性对话",
    ISTJ: "实事求是的表达，喜欢有条理的讨论，重视可靠的信息",
    ISFJ: "温和体贴的沟通，善于察觉他人需求，避免冲突和争执",
    ESTJ: "条理分明的表达，重视效率和结果，善于组织和协调",
    ESFJ: "温暖友好的交流，关注他人感受，善于维护团队和谐",
    ISTP: "简洁实用的表达，重视行动胜过言语，偏好一对一交流",
    ISFP: "温和包容的沟通，重视个人空间，通过行动表达关怀",
    ESTP: "直接活跃的交流，善于现场应对，喜欢实际的讨论内容",
    ESFP: "活泼热情的表达，善于调节气氛，重视积极的互动体验"
  }
  return styles[type] || "独特的沟通风格，善于表达个人观点"
}

export function getPotentialChallenges(type: string): string {
  const challenges: Record<string, string> = {
    INTJ: "可能过于关注长远而忽略当下细节，有时显得不够灵活或难以妥协",
    INTP: "容易陷入分析瘫痪，可能拖延决策或忽视实际执行",
    ENTJ: "可能过于强势推进，忽略他人感受或细节考虑",
    ENTP: "容易分散注意力，可能缺乏持续性和深度聚焦",
    INFJ: "可能过度理想化，容易感到疲惫或承担过多责任",
    INFP: "可能过于敏感，在冲突面前容易退缩或纠结",
    ENFJ: "可能过度关注他人需求而忽略自己，容易感到负担过重",
    ENFP: "可能缺乏持续性，容易被新想法分散注意力",
    ISTJ: "可能过于依赖既定方式，在变化面前感到不适",
    ISFJ: "可能过度付出而忽视自己需求，难以拒绝他人",
    ESTJ: "可能过于注重效率而忽略人际关系的细腻处理",
    ESFJ: "可能过于在意他人评价，难以做出可能引起不满的决定",
    ISTP: "可能在长期规划方面较弱，沟通时过于简洁",
    ISFP: "可能在竞争环境中感到不适，难以主动推销自己",
    ESTP: "可能缺乏长远规划，在需要深度思考时感到不耐烦",
    ESFP: "可能难以处理批评，在压力下容易情绪化"
  }
  return challenges[type] || "每种性格类型都有其独特的挑战领域"
}

export function getPracticalTips(type: string): string {
  const tips: Record<string, string> = {
    INTJ: "设置定期回顾检查点，主动征求他人反馈，培养灵活应变能力",
    INTP: "设定明确的截止日期，找到思考与行动的平衡点，寻找志同道合的合作伙伴",
    ENTJ: "练习倾听技巧，留出时间考虑他人观点，培养耐心和共情能力",
    ENTP: "使用任务管理工具，设置优先级，定期回顾和聚焦核心目标",
    INFJ: "学会设置边界，定期独处恢复能量，将理想分解为可行的步骤",
    INFP: "练习表达不同意见，寻找支持性环境，将价值观转化为具体行动",
    ENFJ: "学会说不，定期自我关怀，建立个人支持网络",
    ENFP: "使用提醒工具保持专注，寻找变化与稳定的平衡，培养完成项目的习惯",
    ISTJ: "小步尝试新方法，寻找变化中的规律，与开放型伙伴合作",
    ISFJ: "练习表达个人需求，学会适度拒绝，定期评估自己的付出与回报",
    ESTJ: "留出时间处理人际关系，练习换位思考，培养包容不同工作风格的能力",
    ESFJ: "建立自信心，练习基于事实而非他人反应做决定，寻求建设性反馈",
    ISTP: "制定简单的长期计划，练习更详细的沟通，主动分享想法和进展",
    ISFP: "寻找适合的表达方式，在支持性环境中展示能力，培养自信心",
    ESTP: "使用简单的规划工具，培养反思习惯，寻找长远目标的即时收益",
    ESFP: "学习接受建设性批评，培养情绪管理技巧，建立稳定的支持系统"
  }
  return tips[type] || "持续学习和自我发展是每个人的成长之路"
}

export interface HistoryEntry {
  id: string
  createdAt: number
  testMode?: string
  result: any // MbtiResult type
  profile?: any // UserProfile type  
}

export const RESULT_KEY = "mbti_result_v1"
export const ANSWERS_KEY = "mbti_answers_v1"
export const HISTORY_KEY = "mbti_history_v1"
export const COMPARE_KEY = "mbti_compare_target_v1"