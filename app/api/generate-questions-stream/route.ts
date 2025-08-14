import { NextRequest, NextResponse } from 'next/server'

// 真正的流式输出API - 使用OpenAI的stream参数实现逐token流式输出
export async function POST(request: NextRequest) {
  try {
    const { profileData, questionCount = 30 } = await request.json()
    
    console.log(`启动真正的流式生成: ${questionCount}题`)
    
    // 构建AI提示词
    const accuracyAddendum = questionCount >= 100 ? `
## 精确度增强要求（用于${questionCount}道题的大规模高准确性测评）
7. 题干需避免歧义、避免双重否定与多重概念；每题只考察一个核心倾向
8. 同一维度要覆盖多种典型情境（工作/学习/社交/压力/决策），且包含正反向措辞（reverse-keyed）以抵消响应偏差
9. 尽量避免引导性措辞与罕见情境；确保一般用户都能理解并代入
10. 控制题干长度在自然、易读范围（一般不超过30字中文），避免过长
11. 明确排除重复或近义重述；同维度的题目应从不同切面发问
12. 输出顺序建议按维度分块或均匀交替，以利于后续评分稳定
` : ''

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
${accuracyAddendum}

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
    const temperature = questionCount >= 100 ? 0.35 : 0.7
    
    const stream = new ReadableStream({
      async start(controller) {
        // 提前声明，确保 finally 可见
        let pingTimer: any | null = null
        let abortSignal: AbortSignal | null = null
        let onAbort: (() => void) | null = null
        try {
          let isClosed = false
          const safeEnqueue = (chunk: Uint8Array) => {
            if (isClosed) return
            try { controller.enqueue(chunk) } catch { isClosed = true }
          }
          // 心跳：保持连接，避免中间层超时断开
          const heartbeat = () => safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping', t: Date.now() })}\n\n`))
          pingTimer = setInterval(heartbeat, 10000)
          // 立即发送一次启动事件与心跳
          safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`))
          heartbeat()

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
              temperature,
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

          // 处理客户端断开
          abortSignal = request.signal
          onAbort = () => {
            isClosed = true
            try { if (pingTimer) clearInterval(pingTimer) } catch {}
            try { reader.cancel() } catch {}
            try { controller.close() } catch {}
          }
          if (abortSignal.aborted) onAbort()
          else abortSignal.addEventListener('abort', onAbort)

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
                  safeEnqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'done',
                    content: accumulatedContent
                  })}\n\n`))
                  try { if (pingTimer) clearInterval(pingTimer) } catch {}
                  if (!isClosed) { try { controller.close(); isClosed = true } catch { isClosed = true } }
                  return
                }
                
                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta?.content
                  
                  if (delta) {
                    accumulatedContent += delta
                    
                    // 实时发送增量内容
                    safeEnqueue(encoder.encode(`data: ${JSON.stringify({
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
          // 如果是客户端中止或读流被终止，降级为警告
          const isAbort = error instanceof Error && (/abort/i.test(error.message) || error.name === 'AbortError' || /terminated/i.test(String(error)))
          if (isAbort) console.warn('流式生成中止:', error)
          else console.error('流式生成错误:', error)
          try {
            const payload = encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : '生成失败'
            })}\n\n`)
            // 使用局部safe enqueue逻辑，避免引用外层变量作用域问题
            try { (controller as ReadableStreamDefaultController).enqueue(payload) } catch {}
          } finally {
            try { if (pingTimer) clearInterval(pingTimer) } catch {}
            try { if (abortSignal && onAbort) abortSignal.removeEventListener('abort', onAbort as any) } catch {}
            try { (controller as ReadableStreamDefaultController).close() } catch {}
          }
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


