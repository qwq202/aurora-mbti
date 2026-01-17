import type { MbtiCelebrities, MbtiTypeGroup, MbtiTypeInfo } from './mbti-types'

export const TYPE_INFO: Record<string, MbtiTypeInfo> = {
  INTJ: { name: "建筑师", blurb: "富有想象力和战略性的思想家，一切皆在计划之中。", vibe: "睿智 | 独立 | 坚定", gradient: "from-fuchsia-500 to-emerald-500", strengths: ["逻辑分析", "战略眼光", "独立性强"], growth: ["情感表达", "灵活性", "团队协作"] },
  INTP: { name: "逻辑学家", blurb: "具有创造力的发明家，对知识有着止不住的渴望。", vibe: "好奇 | 客观 | 独特", gradient: "from-violet-500 to-rose-500", strengths: ["抽象思维", "创新能力", "客观分析"], growth: ["执行力", "情感理解", "日常琐事"] },
  ENTJ: { name: "指挥官", blurb: "大胆、富有想象力且意志强大的领导者，总能找到或创造出一条路。", vibe: "领导力 | 果断 | 远见", gradient: "from-rose-500 to-amber-500", strengths: ["组织能力", "果断决策", "目标导向"], growth: ["耐心", "同理心", "情绪控制"] },
  ENTP: { name: "辩论家", blurb: "聪明好奇的思想者，无法抗拒智力挑战。", vibe: "敏捷 | 创新 | 敢于挑战", gradient: "from-amber-500 to-fuchsia-500", strengths: ["头脑风暴", "应变能力", "知识渊博"], growth: ["专注度", "细节管理", "尊重传统"] },
  INFJ: { name: "提倡者", blurb: "安静而神秘，同时也是鼓舞人心且不倦的理想主义者。", vibe: "洞察力 | 同情心 | 坚定信念", gradient: "from-emerald-500 to-fuchsia-500", strengths: ["同理心", "深刻洞见", "道德感强"], growth: ["自我保护", "处理冲突", "现实感"] },
  INFP: { name: "调解员", blurb: "诗意、善良且利他主义的人，总是渴望帮助他人。", vibe: "纯粹 | 理想主义 | 敏感", gradient: "from-rose-500 to-emerald-500", strengths: ["创造力", "价值观驱动", "同情心"], growth: ["实践能力", "抗压性", "客观判断"] },
  ENFJ: { name: "主人公", blurb: "富有魅力且鼓舞人心的领导者，能够让听众听得如痴如醉。", vibe: "影响力 | 热情 | 利他", gradient: "from-fuchsia-500 to-amber-500", strengths: ["沟通能力", "鼓舞人心", "社交技巧"], growth: ["过度牺牲", "过度敏感", "独处"] },
  ENFP: { name: "竞选者", blurb: "充满热情、创造力及社交能力的自由灵魂，总能找到理由微笑。", vibe: "活力 | 乐观 | 想象力", gradient: "from-amber-500 to-violet-500", strengths: ["人际交往", "创新思维", "适应性强"], growth: ["持久力", "细节关注", "压力管理"] },
  ISTJ: { name: "物流师", blurb: "务实且注重事实的人，可靠性不容怀疑。", vibe: "可靠 | 稳重 | 尽职", gradient: "from-emerald-600 to-amber-500", strengths: ["责任感", "组织纪律", "注重细节"], growth: ["创新思维", "接纳变化", "情感沟通"] },
  ISFJ: { name: "守卫者", blurb: "非常专注而温暖的守护者，时刻准备着保护爱的人。", vibe: "温柔 | 忠诚 | 细致", gradient: "from-emerald-500 to-rose-500", strengths: ["忠诚度", "照顾他人", "观察力"], growth: ["自我表达", "拒绝他人", "适应新事物"] },
  ESTJ: { name: "总经理", blurb: "出色的管理者，在管理事物或人方面无人能及。", vibe: "秩序 | 效率 | 务实", gradient: "from-amber-600 to-rose-500", strengths: ["组织能力", "领导才能", "诚实可靠"], growth: ["灵活性", "同理心", "听取意见"] },
  ESFJ: { name: "执政官", blurb: "极具同情心、社交能力和乐于助人的人，总是热衷于提供帮助。", vibe: "友善 | 负责 | 合群", gradient: "from-rose-500 to-amber-500", strengths: ["人际关系", "服务精神", "执行力"], growth: ["独立思考", "处理冲突", "过度操劳"] },
  ISTP: { name: "鉴赏家", blurb: "大胆而实际的实验家，擅长使用各类工具。", vibe: "机巧 | 务实 | 独立", gradient: "from-emerald-500 to-violet-600", strengths: ["动手能力", "冷静观察", "问题解决"], growth: ["长期规划", "情感交流", "持续性"] },
  ISFP: { name: "探险家", blurb: "灵活而有魅力的艺术家，时刻准备着探索和体验新鲜事物。", vibe: "艺术感 | 敏感 | 自由", gradient: "from-rose-500 to-emerald-500", strengths: ["审美观", "包容心", "热爱生活"], growth: ["规划能力", "抗压性", "逻辑思考"] },
  ESTP: { name: "企业家", blurb: "聪明、精力充沛且极具洞察力的人，真正享受生活在边缘带来的刺激。", vibe: "大胆 | 敏捷 | 现实", gradient: "from-amber-500 to-fuchsia-500", strengths: ["行动力", "应变能力", "社交魅力"], growth: ["深思熟虑", "遵循规则", "长期承诺"] },
  ESFP: { name: "表演者", blurb: "自发的、精力充沛而热情的表演者——生活在他们周围永不枯燥。", vibe: "乐观 | 魅力 | 活泼", gradient: "from-rose-500 to-amber-500", strengths: ["表现力", "人际吸引", "热爱当下"], growth: ["专注度", "规划未来", "客观判断"] },
}

