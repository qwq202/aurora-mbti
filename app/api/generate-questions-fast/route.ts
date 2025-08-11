import { NextRequest, NextResponse } from 'next/server'

// 任务存储
const taskStorage = new Map<string, {
  status: 'pending' | 'completed' | 'failed'
  questions?: any[]
  error?: string
  startTime: number
  progress?: number
}>()

// 生成任务ID
function generateTaskId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 按MBTI维度分批生成，避免重复
async function generateQuestionsByDimension(
  profileData: any, 
  dimension: string, 
  questionCount: number,
  scenarios: string[]
): Promise<any[]> {
  
  const dimensionInfo = {
    'E/I': {
      name: 'Extraversion/Introversion (外向/内向)',
      focus: '关注个人在社交互动、能量来源、注意力方向等方面的偏好',
      scenarios: '工作会议、团队合作、社交聚会、独处时光等场景'
    },
    'S/N': {
      name: 'Sensing/Intuition (感觉/直觉)',
      focus: '关注个人在信息收集、认知方式、关注焦点等方面的偏好',
      scenarios: '学习新技能、解决问题、规划未来、处理细节等场景'
    },
    'T/F': {
      name: 'Thinking/Feeling (思考/情感)',
      focus: '关注个人在决策方式、价值判断、处理冲突等方面的偏好',
      scenarios: '工作决策、人际关系、价值选择、冲突处理等场景'
    },
    'J/P': {
      name: 'Judging/Perceiving (判断/感知)',
      focus: '关注个人在生活方式、时间管理、计划执行等方面的偏好',
      scenarios: '时间规划、任务安排、应变处理、生活节奏等场景'
    }
  }

  const dimInfo = dimensionInfo[dimension as keyof typeof dimensionInfo]
  
  const prompt = `请根据以下个人资料，专门针对MBTI的${dimInfo.name}维度，生成${questionCount}道个性化测试题目：

个人资料：
- 年龄：${profileData.age}
- 性别：${profileData.gender}
- 职业：${profileData.occupation}
- 教育程度：${profileData.education}
- 关注领域：${profileData.interests}

生成要求：
1. **专注维度**：仅生成测试${dimInfo.name}的题目
2. **个性化场景**：结合用户的职业、年龄等背景，设计贴近其生活的题目
3. **场景多样性**：涵盖${dimInfo.scenarios}
4. **避免泛化**：不要生成能同时测试多个维度的题目

每道题目必须包含：
- text: 题目内容（结合用户背景的具体场景）
- options: 4个选项，明确区分${dimension}倾向
- category: "${dimension}"

JSON格式：
{
  "questions": [
    {
      "text": "题目内容",
      "options": [
        {"text": "选项A", "mbti_weights": {"E": 2, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}},
        {"text": "选项B", "mbti_weights": {"E": 0, "I": 2, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}},
        {"text": "选项C", "mbti_weights": {"E": 1, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}},
        {"text": "选项D", "mbti_weights": {"E": 0, "I": 1, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}}
      ],
      "category": "${dimension}"
    }
  ]
}`

  console.log(`开始生成${dimension}维度题目，数量：${questionCount}`)
  
  // AI请求配置
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 单批次2分钟超时
  
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
            content: `你是专业的MBTI心理测评专家。专注生成${dimInfo.name}维度的测试题目，确保题目针对性强、个性化程度高。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // 稍微提高创造性，避免模板化
        max_tokens: 4000, // 单批次token需求较少
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0].message.content
      
      try {
        const result = JSON.parse(content)
        console.log(`${dimension}维度生成成功，题目数量：${result.questions?.length || 0}`)
        return result.questions || []
      } catch (parseError) {
        // 尝试提取JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0])
          return result.questions || []
        }
        throw parseError
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

// 快速并发生成主函数
async function generateQuestionsParallel(profileData: any, questionCount: number): Promise<any[]> {
  console.log('开始并发分维度生成题目')
  
  // 根据题目数量分配维度
  let batches: Array<{dimension: string, count: number, scenarios: string[]}> = []
  
  if (questionCount === 30) {
    // 30题分配：E/I(10) + S/N(10) + T/F(5) + J/P(5)
    batches = [
      { dimension: 'E/I', count: 10, scenarios: ['社交', '工作'] },
      { dimension: 'S/N', count: 10, scenarios: ['学习', '解决问题'] },
      { dimension: 'T/F', count: 5, scenarios: ['决策'] },
      { dimension: 'J/P', count: 5, scenarios: ['计划'] }
    ]
  } else {
    // 60题分配：E/I(18) + S/N(18) + T/F(12) + J/P(12)
    batches = [
      { dimension: 'E/I', count: 18, scenarios: ['社交', '工作', '团队'] },
      { dimension: 'S/N', count: 18, scenarios: ['学习', '解决问题', '规划'] },
      { dimension: 'T/F', count: 12, scenarios: ['决策', '人际', '价值'] },
      { dimension: 'J/P', count: 12, scenarios: ['计划', '时间', '应变'] }
    ]
  }
  
  console.log('批次分配:', batches.map(b => `${b.dimension}:${b.count}题`).join(', '))
  
  // 并发生成所有批次
  const promises = batches.map(batch => 
    generateQuestionsByDimension(profileData, batch.dimension, batch.count, batch.scenarios)
  )
  
  const results = await Promise.all(promises)
  
  // 合并所有题目
  const allQuestions = results.flat()
  console.log(`并发生成完成，总题目数：${allQuestions.length}`)
  
  // 打乱题目顺序，避免按维度聚集
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  
  return allQuestions
}

// POST: 启动快速并发生成任务
export async function POST(request: NextRequest) {
  try {
    const { profileData, questionCount } = await request.json()
    
    const taskId = generateTaskId()
    
    // 初始化任务
    taskStorage.set(taskId, {
      status: 'pending',
      startTime: Date.now(),
      progress: 0
    })
    
    // 启动并发生成
    generateQuestionsParallel(profileData, questionCount).then(questions => {
      taskStorage.set(taskId, {
        status: 'completed',
        questions: questions,
        startTime: taskStorage.get(taskId)!.startTime,
        progress: 100
      })
      console.log(`快速生成任务 ${taskId} 完成，题目数量：${questions.length}`)
    }).catch(error => {
      taskStorage.set(taskId, {
        status: 'failed',
        error: error.message,
        startTime: taskStorage.get(taskId)!.startTime,
        progress: 0
      })
      console.error(`快速生成任务 ${taskId} 失败:`, error.message)
    })
    
    return NextResponse.json({
      taskId,
      status: 'pending',
      message: '快速并发生成任务已启动，预计2-3分钟完成',
      estimatedTime: questionCount === 30 ? '2分钟' : '3分钟'
    })
  } catch (error: any) {
    console.error('启动快速生成任务失败:', error)
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
    
    if (!taskId) {
      return NextResponse.json(
        { error: '缺少taskId参数' },
        { status: 400 }
      )
    }
    
    const task = taskStorage.get(taskId)
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
      progress: task.progress || 0
    }
    
    if (task.status === 'completed') {
      response.questions = { questions: task.questions }
      // 清理任务
      setTimeout(() => taskStorage.delete(taskId), 30000)
    } else if (task.status === 'failed') {
      response.error = task.error
      setTimeout(() => taskStorage.delete(taskId), 30000)
    }
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('查询快速生成任务状态失败:', error)
    return NextResponse.json(
      { error: '查询任务状态失败: ' + error.message },
      { status: 500 }
    )
  }
}
