import { NextRequest, NextResponse } from 'next/server'

// 简单的内存存储（生产环境建议使用Redis）
const taskStorage = new Map<string, {
  status: 'pending' | 'completed' | 'failed'
  questions?: any
  error?: string
  startTime: number
}>()

// 生成任务ID
function generateTaskId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 异步生成题目的实际逻辑
async function generateQuestionsInternal(profileData: any, questionCount: number): Promise<any> {
  const prompt = `请根据以下个人资料生成${questionCount}道个性化的MBTI测试题目：

个人资料：
- 年龄：${profileData.age}
- 性别：${profileData.gender}
- 职业：${profileData.occupation}
- 教育程度：${profileData.education}
- 关注领域：${profileData.interests}

请返回JSON格式，包含${questionCount}道题目，每道题目包含：
- text: 题目内容
- options: 4个选项数组，每个选项包含text和mbti_weights
- category: E/I, S/N, T/F, J/P之一

JSON格式如下：
{
  "questions": [
    {
      "text": "题目内容",
      "options": [
        {"text": "选项A", "mbti_weights": {"E": 2, "I": 0, "S": 1, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}},
        {"text": "选项B", "mbti_weights": {"E": 0, "I": 2, "S": 0, "N": 1, "T": 0, "F": 0, "J": 0, "P": 0}},
        {"text": "选项C", "mbti_weights": {"E": 1, "I": 0, "S": 0, "N": 0, "T": 2, "F": 0, "J": 0, "P": 0}},
        {"text": "选项D", "mbti_weights": {"E": 0, "I": 1, "S": 0, "N": 0, "T": 0, "F": 2, "J": 0, "P": 0}}
      ],
      "category": "E/I"
    }
  ]
}`

  console.log('开始异步AI生成题目，数量：', questionCount)
  
  // 增加超时处理，最多重试2次
  let lastError: any
  const maxRetries = 2
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      console.log(`异步AI请求尝试 ${retry + 1}/${maxRetries + 1}`)
      
      // 使用AbortController实现超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5分钟超时，适合异步场景
      
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
          max_tokens: 8000, // 异步场景可以使用更大的token限制
          timeout: 300 // AI模型内部超时设置
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        
        // 尝试解析AI返回的JSON
        try {
          const aiQuestions = JSON.parse(content)
          console.log('异步AI生成成功，题目数量：', aiQuestions.questions?.length || 0)
          return aiQuestions
        } catch (parseError) {
          // 如果无法直接解析，尝试提取JSON部分
          console.log('尝试提取JSON部分...')
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const aiQuestions = JSON.parse(jsonMatch[0])
            console.log('异步AI生成成功（提取），题目数量：', aiQuestions.questions?.length || 0)
            return aiQuestions
          }
          throw parseError
        }
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error: any) {
      lastError = error
      console.error(`异步AI请求第${retry + 1}次尝试失败:`, error.message)
      
      if (retry < maxRetries) {
        // 递增重试间隔：2秒、4秒
        const delay = (retry + 1) * 2000
        console.log(`等待${delay/1000}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
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
      startTime: Date.now()
    })
    
    // 启动异步任务
    generateQuestionsInternal(profileData, questionCount).then(questions => {
      taskStorage.set(taskId, {
        status: 'completed',
        questions,
        startTime: taskStorage.get(taskId)!.startTime
      })
      console.log(`任务 ${taskId} 完成`)
    }).catch(error => {
      taskStorage.set(taskId, {
        status: 'failed',
        error: error.message,
        startTime: taskStorage.get(taskId)!.startTime
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
    
    console.log('查询任务状态:', taskId)
    console.log('当前存储中的任务:', Array.from(taskStorage.keys()))
    
    if (!taskId) {
      return NextResponse.json(
        { error: '缺少taskId参数' },
        { status: 400 }
      )
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
