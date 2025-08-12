import { NextRequest, NextResponse } from 'next/server'

// 真正的流式输出API - 使用OpenAI的stream参数实现逐token流式输出
export async function POST(request: NextRequest) {
  try {
    const { profileData, questionCount = 30 } = await request.json()
    
    console.log(`启动真正的流式生成: ${questionCount}题`)
    
    // 构建AI提示词
    const prompt = `你是MBTI心理测试专家，需要为用户生成${questionCount}道个性化测试题目。

## 用户画像
- 年龄：${profileData.age}岁
- 职业：${profileData.occupation}
- 兴趣爱好：${profileData.interests || '通用'}
- 社交偏好：${profileData.socialPreference || '未知'}
- 学习方式：${profileData.learningStyle || '未知'}
- 情感表达：${profileData.emotionalExpression || '未知'}

## 生成要求
1. **数量严格**：必须生成${questionCount}道题目，不多不少
2. **维度均衡**：四个维度(EI/SN/TF/JP)平均分配，每个维度约${Math.ceil(questionCount/4)}道
3. **个性化高**：深度结合用户的年龄、职业、兴趣等特征
4. **场景真实**：基于用户实际生活场景，避免抽象或不符合身份的情况
5. **表达自然**：使用第一人称，语言自然流畅，避免生硬的测试语气
6. **目的隐蔽**：题目不应让用户明显看出在测试哪个维度

## 维度说明与示例
- **EI维度**：内向vs外向，关注能量获取方式
- **SN维度**：感觉vs直觉，关注信息收集偏好  
- **TF维度**：思考vs情感，关注决策制定方式
- **JP维度**：判断vs知觉，关注生活方式偏好

## 输出格式
严格按以下JSON格式输出，无任何其他内容：

{
  "questions": [
    {"id": "1", "text": "在${profileData.occupation}工作中，我更愿意主动与同事分享想法和经验", "dimension": "EI", "agree": "E"},
    {"id": "2", "text": "面对${profileData.interests}相关的新知识，我倾向于先了解基础原理", "dimension": "SN", "agree": "S"}
  ]
}

现在开始生成${questionCount}道题目：`

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
          console.error('流式生成错误:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : '生成失败'
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
    console.error('启动流式生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '启动失败' },
      { status: 500 }
    )
  }
}


