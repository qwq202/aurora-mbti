import { NextRequest, NextResponse } from 'next/server'

// 超快速生成少量题目（35道以内）
export async function POST(request: NextRequest) {
  try {
    const { profileData, questionCount = 15 } = await request.json()
    
    // 限制快速模式的数量，支持30道题
    const actualCount = Math.min(questionCount, 35)
    
    console.log(`快速生成模式：${actualCount}道题目`)
    
    const prompt = `根据用户资料快速生成${actualCount}道MBTI题目：

用户：${profileData.age}岁${profileData.gender}，${profileData.occupation}
兴趣：${profileData.interests || '通用'}

要求：
1. 生成${actualCount}道题目
2. 平均分布到4个维度(E/I, S/N, T/F, J/P)
3. 题目简洁实用

JSON格式：
{
  "questions": [
    {"text": "在团队讨论时，我更愿意先听后说", "dimension": "EI", "agree": "I", "id": "ai_1"},
    {"text": "我更关注具体的事实而非抽象概念", "dimension": "SN", "agree": "S", "id": "ai_2"}
  ]
}

注意：
- dimension必须是EI/SN/TF/JP之一
- agree必须是对应维度的字母(E或I, S或N, T或F, J或P)
- 每题必须有唯一的id
- 只返回JSON，无需其他说明。`

    // 设置较短的超时时间
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
    
    try {
      const response = await fetch(process.env.OPENAI_API_URL + '/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: '你是MBTI专家。请快速生成简洁的测试题目，只返回JSON格式。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9,
          max_tokens: 2000,
          // 根据模型类型调整参数
          ...(process.env.OPENAI_MODEL?.includes('kimi') || process.env.OPENAI_MODEL?.includes('moonshot') ? {
            // Kimi 专用参数 - 保持简单
          } : {
            // OpenAI 标准参数
            top_p: 0.9
          })
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`AI API错误: ${response.status}`)
      }
      
      const data = await response.json()
      const content = data.choices[0].message.content.trim()
      
      // 解析JSON
      let result
      try {
        const cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        result = JSON.parse(cleanContent)
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('JSON解析失败')
        }
      }
      
      const questions = result.questions || []
      console.log(`快速生成成功：${questions.length}道题目`)
      
      // 如果生成不够，用模板补充
      if (questions.length < actualCount) {
        const needed = actualCount - questions.length
        const fallbackQuestions = generateQuickFallback(needed, profileData)
        questions.push(...fallbackQuestions)
      }
      
      return NextResponse.json({
        success: true,
        questions: questions.slice(0, actualCount),
        message: `快速生成完成，共${Math.min(questions.length, actualCount)}道题目`
      })
      
    } catch (error: any) {
      console.error('快速生成失败，使用降级方案:', error.message)
      
      // 降级方案：直接返回模板题目
      const fallbackQuestions = generateQuickFallback(actualCount, profileData)
      
      return NextResponse.json({
        success: true,
        questions: fallbackQuestions,
        message: `使用智能模板生成了${fallbackQuestions.length}道题目`,
        fallback: true
      })
    }
    
  } catch (error: any) {
    console.error('快速生成API错误:', error)
    return NextResponse.json(
      { error: '快速生成失败: ' + error.message },
      { status: 500 }
    )
  }
}

