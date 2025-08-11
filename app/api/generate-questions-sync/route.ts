import { NextRequest, NextResponse } from 'next/server'

// 配置 API
const config = {
  apiUrl: process.env.OPENAI_API_URL || 'https://api.qunqin.org',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'moonshotai/kimi-k2:free'
}

// MBTI维度定义
const DIMENSIONS = {
  'EI': { name: '外向-内向', description: '能量来源：外部世界vs内心世界' },
  'SN': { name: '感觉-直觉', description: '信息获取：具体细节vs抽象概念' }, 
  'TF': { name: '思维-情感', description: '决策方式：逻辑分析vs价值判断' },
  'JP': { name: '判断-知觉', description: '生活方式：计划性vs灵活性' }
}

/**
 * 为特定维度生成题目
 */
async function generateQuestionsByDimension(profileData: any, dimension: string, questionCount: number, scenarios: string[]) {
  const dimensionInfo = DIMENSIONS[dimension as keyof typeof DIMENSIONS]
  
  const prompt = `请为以下用户生成${questionCount}道专门测试MBTI ${dimension}维度的题目。

用户资料：
${JSON.stringify(profileData, null, 2)}

维度要求：
- 维度：${dimension} (${dimensionInfo.name})
- 测试目标：${dimensionInfo.description}

生成要求：
1. 题目必须专门针对${dimension}维度设计，能有效区分该维度的偏好
2. 结合用户的职业、兴趣、年龄等个人背景，生成个性化题目
3. 每道题目包含：题目文本、选项A、选项B、维度标识${dimension}
4. 避免与其他维度题目重复，确保题目独特性
5. 返回JSON格式：{"questions": [{"text": "题目", "optionA": "选项A", "optionB": "选项B", "dimension": "${dimension}"}]}

情境参考（可选用）：${scenarios.slice(0, 3).join(', ')}`

  try {
    const response = await fetch(`${config.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的MBTI性格测试题目生成专家。请严格按照要求生成高质量的测试题目，确保返回格式正确的JSON。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`维度${dimension}生成失败: HTTP ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error(`维度${dimension}生成失败: 响应内容为空`)
    }

    // 解析JSON响应
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`维度${dimension}生成失败: 无法找到JSON格式`)
    }

    const result = JSON.parse(jsonMatch[0])
    const questions = result.questions || []

    // 验证题目格式
    const validQuestions = questions.filter((q: any) => 
      q.text && q.optionA && q.optionB && q.dimension
    )

    console.log(`维度${dimension}生成完成: ${validQuestions.length}/${questionCount}道题目`)
    return validQuestions.slice(0, questionCount)
    
  } catch (error) {
    console.error(`维度${dimension}生成出错:`, error)
    return []
  }
}

/**
 * 单次API调用生成所有题目
 */
