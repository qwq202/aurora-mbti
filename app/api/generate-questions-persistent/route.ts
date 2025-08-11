import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// 任务存储目录
const STORAGE_DIR = path.join(process.cwd(), '.tmp', 'tasks')

// 确保存储目录存在
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true })
  } catch (error) {
    console.log('存储目录已存在或创建失败:', error)
  }
}

// 生成任务ID
function generateTaskId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 保存任务状态到文件
async function saveTask(taskId: string, taskData: any) {
  await ensureStorageDir()
  const filePath = path.join(STORAGE_DIR, `${taskId}.json`)
  await fs.writeFile(filePath, JSON.stringify(taskData, null, 2))
}

// 从文件读取任务状态
async function loadTask(taskId: string) {
  try {
    const filePath = path.join(STORAGE_DIR, `${taskId}.json`)
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return null
  }
}

// 删除任务文件
async function deleteTask(taskId: string) {
  try {
    const filePath = path.join(STORAGE_DIR, `${taskId}.json`)
    await fs.unlink(filePath)
  } catch (error) {
    console.log('删除任务文件失败:', error)
  }
}

// 异步生成题目的核心逻辑
async function generateQuestionsInternal(profileData: any, questionCount: number, taskId: string): Promise<any> {
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

  console.log('开始持久化AI生成题目，数量：', questionCount)
  
  let lastError: any
  const maxRetries = 2
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      console.log(`持久化AI请求尝试 ${retry + 1}/${maxRetries + 1}`)
      
      // 更新任务进度
      await saveTask(taskId, {
        status: 'pending',
        startTime: Date.now(),
        progress: 25 + retry * 25,
        currentStep: `正在生成题目 (第${retry + 1}次尝试)`
      })
      
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
          max_tokens: 6000,
          timeout: 180
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        // 更新解析进度
        await saveTask(taskId, {
          status: 'pending',
          startTime: Date.now(),
          progress: 85,
          currentStep: '正在解析AI返回结果'
        })
        
        const data = await response.json()
        const content = data.choices[0].message.content
        
        try {
          const aiQuestions = JSON.parse(content)
          console.log('持久化AI生成成功，题目数量：', aiQuestions.questions?.length || 0)
          return aiQuestions
        } catch (parseError) {
          console.log('尝试提取JSON部分...')
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const aiQuestions = JSON.parse(jsonMatch[0])
            console.log('持久化AI生成成功（提取），题目数量：', aiQuestions.questions?.length || 0)
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
      console.error(`持久化AI请求第${retry + 1}次尝试失败:`, error.message)
      
      // 更新失败进度
      await saveTask(taskId, {
        status: 'pending',
        startTime: Date.now(),
        progress: Math.min(50 + retry * 20, 90),
        currentStep: `第${retry + 1}次尝试失败: ${error.message}`
      })
      
      if (retry < maxRetries) {
        const delay = (retry + 1) * 2000
        console.log(`等待${delay/1000}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

// POST: 启动持久化异步生成任务
export async function POST(request: NextRequest) {
  try {
    const { profileData, questionCount } = await request.json()
    
    const taskId = generateTaskId()
    console.log('创建持久化任务:', taskId)
    
    // 初始化任务状态
    await saveTask(taskId, {
      status: 'pending',
      startTime: Date.now(),
      progress: 0,
      currentStep: '任务初始化完成'
    })
    
    // 启动异步任务
    generateQuestionsInternal(profileData, questionCount, taskId).then(async questions => {
      await saveTask(taskId, {
        status: 'completed',
        questions,
        startTime: Date.now(),
        progress: 100,
        currentStep: '生成完成'
      })
      console.log(`持久化任务 ${taskId} 完成`)
      
      // 30分钟后自动清理
      setTimeout(async () => {
        await deleteTask(taskId)
      }, 30 * 60 * 1000)
    }).catch(async error => {
      await saveTask(taskId, {
        status: 'failed',
        error: error.message,
        startTime: Date.now(),
        progress: 0,
        currentStep: '生成失败'
      })
      console.error(`持久化任务 ${taskId} 失败:`, error.message)
      
      // 10分钟后清理失败任务
      setTimeout(async () => {
        await deleteTask(taskId)
      }, 10 * 60 * 1000)
    })
    
    return NextResponse.json({
      taskId,
      status: 'pending',
      message: '持久化生成任务已启动，支持页面刷新和热重载',
      progress: 0
    })
  } catch (error: any) {
    console.error('启动持久化生成任务失败:', error)
    return NextResponse.json(
      { error: '启动生成任务失败: ' + error.message },
      { status: 500 }
    )
  }
}

// GET: 查询持久化任务状态
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json(
        { error: '缺少taskId参数' },
        { status: 400 }
      )
    }
    
    console.log('查询持久化任务状态:', taskId)
    const task = await loadTask(taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在或已过期' },
        { status: 404 }
      )
    }
    
    const runtime = Math.floor((Date.now() - task.startTime) / 1000)
    
    const response: any = {
      taskId,
      status: task.status,
      runtime: `${runtime}秒`,
      progress: task.progress || 0,
      currentStep: task.currentStep || '处理中'
    }
    
    if (task.status === 'completed') {
      response.questions = task.questions
    } else if (task.status === 'failed') {
      response.error = task.error
    }
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('查询持久化任务状态失败:', error)
    return NextResponse.json(
      { error: '查询任务状态失败: ' + error.message },
      { status: 500 }
    )
  }
}