// 快速降级题目生成
function generateQuickFallback(count: number, profileData: any): any[] {
  const isWorking = profileData.occupation && !profileData.occupation.includes('学生')
  const age = profileData.age
  const interests = (profileData.interests || '').toLowerCase()
  
  const templates = {
    'EI': [
      { text: '在团队会议中，我通常会主动发言分享想法', dimension: 'EI', agree: 'E' },
      { text: '工作间隙，我更倾向于独自思考而非闲聊', dimension: 'EI', agree: 'I' },
      { text: '参加社交活动让我感到精力充沛', dimension: 'EI', agree: 'E' },
      { text: '长时间与人交往后，我需要独处恢复状态', dimension: 'EI', agree: 'I' },
      { text: '我倾向于在群体中表达自己的观点', dimension: 'EI', agree: 'E' },
      { text: '我更喜欢通过书面方式表达复杂想法', dimension: 'EI', agree: 'I' },
      { text: '陌生环境中我能较快融入并建立联系', dimension: 'EI', agree: 'E' },
      { text: '我需要充分思考后才会开口发言', dimension: 'EI', agree: 'I' }
    ],
    'SN': [
      { text: '制定计划时，我更关注具体的执行步骤', dimension: 'SN', agree: 'S' },
      { text: '我经常会想象事物的各种可能性', dimension: 'SN', agree: 'N' },
      { text: '我倾向于信任经过验证的方法', dimension: 'SN', agree: 'S' },
      { text: '我喜欢探索创新的解决方案', dimension: 'SN', agree: 'N' },
      { text: '我更关注当前现实情况而非未来愿景', dimension: 'SN', agree: 'S' },
      { text: '我经常思考事物背后的深层含义', dimension: 'SN', agree: 'N' },
      { text: '我偏好处理具体的实际问题', dimension: 'SN', agree: 'S' },
      { text: '我喜欢探讨理论和抽象概念', dimension: 'SN', agree: 'N' }
    ],
    'TF': [
      { text: '做重要决定时，我主要考虑逻辑和效率', dimension: 'TF', agree: 'T' },
      { text: '我会优先考虑决定对他人感受的影响', dimension: 'TF', agree: 'F' },
      { text: '批评别人时，我注重事实的准确性', dimension: 'TF', agree: 'T' },
      { text: '表达不同意见时，我会考虑对方的感受', dimension: 'TF', agree: 'F' },
      { text: '我认为公正比和谐更重要', dimension: 'TF', agree: 'T' },
      { text: '我倾向于从他人角度考虑问题', dimension: 'TF', agree: 'F' },
      { text: '分析问题时我更依赖客观数据', dimension: 'TF', agree: 'T' },
      { text: '我重视团队氛围和人际关系', dimension: 'TF', agree: 'F' }
    ],
    'JP': [
      { text: '我喜欢提前安排好事情的时间表', dimension: 'JP', agree: 'J' },
      { text: '我更喜欢灵活处理，保持选择的开放性', dimension: 'JP', agree: 'P' },
      { text: '完成任务的截止时间对我很重要', dimension: 'JP', agree: 'J' },
      { text: '我能很好地应对计划的临时变更', dimension: 'JP', agree: 'P' },
      { text: '我倾向于快速做出决定并执行', dimension: 'JP', agree: 'J' },
      { text: '我喜欢保留多种选择直到最后时刻', dimension: 'JP', agree: 'P' },
      { text: '有序的工作环境让我更高效', dimension: 'JP', agree: 'J' },
      { text: '我在压力下能够灵活调整策略', dimension: 'JP', agree: 'P' }
    ]
  }
  
  // 根据用户特征调整题目
  if (isWorking) {
    templates.EI.push({ text: '在工作场所，我更容易与同事建立联系', dimension: 'EI', agree: 'E' })
    templates.TF.push({ text: '工作决策时，我优先考虑团队效率', dimension: 'TF', agree: 'T' })
  }
  
  if (interests.includes('技术') || interests.includes('编程')) {
    templates.SN.push({ text: '学习新技术时，我喜欢先理解底层原理', dimension: 'SN', agree: 'N' })
    templates.TF.push({ text: '技术方案选择上，我更看重客观性能指标', dimension: 'TF', agree: 'T' })
  }
  
  const questions: any[] = []
  const dimensions = ['EI', 'SN', 'TF', 'JP']
  const perDimension = Math.ceil(count / 4)
  
  dimensions.forEach(dim => {
    const dimTemplates = templates[dim as keyof typeof templates]
    for (let i = 0; i < perDimension && questions.length < count; i++) {
      const template = dimTemplates[i % dimTemplates.length]
      questions.push({
        ...template,
        id: `quick_${dim}_${i + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      })
    }
  })
  
  console.log(`降级生成 ${questions.length} 道题目，目标 ${count} 道`)
  return questions.slice(0, count)
}