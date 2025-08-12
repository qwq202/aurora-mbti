import { NextRequest, NextResponse } from 'next/server'

// AI分析流式输出API - 实现逐token流式分析结果展示
export async function POST(request: NextRequest) {
  try {
    const { profile, answers, questions, mbtiResult } = await request.json()
    
    console.log(`启动流式AI分析: ${mbtiResult.type}`)
    
    // 构建AI分析提示词
    const prompt = `你是一位资深的MBTI心理分析师。请基于以下信息，为用户生成一份详细、个性化的MBTI分析报告。

## 用户信息
- 姓名：${profile.name}
- 年龄：${profile.age}岁
- 性别：${profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '其他'}
- 职业：${profile.occupation}
- 教育程度：${profile.education}
- 兴趣爱好：${profile.interests || '未填写'}
- 社交偏好：${profile.socialPreference || '未知'}
- 学习方式：${profile.learningStyle || '未知'}
- 情感表达：${profile.emotionalExpression || '未知'}

## 测试结果
- MBTI类型：${mbtiResult.type}
- 各维度得分：
  - 外向(E) vs 内向(I)：${mbtiResult.scores.EI.percentFirst}% vs ${mbtiResult.scores.EI.percentSecond}%
  - 感觉(S) vs 直觉(N)：${mbtiResult.scores.SN.percentFirst}% vs ${mbtiResult.scores.SN.percentSecond}%
  - 思考(T) vs 情感(F)：${mbtiResult.scores.TF.percentFirst}% vs ${mbtiResult.scores.TF.percentSecond}%
  - 判断(J) vs 知觉(P)：${mbtiResult.scores.JP.percentFirst}% vs ${mbtiResult.scores.JP.percentSecond}%

## 分析要求
1. **个性化深入**：结合用户的年龄、职业、兴趣等背景信息进行个性化解读
2. **专业准确**：基于MBTI理论进行科学分析，避免泛泛而谈
3. **实用建议**：提供具体可行的发展建议，有明确的行动指导
4. **平衡客观**：分析优势的同时指出成长空间，客观公正
5. **语言质量**：用词准确、表达流畅，避免电报式短语，保持专业性和可读性
6. **字数平衡**：总字数控制在300字内，但要保证内容丰富有价值

## 输出格式
严格按以下JSON格式输出，注重内容质量：

{
  "analysis": {
    "summary": "结合${profile.age}岁${profile.occupation}身份的整体性格特征分析，语言自然流畅（70字内）",
    "strengths": [
      "优势特质的深入分析，说明具体表现和价值（25字内）", 
      "第二个核心优势，结合实际场景举例（25字内）", 
      "第三个潜在优势，指出发展方向（25字内）"
    ],
    "challenges": [
      "主要成长挑战，分析原因和影响（30字内）", 
      "次要需要关注的方面，提供改进思路（30字内）"
    ],
    "recommendations": [
      "具体的行动建议，可操作性强（25字内）", 
      "个人发展的实用方法，贴合实际（25字内）", 
      "长期提升的策略建议，有指导性（25字内）"
    ],
    "careerGuidance": "结合${profile.occupation}的职业发展路径建议，具体可行（40字内）",
    "personalGrowth": "基于MBTI类型的个人成长重点和方法建议（35字内）", 
    "relationships": "人际交往和沟通方式的优化建议，实用性强（30字内）"
  }
}

⚠️ 要求：内容专业有深度，语言自然流畅，避免过于简化的短语表达！

现在开始生成个性化分析：`

    // 设置SSE响应头
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 调用OpenAI API with stream=true
          const response = await fetch(process.env.OPENAI_API_URL + '/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL,
              messages: [
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              stream: true  // 关键：启用流式输出
            })
          })

          if (!response.ok) {
            throw new Error(`OpenAI API错误: ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('无法读取响应流')
          }

          let accumulatedContent = ''
          
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break
            
            // 解析SSE数据
            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                
                if (data === '[DONE]') {
                  // 流结束，发送最终结果
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'done',
                    content: accumulatedContent
                  })}\n\n`))
                  controller.close()
                  return
                }
                
                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta?.content
                  
                  if (delta) {
                    accumulatedContent += delta
                    
                    // 实时发送增量内容
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'delta',
                      delta: delta,
                      content: accumulatedContent
                    })}\n\n`))
                  }
                } catch (parseError) {
                  // 忽略解析错误
                }
              }
            }
          }
          
        } catch (error) {
          console.error('流式分析错误:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : '分析失败'
          })}\n\n`))
          controller.close()
        }
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'  // 禁用Nginx缓冲
      }
    })
    
  } catch (error) {
    console.error('启动流式分析失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '启动失败' },
      { status: 500 }
    )
  }
}