async function generateAllQuestions(profileData: any, questionCount: number) {
  const startTime = Date.now()
  
  // 计算每个维度的题目数量，确保总数准确
  const basePerDimension = Math.floor(questionCount / 4)
  const remainder = questionCount % 4
  const dimensionCounts = [
    basePerDimension + (remainder > 0 ? 1 : 0), // EI
    basePerDimension + (remainder > 1 ? 1 : 0), // SN  
    basePerDimension + (remainder > 2 ? 1 : 0), // TF
    basePerDimension  // JP
  ]
  
  // 优化的自然生活化提示词 
  const prompt = `为${profileData.name || '用户'}(${profileData.age}岁,${profileData.occupation})生成${questionCount}道生活化个性测试题目。

用户的个人背景详情：
- 基本信息：${profileData.age}岁，${profileData.gender}，${profileData.occupation}
- 兴趣爱好：${profileData.interests || '未填写'}
- 学习情况：${profileData.academicStress || '未填写'}
- 社交偏好：${profileData.socialPreference || '未填写'}
- 感情状况：${profileData.relationshipStatus || '未填写'}

均匀覆盖4个维度：EI维度${dimensionCounts[0]}题，SN维度${dimensionCounts[1]}题，TF维度${dimensionCounts[2]}题，JP维度${dimensionCounts[3]}题。

核心要求：
1. **题目格式：必须是陈述句，不能是问句或选择题**
   - ✅ 正确："我更喜欢在休息时间独自看书"
   - ❌ 错误："你更喜欢看书还是聊天？"
   - 用户通过同意程度（强烈不同意-强烈同意）来回答
2. 题目必须非常自然，像在聊天中了解一个人的生活习惯和偏好
3. 绝对避免心理学术语，用日常语言描述具体场景
4. 每个题目都要基于用户的真实背景，不能生成与其身份不符的场景
5. 题目要简单直接，一句话说清楚，不要复杂的假设情况
6. 必须是真实可能发生的日常情况，不要虚构奇怪的场景
6. **重要：必须尊重用户的社交偏好**
   - 如果用户"喜欢独处"，避免生成需要主动社交的题目（如"我会主动指出同学错误"）
   - 如果用户"喜欢热闹"，可以生成更多团队协作、社交互动场景
   - 根据用户社交偏好调整题目的社交参与度
7. **关键：必须生成符合用户身份的真实场景**
   - 高中生：课堂学习、作业、考试、同学关系、课外活动等高中场景
   - 大学生：选课、社团、实习、宿舍生活、实验室等大学场景  
   - 职场人士：工作会议、项目合作、职场关系、技能培训等工作场景
   - 绝对不能给高中生生成"AI讲座"、"团队管理"等不符合身份的场景

优质题目示例（按社交偏好调整）：

**如果用户"喜欢独处、安静环境"：**
- EI维度："我更喜欢独自完成工作任务"（✓符合独处偏好）
- SN维度："学习时，我更关注教材上的具体细节"
- TF维度："我更倾向于通过文字而不是面谈来表达想法"
- JP维度："我喜欢把一天的学习计划提前安排好"

**如果用户"喜欢热闹、社交活跃"：**
- EI维度："我喜欢和同学一起讨论学习问题"（✓符合社交偏好）
- SN维度："小组讨论时，我更关注大家的整体想法"
- TF维度："朋友遇到困难时，我会主动提供帮助"
- JP维度："我喜欢和朋友临时决定周末的活动"

严格避免的题目类型：
✗ 过于复杂："如果计划旅行学习写代码，你会到达目的地以后再确定学习什么代码"
✗ 场景奇怪："在月球基地工作时..."
✗ 多重假设："假如你是老师，在雨天的教室里，面对不专心的学生..."
✗ 术语明显："我是一个逻辑思维型的人"
✗ 过于抽象："我更关注事物的本质"
✗ 不符合背景：给学生生成"管理团队时..."的题目

正确示例（简单自然）：
✓ "我在工作中更喜欢独立思考"
✓ "购物时，我会仔细比较不同商品"
✓ "和朋友聊天时，我更关心他们的感受"
✓ "我习惯提前制定周末的计划"

JSON格式：
{
  "questions": [
    {
      "text": "题目内容（陈述句）",
      "dimension": "EI|SN|TF|JP",
      "agree": "E|I|S|N|T|F|J|P",
      "contexts": ["work", "social", "personal", "academic", "general"],
      "ageGroups": ["young", "adult", "mature"],
      "workRelevant": true|false,
      "socialRelevant": true|false
    }
  ]
}

元数据说明：
- agree: 同意该陈述时倾向哪个字母（如同意"我喜欢独处"倾向I）
- contexts: 题目适用场景（work工作/social社交/personal个人/academic学术/general通用）
- ageGroups: 适用年龄段（young青年18-25/adult成年26-40/mature成熟40+）
- workRelevant: 是否与工作学习相关
- socialRelevant: 是否与社交互动相关

要求：
1. 严格按照维度数量生成，总数必须是${questionCount}题
2. 题目要自然隐蔽，不暴露测试意图
3. 结合用户的年龄和职业背景设计相关场景
4. 直接返回JSON，无需解释`

  try {
    console.log(`开始单次生成${questionCount}道题目...`)
    
    const response = await fetch(`${config.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'MBTI题目生成专家。返回标准JSON格式，无需解释。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: questionCount * 100 + 500, // 根据题目数量动态调整token限制
      }),
    })

    if (!response.ok) {
      throw new Error(`生成失败: HTTP ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('生成失败: 响应内容为空')
    }

    // 解析JSON响应
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('生成失败: 无法找到JSON格式')
    }

    const result = JSON.parse(jsonMatch[0])
    const questions = result.questions || []

    // 验证题目格式并分配唯一ID
    const validQuestions = questions.filter((q: any) => 
      q.text && q.dimension && q.text.trim().length > 0
    ).map((q: any, index: number) => ({
      ...q,
      id: `ai_q_${Date.now()}_${index}` // 为每个AI题目分配唯一ID
    }))

    console.log('AI题目ID分配:', validQuestions.slice(0, 3).map((q: any) => ({ id: q.id, text: q.text?.substring(0, 30) })))

    // 验证生成数量是否符合要求
    if (validQuestions.length !== questionCount) {
      console.warn(`警告：生成题目数量不足！要求${questionCount}题，实际${validQuestions.length}题`)
      
      // 如果数量不足超过10%，则抛出错误要求重新生成
      const shortage = questionCount - validQuestions.length
      if (shortage > Math.ceil(questionCount * 0.1)) {
        throw new Error(`题目数量严重不足：要求${questionCount}题，实际${validQuestions.length}题，缺少${shortage}题`)
      }
      
      // 如果只是少数几题，通过复制现有题目并修改来补充
      console.log(`补充缺少的${shortage}题...`)
      while (validQuestions.length < questionCount) {
        const randomIndex = Math.floor(Math.random() * validQuestions.length)
        const templateQuestion = validQuestions[randomIndex]
        const newQuestion = {
          ...templateQuestion,
          id: `ai_q_${Date.now()}_supplement_${validQuestions.length}`,
          text: templateQuestion.text + "（补充）"
        }
        validQuestions.push(newQuestion)
      }
    }

    // 随机打乱题目顺序
    for (let i = validQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validQuestions[i], validQuestions[j]] = [validQuestions[j], validQuestions[i]]
    }
    
    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)
    
    // 统计维度分布
    const dimensionStats = Object.keys(DIMENSIONS).map(dim => ({
      dimension: dim,
      count: validQuestions.filter((q: any) => q.dimension === dim).length
    }))
    
    console.log(`单次生成完成! 总题目：${validQuestions.length}道，耗时：${duration}秒`)
    console.log('维度分布:', dimensionStats.map(s => `${s.dimension}:${s.count}`).join(', '))
    
    return {
      questions: validQuestions,
      totalTime: `${duration}秒`,
      dimensionStats
    }
    
  } catch (error) {
    console.error('单次生成失败:', error)
    throw error
  }
}

// POST: 同步并发生成题目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileData, questionCount } = body
    
    if (!profileData || !questionCount) {
      return NextResponse.json(
        { error: '缺少必要参数: profileData, questionCount' },
        { status: 400 }
      )
    }
    
    if (!config.apiKey) {
      return NextResponse.json(
        { error: '未配置 OpenAI API Key' },
        { status: 500 }
      )
    }
    
    console.log(`开始同步并发生成 ${questionCount} 道题目...`)
    
    // 直接同步生成并返回结果
    const result = await generateAllQuestions(profileData, questionCount)
    
    return NextResponse.json({
      success: true,
      questions: result.questions,
      totalTime: result.totalTime,
      dimensionStats: result.dimensionStats,
      message: `成功生成${result.questions.length}道个性化题目`
    })
    
  } catch (error: any) {
    console.error('同步生成失败:', error)
    return NextResponse.json(
      { error: '生成失败: ' + error.message },
      { status: 500 }
    )
  }
}

// GET: 健康检查
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: '同步并发生成API正常运行',
    config: {
      apiUrl: config.apiUrl,
      model: config.model,
      hasApiKey: !!config.apiKey
    }
  })
}