export const UNKNOWN_TYPE: MbtiTypeInfo = {
  name: "未知类型",
  blurb: "这是一个未定义的MBTI类型组合。",
  vibe: "神秘 | 独特 | 未知",
  gradient: "from-fuchsia-500 to-rose-500",
  strengths: ["需要数据", "需要数据", "需要数据"],
  growth: ["需要数据", "需要数据", "需要数据"],
}

export const TYPE_GROUPS: MbtiTypeGroup[] = [
  {
    title: "理性者",
    code: "NT",
    description: "富有策略、好奇心强、重视客观和逻辑。他们是天生的思想家和领导者。",
    types: ["INTJ", "INTP", "ENTJ", "ENTP"],
  },
  {
    title: "理想主义者",
    code: "NF",
    description: "充满同情心、追求意义、重视个人成长。他们是深刻的洞察者和鼓舞人心的人。",
    types: ["INFJ", "INFP", "ENFJ", "ENFP"],
  },
  {
    title: "守护者",
    code: "SJ",
    description: "务实、稳重、重视秩序和传统。他们是社会的基石，可靠的执行者。",
    types: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  },
  {
    title: "探险家",
    code: "SP",
    description: "灵活、自发、重视感官体验。他们是行动派，擅长应对突发状况和享受生活。",
    types: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
]

export const CELEBRITIES: MbtiCelebrities = {
  INTJ: ["埃隆·马斯克", "尼采", "米歇尔·奥巴马", "克里斯托弗·诺兰"],
  INTP: ["艾尔伯特·爱因斯坦", "比尔·盖茨", "艾萨克·牛顿", "勒内·笛卡尔"],
  ENTJ: ["史蒂夫·乔布斯", "戈登·拉姆齐", "玛格丽特·撒切尔", "富兰克林·罗斯福"],
  ENTP: ["托马斯·爱迪生", "莱昂纳多·达·芬奇", "萨尔瓦多·达利", "小罗伯特·唐尼"],
  INFJ: ["柏拉图", "纳尔逊·曼德拉", "马丁·路德·金", "歌德"],
  INFP: ["J·K·罗琳", "威廉·莎士比亚", "文森特·梵高", "约翰·列侬"],
  ENFJ: ["巴拉克·奥巴马", "奥普拉·温弗瑞", "马龙·白兰度", "玛雅·安杰卢"],
  ENFP: ["罗宾·威廉姆斯", "沃尔特·迪士尼", "昆汀·塔伦蒂诺", "艾伦·德杰尼勒斯"],
  ISTJ: ["安格拉·默克尔", "乔治·华盛顿", "杰夫·贝佐斯", "娜塔莉·波特曼"],
  ISFJ: ["维多利亚女王", "伊丽莎白二世", "碧昂丝", "凯特·米德尔顿"],
  ESTJ: ["约翰·D·洛克菲勒", "詹姆斯·门罗", "朱迪·谢林德林", "康多莉扎·赖斯"],
  ESFJ: ["泰勒·斯威夫特", "比尔·克林顿", "詹妮弗·加纳", "史蒂夫·哈维"],
  ISTP: ["奥黛丽·赫本", "史蒂夫·麦奎因", "汤姆·克鲁斯", "迈克尔·乔丹"],
  ISFP: ["拉娜·德雷", "弗里达·卡罗", "迈克尔·杰克逊", "布兰妮·斯皮尔斯"],
  ESTP: ["唐纳德·特朗普", "麦当娜", "欧内斯特·海明威", "李小龙"],
  ESFP: ["玛丽莲·梦露", "阿黛尔", "贾斯汀·比伯", "赛琳娜·戈麦斯"],
}
