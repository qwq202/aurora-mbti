import { NextRequest, NextResponse } from 'next/server'

// 一次性批量生成题目API（优化版）
export async function POST(request: NextRequest) {
  try {
    const { profileData, questionCount = 30 } = await request.json()
    
    console.log(`批量生成模式：一次性生成${questionCount}道题目`)
    
    // 优化的prompt - 简洁明确，提高生成速度
    const prompt = `生成${questionCount}道MBTI个性化测试题目。

用户资料：${profileData.age}岁，${profileData.occupation}，兴趣：${profileData.interests || '通用'}

要求：
1. 严格生成${questionCount}道题目
2. 每个维度(EI/SN/TF/JP)平均分配
3. 题目个性化，贴合用户背景
4. 返回完整JSON，无额外文字

JSON格式：
{
  "questions": [
    {"id": "1", "text": "团队合作时，我倾向于主动承担协调角色", "dimension": "EI", "agree": "E"},
    {"id": "2", "text": "处理问题时，我更关注具体的执行细节", "dimension": "SN", "agree": "S"}
  ]
}

立即生成${questionCount}道题目的JSON：`

    // 设置较长的超时时间支持一次性生成
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3分钟超时
    
    let result: any[] = []
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`批量生成第${attempt}次尝试`)
        
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
                content: `你是MBTI专家。必须生成精确数量的题目。返回格式：{"questions": [题目数组]}。不要返回其他内容。`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: questionCount <= 30 ? 4000 : 8000,
            // 根据模型类型调整参数
            ...(process.env.OPENAI_MODEL?.includes('kimi') || process.env.OPENAI_MODEL?.includes('moonshot') ? {
              // Kimi 专用参数
            } : {
              // OpenAI 标准参数
              top_p: 0.9,
              presence_penalty: 0.1
            })
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`AI API响应错误: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        const content = data.choices[0].message.content.trim()
        
        // 解析AI返回的JSON - 增强对Kimi的兼容性
        let aiResult
        try {
          // 清理可能的markdown格式和额外字符
          let cleanContent = content
            .replace(/^```json\s*/i, '')
            .replace(/\s*```$/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .replace(/^[\s\n]*/, '') // 清理开头空白
            .replace(/[\s\n]*$/, '') // 清理结尾空白
          
          // 如果Kimi返回的内容包含解释文字，尝试提取JSON部分
          const jsonMatch = cleanContent.match(/\{[\s\S]*?\}(?=\s*$|\s*[^}]*$)/g)
          if (jsonMatch && jsonMatch.length > 0) {
            // 取最后一个完整的JSON对象（通常是我们要的）
            cleanContent = jsonMatch[jsonMatch.length - 1]
          }
          
          aiResult = JSON.parse(cleanContent)
        } catch (parseError) {
          console.log('JSON解析失败，原始内容:', content.substring(0, 200) + '...')
          // 更激进的JSON提取
          const jsonMatch = content.match(/\{[\s\S]*"questions"[\s\S]*\]/)?.[0]
          if (jsonMatch) {
            try {
              aiResult = JSON.parse(jsonMatch + '}')
            } catch {
              throw new Error(`JSON解析失败: ${parseError}`)
            }
          } else {
            throw new Error(`未找到有效的JSON格式: ${parseError}`)
          }
        }
        
        const questions = aiResult?.questions || []
        
        if (!Array.isArray(questions)) {
          throw new Error('AI返回的questions不是数组格式')
        }
        
        // 验证题目质量
        const validQuestions = questions.filter(q => 
          q && 
          q.text && 
          q.dimension && 
          q.agree &&
          ['EI', 'SN', 'TF', 'JP'].includes(q.dimension) &&
          /^[EISNTFJP]$/.test(q.agree)
        ).map((q, index) => ({
          ...q,
          id: q.id || `ai_bulk_${index + 1}`,
        }))
        
        console.log(`批量生成成功：获得${validQuestions.length}/${questionCount}道有效题目`)
        
        if (validQuestions.length >= Math.floor(questionCount * 0.7)) {
          // 如果有效题目数量达到70%以上，认为成功
          if (validQuestions.length < questionCount) {
            // 用高质量模板补充不足的题目
            const needed = questionCount - validQuestions.length
            const supplementQuestions = generateSupplementQuestions(needed, profileData)
            validQuestions.push(...supplementQuestions)
          }
          
          result = validQuestions.slice(0, questionCount)
          break
        } else {
          throw new Error(`有效题目数量不足: ${validQuestions.length}/${questionCount}`)
        }
        
      } catch (error: any) {
        console.error(`批量生成第${attempt}次失败:`, error.message)
        
        if (attempt === maxRetries) {
          // 最后一次尝试失败，使用完全降级方案
          console.log('所有尝试失败，使用降级方案生成题目')
          result = generateFallbackQuestions(questionCount, profileData)
          break
        } else {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
        }
      }
    }
    
    const finalResult = result.length ? result : generateFallbackQuestions(questionCount, profileData)

    return NextResponse.json({
      success: true,
      questions: finalResult,
      count: finalResult.length,
      message: `成功生成${finalResult.length}道个性化题目`
    })
    
  } catch (error: any) {
    console.error('批量生成API错误:', error)
    return NextResponse.json(
      { error: '批量生成失败: ' + error.message },
      { status: 500 }
    )
  }
}

// 高质量补充题目生成
function generateSupplementQuestions(count: number, profileData: any): any[] {
  const isWorking = profileData.occupation && !profileData.occupation.includes('学生')
  const isYoung = profileData.age <= 25
  const interests = (profileData.interests || '').toLowerCase()
  
  const supplementTemplates = {
    'EI': [
      { text: '在新环境中，我通常能够快速融入并结识他人', dimension: 'EI', agree: 'E' },
      { text: '我更喜欢通过深度思考来处理复杂问题', dimension: 'EI', agree: 'I' },
      { text: '集体活动比独自学习更能激发我的动力', dimension: 'EI', agree: 'E' },
      { text: '安静的环境让我感到更加专注和舒适', dimension: 'EI', agree: 'I' }
    ],
    'SN': [
      { text: '我倾向于相信经过实践验证的传统方法', dimension: 'SN', agree: 'S' },
      { text: '我经常思考"如果这样会怎么样"的假设情况', dimension: 'SN', agree: 'N' },
      { text: '制定计划时，我会优先考虑可行性和资源', dimension: 'SN', agree: 'S' },
      { text: '我喜欢探讨事物的深层意义和象征含义', dimension: 'SN', agree: 'N' }
    ],
    'TF': [
      { text: '做决定时，我会优先分析利弊得失', dimension: 'TF', agree: 'T' },
      { text: '我总是试图理解他人行为背后的情感原因', dimension: 'TF', agree: 'F' },
      { text: '我认为客观标准比个人情感更重要', dimension: 'TF', agree: 'T' },
      { text: '维护团队和谐比坚持个人观点更重要', dimension: 'TF', agree: 'F' }
    ],
    'JP': [
      { text: '我习惯把重要任务提前安排在日程中', dimension: 'JP', agree: 'J' },
      { text: '我喜欢保持多种选择，直到最后才决定', dimension: 'JP', agree: 'P' },
      { text: '明确的期限和要求让我工作更有效率', dimension: 'JP', agree: 'J' },
      { text: '灵活调整计划比严格执行更适合我', dimension: 'JP', agree: 'P' }
    ]
  }
  
  // 根据用户特征调整题目
  if (isWorking) {
    supplementTemplates.EI.push({
      text: '工作中我更愿意通过面对面交流解决问题',
      dimension: 'EI', agree: 'E'
    })
  }
  
  if (isYoung) {
    supplementTemplates.SN.push({
      text: '我对新事物和流行趋势保持高度敏感',
      dimension: 'SN', agree: 'N'
    })
  }
  
  const questions: any[] = []
  const dimensions = ['EI', 'SN', 'TF', 'JP']
  const perDimension = Math.ceil(count / 4)
  
  dimensions.forEach(dim => {
    const dimTemplates = supplementTemplates[dim as keyof typeof supplementTemplates]
    for (let i = 0; i < perDimension && questions.length < count; i++) {
      const template = dimTemplates[i % dimTemplates.length]
      questions.push({
        ...template,
        id: `supplement_${dim}_${i + 1}_${Date.now()}`
      })
    }
  })
  
  return questions.slice(0, count)
}

// 完全降级方案
function generateFallbackQuestions(count: number, profileData: any): any[] {
  const baseQuestions = [
    // EI维度
    { text: '我在社交场合中感到精力充沛', dimension: 'EI', agree: 'E' },
    { text: '独处时我能更好地集中注意力', dimension: 'EI', agree: 'I' },
    { text: '我倾向于先说后想', dimension: 'EI', agree: 'E' },
    { text: '我更喜欢倾听而不是主导对话', dimension: 'EI', agree: 'I' },
    { text: '团队合作比个人工作更有趣', dimension: 'EI', agree: 'E' },
    { text: '我需要安静的环境来处理复杂任务', dimension: 'EI', agree: 'I' },
    { text: '我很容易与陌生人开始对话', dimension: 'EI', agree: 'E' },
    { text: '深度交流比广泛社交更有意义', dimension: 'EI', agree: 'I' },
    
    // SN维度
    { text: '我更关注具体的事实和数据', dimension: 'SN', agree: 'S' },
    { text: '我经常思考未来的各种可能性', dimension: 'SN', agree: 'N' },
    { text: '实践经验比理论知识更重要', dimension: 'SN', agree: 'S' },
    { text: '我喜欢探索创新的解决方案', dimension: 'SN', agree: 'N' },
    { text: '按部就班的方法通常最可靠', dimension: 'SN', agree: 'S' },
    { text: '我经常产生新的想法和洞察', dimension: 'SN', agree: 'N' },
    { text: '我偏好处理具体的实际问题', dimension: 'SN', agree: 'S' },
    { text: '抽象概念和理论吸引着我', dimension: 'SN', agree: 'N' },
    
    // TF维度
    { text: '逻辑分析是我做决定的主要依据', dimension: 'TF', agree: 'T' },
    { text: '我会优先考虑他人的感受', dimension: 'TF', agree: 'F' },
    { text: '客观公正比人情更重要', dimension: 'TF', agree: 'T' },
    { text: '和谐的关系胜过完美的解决方案', dimension: 'TF', agree: 'F' },
    { text: '我习惯用理性来评估情况', dimension: 'TF', agree: 'T' },
    { text: '理解他人的动机对我很重要', dimension: 'TF', agree: 'F' },
    { text: '效率和结果是最重要的', dimension: 'TF', agree: 'T' },
    { text: '我总是试图让每个人都满意', dimension: 'TF', agree: 'F' },
    
    // JP维度
    { text: '我喜欢提前制定详细计划', dimension: 'JP', agree: 'J' },
    { text: '我更喜欢保持灵活性和选择空间', dimension: 'JP', agree: 'P' },
    { text: '截止日期让我感到紧迫和动力', dimension: 'JP', agree: 'J' },
    { text: '我在压力下能更好地发挥', dimension: 'JP', agree: 'P' },
    { text: '有序的环境让我工作更高效', dimension: 'JP', agree: 'J' },
    { text: '我善于适应突发状况', dimension: 'JP', agree: 'P' },
    { text: '完成任务比完美任务更重要', dimension: 'JP', agree: 'J' },
    { text: '我喜欢探索多种可能的解决方案', dimension: 'JP', agree: 'P' }
  ]
  
  const questions = []
  for (let i = 0; i < count; i++) {
    const question = baseQuestions[i % baseQuestions.length]
    questions.push({
      ...question,
      id: `fallback_bulk_${i + 1}`
    })
  }
  
  return questions
}