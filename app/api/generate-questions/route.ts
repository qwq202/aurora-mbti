import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { profile, questionCount } = await request.json()
    
    const prompt = `你是一位专业的MBTI心理测评专家。请基于以下用户信息，生成${questionCount}道个性化的MBTI测试题目。

用户信息：
- 姓名：${profile.name}
- 年龄：${profile.age}岁
- 性别：${profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '其他'}
- 职业：${profile.occupation}
- 教育程度：${profile.education}
- 兴趣爱好：${profile.interests || '未填写'}
- 工作/学习偏好：${profile.workStyle || '未填写'}
- 压力水平：${profile.stressLevel || '未填写'}
- 社交偏好：${profile.socialPreference || '未填写'}

要求：
1. 生成${questionCount}道题目，平均覆盖MBTI四个维度（E/I, S/N, T/F, J/P）
2. 题目要贴合用户的年龄、职业和生活场景
3. 每道题目都是5点李克特量表（1=强烈不同意，2=不同意，3=中立，4=同意，5=强烈同意）
4. 返回JSON格式，包含题目ID、题目内容、所属维度、同意时偏向的字母

返回格式示例：
{
  "questions": [
    {
      "id": "ai_q1",
      "text": "题目内容",
      "dimension": "EI",
      "agree": "E"
    }
  ]
}`

    console.log('Calling AI API:', process.env.OPENAI_API_URL + '/v1/chat/completions')
    console.log('Using model:', process.env.OPENAI_MODEL)
    
    // 增加超时处理，最多重试2次
    let lastError: any
    const maxRetries = 2
    
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        console.log(`AI请求尝试 ${retry + 1}/${maxRetries + 1}`)
        
        // 使用AbortController实现超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 180000) // 3分钟超时
        
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
                content: '你是一位专业的MBTI心理测评专家，擅长根据个人情况生成个性化的心理测试题目。请务必返回完整的JSON格式。'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 6000, // 增加token限制，确保能容纳所有题目
            timeout: 180 // AI模型内部超时设置
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          // 成功获取响应，解析数据
          const data = await response.json()
          const content = data.choices[0].message.content
          
          // 尝试解析AI返回的JSON
          try {
            const aiQuestions = JSON.parse(content)
            return NextResponse.json(aiQuestions)
          } catch (parseError) {
            // 如果无法直接解析，尝试提取JSON部分
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const aiQuestions = JSON.parse(jsonMatch[0])
              return NextResponse.json(aiQuestions)
            }
            throw new Error('AI返回内容格式错误，无法解析')
          }
        } else {
          const errorText = await response.text()
          console.error(`API request failed: ${response.status} ${response.statusText}`)
          console.error('Error response:', errorText)
          
          if (response.status === 503) {
            throw new Error('AI 服务暂时不可用，请稍后重试')
          } else if (response.status === 401) {
            throw new Error('API 密钥认证失败')
          } else if (response.status === 429) {
            throw new Error('请求频率过高，请稍后重试')
          } else {
            throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
          }
        }
        
      } catch (error: any) {
        lastError = error
        console.error(`AI请求第${retry + 1}次失败:`, error.message)
        
        // 如果不是最后一次重试，等待一段时间后重试
        if (retry < maxRetries) {
          const waitTime = (retry + 1) * 2000 // 递增等待时间：2秒、4秒
          console.log(`等待${waitTime/1000}秒后重试...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }
    
    // 所有重试都失败，抛出最后的错误
    console.error('所有重试都失败，最后的错误:', lastError?.message)
    if (lastError?.name === 'AbortError') {
      throw new Error('AI生成超时，请稍后重试。生成60道题需要较长时间，请耐心等待。')
    } else if (lastError?.message?.includes('524')) {
      throw new Error('AI服务响应超时，请稍后重试')
    } else {
      throw new Error(`AI生成失败: ${lastError?.message || '未知错误'}`)
    }

  } catch (error) {
    console.error('Error generating AI questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' }, 
      { status: 500 }
    )
  }
}