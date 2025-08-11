import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { profile, answers, questions, mbtiResult } = await request.json()
    
    const prompt = `你是一位资深的MBTI心理分析师。请基于以下信息，为用户生成一份详细、个性化的MBTI分析报告。

用户信息：
- 姓名：${profile.name}
- 年龄：${profile.age}岁
- 性别：${profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '其他'}
- 职业：${profile.occupation}
- 教育程度：${profile.education}
- 兴趣爱好：${profile.interests || '未填写'}

测试结果：
- MBTI类型：${mbtiResult.type}
- 各维度得分：
  - 外向(E) vs 内向(I)：${mbtiResult.scores.EI.percentFirst}% vs ${mbtiResult.scores.EI.percentSecond}%
  - 感觉(S) vs 直觉(N)：${mbtiResult.scores.SN.percentFirst}% vs ${mbtiResult.scores.SN.percentSecond}%
  - 思考(T) vs 情感(F)：${mbtiResult.scores.TF.percentFirst}% vs ${mbtiResult.scores.TF.percentSecond}%
  - 判断(J) vs 知觉(P)：${mbtiResult.scores.JP.percentFirst}% vs ${mbtiResult.scores.JP.percentSecond}%

要求：
1. 结合用户的个人背景，深入分析其MBTI类型特征
2. 基于年龄和职业，给出针对性的建议
3. 分析各维度的得分特点和平衡性
4. 提供个人发展建议和注意事项
5. 语言要专业但易懂，温暖而有建设性
6. 控制总字数在300字左右，内容精炼且有价值

请以JSON格式返回分析结果：
{
  "analysis": {
    "summary": "整体性格概述（60字内）",
    "strengths": ["优势1（15字内）", "优势2（15字内）", "优势3（15字内）"],
    "challenges": ["挑战1（20字内）", "挑战2（20字内）"],
    "recommendations": ["建议1（20字内）", "建议2（20字内）", "建议3（20字内）"],
    "careerGuidance": "职业发展建议（50字内）",
    "personalGrowth": "个人成长方向（50字内）",
    "relationships": "人际关系建议（40字内）"
  }
}`

    console.log('Calling AI API for analysis:', process.env.OPENAI_API_URL + '/v1/chat/completions')
    console.log('Using model:', process.env.OPENAI_MODEL)
    
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
            content: '你是一位专业的MBTI心理分析师，擅长结合个人背景提供深入的性格分析和建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AI Analysis API request failed: ${response.status} ${response.statusText}`)
      console.error('Error response:', errorText)
      
      if (response.status === 503) {
        throw new Error('AI 分析服务暂时不可用，请稍后重试')
      } else if (response.status === 401) {
        throw new Error('API 密钥认证失败')
      } else if (response.status === 429) {
        throw new Error('请求频率过高，请稍后重试')
      } else {
        throw new Error(`AI 分析请求失败: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // 尝试解析AI返回的JSON
    try {
      const aiAnalysis = JSON.parse(content)
      return NextResponse.json(aiAnalysis)
    } catch (parseError) {
      // 如果无法直接解析，尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const aiAnalysis = JSON.parse(jsonMatch[0])
        return NextResponse.json(aiAnalysis)
      }
      throw new Error('Unable to parse AI response')
    }

  } catch (error) {
    console.error('Error generating AI analysis:', error)
    return NextResponse.json(
      { error: 'Failed to generate analysis' }, 
      { status: 500 }
    )
  }
}