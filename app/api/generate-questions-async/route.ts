import { NextRequest, NextResponse } from 'next/server'

// 简单的内存存储（生产环境建议使用Redis）
const taskStorage = new Map<string, {
  status: 'pending' | 'completed' | 'failed'
  questions?: any
  error?: string
  startTime: number
  progress?: number  // 进度百分比
  message?: string   // 当前状态描述
}>()

// 生成任务ID
function generateTaskId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 分块生成题目的核心逻辑
async function generateQuestionsInChunks(profileData: any, totalCount: number, taskId: string): Promise<any> {
  const allQuestions: any[] = []
  const chunkSize = 15 // 每批生成15道题，减少单次请求压力
  const totalChunks = Math.ceil(totalCount / chunkSize)
  
  console.log(`开始分块生成 ${totalCount} 道题目，分为 ${totalChunks} 批，每批 ${chunkSize} 道`)
  
  for (let chunk = 0; chunk < totalChunks; chunk++) {
    const currentChunkSize = Math.min(chunkSize, totalCount - chunk * chunkSize)
    const isLastChunk = chunk === totalChunks - 1
    
    // 更新任务状态
    taskStorage.set(taskId, {
      ...taskStorage.get(taskId)!,
      status: 'pending',
      progress: Math.round((chunk / totalChunks) * 100),
      message: `正在生成第 ${chunk + 1}/${totalChunks} 批题目...`
    })
    
    console.log(`生成第 ${chunk + 1}/${totalChunks} 批，${currentChunkSize} 道题目`)
    
    const chunkQuestions = await generateSingleChunk(profileData, currentChunkSize, chunk + 1, totalChunks)
    allQuestions.push(...chunkQuestions)
    
    // 避免请求过于频繁，添加小延时
    if (!isLastChunk) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  console.log(`所有批次生成完成，共 ${allQuestions.length} 道题目`)
  return { questions: allQuestions }
}

// 生成单批题目
async function generateSingleChunk(profileData: any, chunkSize: number, chunkIndex: number, totalChunks: number): Promise<any[]> {
  const dimensions = ['E/I', 'S/N', 'T/F', 'J/P']
  const focusDimension = dimensions[(chunkIndex - 1) % 4] // 轮流关注不同维度
  
  const prompt = `请根据个人资料生成 ${chunkSize} 道MBTI题目，重点关注 ${focusDimension} 维度：

个人资料：
- 年龄：${profileData.age}岁
- 性别：${profileData.gender}
- 职业：${profileData.occupation}
- 教育：${profileData.education}
- 兴趣：${profileData.interests}

要求：
1. 生成 ${chunkSize} 道题目，优先关注 ${focusDimension} 维度
2. 题目要贴合该用户的生活场景
3. 使用简洁的JSON格式返回

JSON格式：
{
  "questions": [
    {
      "text": "在工作中遇到复杂问题时，你通常会？",
      "dimension": "TF",
      "agree": "T",
      "id": "ai_1"
    }
  ]
}

注意：只返回JSON，不要其他解释文字。每个题目必须有唯一的id。`

  const maxRetries = 2
  let lastError: any
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      console.log(`第${chunkIndex}批请求尝试 ${retry + 1}/${maxRetries + 1}`)
      
      // 缩短超时时间，提高成功率
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 1分钟超时
      
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
              content: '你是MBTI专家，根据个人背景生成个性化题目。只返回JSON格式，不要额外说明。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 3000, // 减少token数量，提高响应速度
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content.trim()
        
        try {
          // 清理可能的markdown格式
          const cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
          const parsed = JSON.parse(cleanContent)
          const questions = parsed.questions || []
          
          console.log(`第${chunkIndex}批生成成功，获得 ${questions.length} 道题目`)
          return questions
        } catch (parseError) {
          // 尝试提取JSON
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            const questions = parsed.questions || []
            console.log(`第${chunkIndex}批生成成功（提取），获得 ${questions.length} 道题目`)
            return questions
          }
          throw new Error('JSON解析失败')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error: any) {
      lastError = error
      console.error(`第${chunkIndex}批请求第${retry + 1}次失败:`, error.message)
      
      if (retry < maxRetries) {
        const delay = Math.min(2000 * (retry + 1), 5000) // 最多等待5秒
        console.log(`等待${delay/1000}秒后重试第${chunkIndex}批...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // 如果所有重试都失败，返回空数组而不是抛出错误
  console.error(`第${chunkIndex}批生成失败，使用降级方案`)
  return generateFallbackQuestions(chunkSize, focusDimension)
}

// 降级方案：生成基础题目
function generateFallbackQuestions(count: number, dimension: string): any[] {
  const templates = {
    'E/I': [
      { text: '在团队讨论中，我更倾向于积极发言表达观点', dimension: 'EI', agree: 'E' },
      { text: '长时间社交后，我需要独处来恢复能量', dimension: 'EI', agree: 'I' },
      { text: '我享受在人群中成为关注的焦点', dimension: 'EI', agree: 'E' },
      { text: '深度对话比广泛社交更让我满足', dimension: 'EI', agree: 'I' }
    ],
    'S/N': [
      { text: '我更关注具体的事实和细节', dimension: 'SN', agree: 'S' },
      { text: '我经常思考未来的可能性和潜力', dimension: 'SN', agree: 'N' },
      { text: '我偏好按步骤执行既定的流程', dimension: 'SN', agree: 'S' },
      { text: '我喜欢探索创新的解决方案', dimension: 'SN', agree: 'N' }
    ],
    'T/F': [
      { text: '做决定时我主要依据逻辑分析', dimension: 'TF', agree: 'T' },
      { text: '我会优先考虑决定对他人的影响', dimension: 'TF', agree: 'F' },
      { text: '客观事实比个人感受更重要', dimension: 'TF', agree: 'T' },
      { text: '维护关系和谐是我的重要考虑', dimension: 'TF', agree: 'F' }
    ],
    'J/P': [
      { text: '我喜欢事先制定详细的计划', dimension: 'JP', agree: 'J' },
      { text: '我更享受灵活应变的生活方式', dimension: 'JP', agree: 'P' },
      { text: '按时完成任务对我很重要', dimension: 'JP', agree: 'J' },
      { text: '我倾向于保持多种选择的开放性', dimension: 'JP', agree: 'P' }
    ]
  }
  
  const selectedTemplates = templates[dimension as keyof typeof templates] || templates['E/I']
  const questions = []
  
  for (let i = 0; i < count; i++) {
    const template = selectedTemplates[i % selectedTemplates.length]
    questions.push({
      ...template,
      id: `fallback_${dimension}_${i + 1}`
    })
  }
  
  console.log(`生成 ${questions.length} 道降级题目`)
  return questions
}

// 异步生成题目的实际逻辑（保持接口兼容）
async function generateQuestionsInternal(profileData: any, questionCount: number, taskId?: string): Promise<any> {
  if (taskId && questionCount > 15) {
    // 使用分块策略
    return generateQuestionsInChunks(profileData, questionCount, taskId)
  }
  
  // 单次生成（保持原有逻辑用于小批量）
  return generateSingleChunk(profileData, questionCount, 1, 1).then(questions => ({ questions }))
}

// POST: 启动异步生成任务
export async function POST(request: NextRequest) {
  try {
    const { profileData, questionCount } = await request.json()
    
    // 生成任务ID
    const taskId = generateTaskId()
    
    // 初始化任务状态
    taskStorage.set(taskId, {
      status: 'pending',
      startTime: Date.now(),
      progress: 0,
      message: '正在初始化AI生成任务...'
    })
    
    // 启动异步任务
    generateQuestionsInternal(profileData, questionCount, taskId).then(result => {
      taskStorage.set(taskId, {
        status: 'completed',
        questions: result,
        startTime: taskStorage.get(taskId)!.startTime,
        progress: 100,
        message: '所有题目生成完成！'
      })
      console.log(`任务 ${taskId} 完成`)
    }).catch(error => {
      taskStorage.set(taskId, {
        status: 'failed',
        error: error.message,
        startTime: taskStorage.get(taskId)!.startTime,
        progress: 0,
        message: '生成失败，请重试'
      })
      console.error(`任务 ${taskId} 失败:`, error.message)
    })
    
    // 立即返回任务ID
    return NextResponse.json({
      taskId,
      status: 'pending',
      message: '题目生成任务已启动，请使用任务ID查询进度'
    })
  } catch (error: any) {
    console.error('启动异步生成任务失败:', error)
    return NextResponse.json(
      { error: '启动生成任务失败: ' + error.message },
      { status: 500 }
    )
  }
}

// GET: 查询任务状态
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    const wantsSSE = url.searchParams.get('sse') === '1' || (request.headers.get('accept') || '').includes('text/event-stream')
    
    console.log('查询任务状态:', taskId)
    console.log('当前存储中的任务:', Array.from(taskStorage.keys()))
    
    if (!taskId) {
      return NextResponse.json(
        { error: '缺少taskId参数' },
        { status: 400 }
      )
    }
    
    // SSE 分支：按秒推送任务状态与运行时间
    if (wantsSSE) {
      let interval: ReturnType<typeof setInterval> | undefined
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder()
          function sendEvent(data: any, event?: string) {
            const payload = (event ? `event: ${event}\n` : '') + `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(payload))
          }
          // 立即发送一次，随后每秒推送
          interval = setInterval(() => {
            const task = taskStorage.get(taskId)
            const startTime = task?.startTime || Date.now()
            const runtimeSec = Math.max(0, Math.floor((Date.now() - startTime) / 1000))
            const snapshot: any = {
              taskId,
              status: task?.status || 'unknown',
              runtime: `${runtimeSec}秒`,
              progress: task?.progress || 0,
              message: task?.message || '处理中...'
            }
            sendEvent(snapshot)
            if (!task || task.status === 'completed' || task.status === 'failed') {
              // 结束事件并关闭
              sendEvent(snapshot, 'end')
              if (interval) clearInterval(interval)
              controller.close()
            }
          }, 1000)
        },
        cancel() {
          // 客户端断开
          if (interval) clearInterval(interval)
        }
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      })
    }
    
    const task = taskStorage.get(taskId)
    if (!task) {
      console.log(`任务 ${taskId} 未找到，可能的原因：开发模式下内存重置`)
      return NextResponse.json(
        { 
          error: '任务不存在或已过期', 
          debug: {
            taskId,
            availableTasks: Array.from(taskStorage.keys()),
            reason: '开发模式下内存可能被重置，建议重新生成'
          }
        },
        { status: 404 }
      )
    }
    
    // 计算运行时间
    const runtime = Math.floor((Date.now() - task.startTime) / 1000)
    
    const response: any = {
      taskId,
      status: task.status,
      runtime: `${runtime}秒`
    }
    
    if (task.status === 'completed') {
      response.questions = task.questions
      // 任务完成后清理存储
      setTimeout(() => taskStorage.delete(taskId), 60000) // 1分钟后清理
    } else if (task.status === 'failed') {
      response.error = task.error
      // 任务失败后清理存储
      setTimeout(() => taskStorage.delete(taskId), 60000) // 1分钟后清理
    }
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('查询任务状态失败:', error)
    return NextResponse.json(
      { error: '查询任务状态失败: ' + error.message },
      { status: 500 }
    )
  }
}
