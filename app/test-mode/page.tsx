"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { type UserProfile, getPersonalizedQuestions, convertAIQuestionsToMBTI } from "@/lib/mbti"
import { ArrowLeft, ArrowRight, Sparkles, Zap, Brain, Loader } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const PROFILE_KEY = "mbti_profile_v1"

type TestMode = "standard" | "ai30" | "ai60" | "ai120"

export default function TestModePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedMode, setSelectedMode] = useState<TestMode>("ai60")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [referrer, setReferrer] = useState<string>("/") // 记录来源页面
  const { toast } = useToast()
  const abortRef = useRef<AbortController | null>(null)

  const ANSWERS_KEY = "mbti_answers_v1"
  const RESULT_KEY = "mbti_result_v1"
  const [resumeInfo, setResumeInfo] = useState<{ available: boolean; mode: TestMode | string; answered: number; total: number }>({ available: false, mode: "standard", answered: 0, total: 0 })

  // 检测用户来源
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const from = urlParams.get('from')
    if (from === 'profile') {
      setReferrer('/profile')
    } else {
      // 默认返回首页
      setReferrer('/')
    }
  }, [])

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY)
      if (savedProfile) {
        const profile: UserProfile = JSON.parse(savedProfile)
        const isComplete = profile.name && profile.age && profile.gender && profile.occupation
        if (isComplete) {
          setProfile(profile)
        } else {
          router.push('/profile')
          return
        }
      } else {
        router.push('/profile')
        return
      }
    } catch {
      router.push('/profile')
      return
    }
  }, [router])

  // 检测是否存在可恢复的进度
  useEffect(() => {
    try {
      const savedAnswersRaw = localStorage.getItem(ANSWERS_KEY)
      const lastMode = localStorage.getItem("mbti_test_mode_v1") || "standard"
      let answered = 0
      let total = 0
      let isCompatible = true
      
      console.log('🔍 检测恢复进度: hasAnswers=', !!savedAnswersRaw, 'lastMode=', lastMode, 'profile=', !!profile)
      
      if (savedAnswersRaw) {
        const parsed = JSON.parse(savedAnswersRaw)
        answered = Object.keys(parsed || {}).length
        
        console.log('📊 缓存答案详情: answered=', answered, 'answerIds=', Object.keys(parsed || {}).slice(0, 3), 'preview=', parsed)
        
        if (answered > 0) {
          // 检查答案格式
          const firstAnswerId = Object.keys(parsed)[0]
          const isAnswersFromAI = firstAnswerId?.startsWith('ai_')
          
          console.log('🔧 答案格式检查:', {
            firstAnswerId,
            isAnswersFromAI,
            note: '现在只有AI模式'
          })
          
          // 临时禁用清理逻辑，避免误删用户有效答案
          // 需要先修复AI题目ID生成问题
          isCompatible = true
          console.log('⚠️ 临时允许所有答案恢复，避免误删数据')
        }
        
        if (isCompatible) {
          if (lastMode.startsWith("ai")) {
            const aiRaw = localStorage.getItem('mbti_ai_questions_v1')
            if (aiRaw) total = (JSON.parse(aiRaw) || []).length
          } else if (profile) {
            total = getPersonalizedQuestions(profile).length
          }
        }
      }
      
      console.log('🎯 恢复信息结果:', {
        available: answered > 0 && total > 0 && isCompatible,
        answered,
        total,
        isCompatible,
        mode: lastMode
      })
      
      setResumeInfo({ 
        available: answered > 0 && total > 0 && isCompatible, 
        mode: lastMode, 
        answered, 
        total 
      })
    } catch (error) {
      console.error('💥 恢复检测失败:', error)
      setResumeInfo({ available: false, mode: "standard", answered: 0, total: 0 })
    }
  }, [profile])

  const continueLast = () => {
    // 不改写现有题目/模式，仅跳转
    try {
      if (resumeInfo.mode) localStorage.setItem("mbti_test_mode_v1", String(resumeInfo.mode))
    } catch {}
    router.push('/test')
  }

  const resetProgress = () => {
    try {
      localStorage.removeItem(ANSWERS_KEY)
      localStorage.removeItem(RESULT_KEY)
    } catch {}
    setResumeInfo((r) => ({ ...r, available: false, answered: 0 }))
  }

  // 组件卸载时取消未完成的流式请求，防止悬挂
  useEffect(() => {
    return () => {
      try { abortRef.current?.abort() } catch {}
      abortRef.current = null
    }
  }, [])

  const startTest = async () => {
    if (!profile) return
    
    if (selectedMode === "standard") {
      // 设置标准模式到localStorage
      try {
        localStorage.setItem("mbti_test_mode_v1", "standard")
        // 清理AI题目缓存，确保使用标准题库
        localStorage.removeItem("mbti_ai_questions_v1")
      } catch {}
      router.push("/test")
      return
    }

    // AI生成题目 - 批量生成
    setIsGenerating(true)
    try {
      const questionCount = selectedMode === "ai30" ? 30 : selectedMode === "ai60" ? 60 : 120
      
      // SSE流式生成模式
      await generateWithStreamingAPI(questionCount)
      router.push('/test')
      
    } catch (error) {
      console.error('Error generating questions:', error)
      toast({
        title: "生成失败",
        description: "AI题目生成失败，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setGenerationProgress({ current: 0, total: 0 })
    }
  }

  // 规范化并强制题量为指定数量
  const normalizeAndEnforceCount = (rawQuestions: any[], questionCount: number) => {
    const dims = ['EI','SN','TF','JP'] as const
    const toStrId = (v: any) => (v === undefined || v === null ? '' : String(v))
    const cleanText = (s: string) => s.replace(/^[\s\-\d.、)）]+/, '').trim()

    // 1) 去重（按文本）+ 基础清洗 + 合法化字段
    const seen = new Set<string>()
    const cleaned: Array<{id:string;text:string;dimension:typeof dims[number];agree:string}> = []
    for (const q of Array.isArray(rawQuestions) ? rawQuestions : []) {
      if (!q) continue
      const text = typeof q.text === 'string' ? cleanText(q.text) : ''
      let dim = (typeof q.dimension === 'string' && (dims as readonly string[]).includes(q.dimension)) ? q.dimension as typeof dims[number] : null
      if (!text || text.length < 5) continue
      const key = text.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      if (!dim) dim = dims[cleaned.length % 4]
      const agree = dim[0] // 规范化agree到维度的首字母
      cleaned.push({ id: toStrId(q.id ?? cleaned.length + 1), text, dimension: dim, agree })
    }

    // 2) 目标配额：尽量均衡四维度
    const base = Math.floor(questionCount / 4)
    const rem = questionCount % 4
    const targets: Record<typeof dims[number], number> = {
      EI: base + (rem > 0 ? 1 : 0),
      SN: base + (rem > 1 ? 1 : 0),
      TF: base + (rem > 2 ? 1 : 0),
      JP: base,
    }

    // 3) 将清洗后的题按维度入池
    const pools: Record<typeof dims[number], typeof cleaned> = { EI: [], SN: [], TF: [], JP: [] }
    for (const q of cleaned) pools[q.dimension].push(q)

    // 4) 备用占位题生成器
    const occ = profile?.occupation || '日常工作'
    const intr = Array.isArray(profile?.interests) && profile?.interests.length > 0 ? profile?.interests[0] : '兴趣'
    const fillerTextMap: Record<typeof dims[number], string[]> = {
      EI: [
        `在${occ}或与同事合作时，我更愿意主动表达想法并与他人讨论`,
        `面对团队任务，我通常会先与他人沟通以获取思路和反馈`,
      ],
      SN: [
        `学习与${intr}相关的新内容时，我更倾向于先掌握清晰的步骤与事实`,
        `处理问题时，我会优先关注已知细节与实际可行的方法`,
      ],
      TF: [
        `在做决策时，我会更看重逻辑一致性而非当下的情绪感受`,
        `遇到分歧时，我习惯基于客观标准来判断更合适的做法`,
      ],
      JP: [
        `规划日常或${occ}中的任务时，我更喜欢提前安排并按计划推进`,
        `开始一项工作前，我通常会先列出清单并有序完成`,
      ],
    }
    const fillerIdx: Record<typeof dims[number], number> = { EI: 0, SN: 0, TF: 0, JP: 0 }
    const takeFiller = (dim: typeof dims[number]) => {
      const list = fillerTextMap[dim]
      const idx = fillerIdx[dim]++ % list.length
      return { id: '', text: list[idx], dimension: dim, agree: dim[0] }
    }

    // 5) 轮转组装，严格达到目标配额与总题量
    const counts: Record<typeof dims[number], number> = { EI: 0, SN: 0, TF: 0, JP: 0 }
    const result: typeof cleaned = []
    while (result.length < questionCount) {
      let progressed = false
      for (const dim of dims) {
        if (counts[dim] >= targets[dim]) continue
        const q = pools[dim].shift() || takeFiller(dim)
        result.push(q)
        counts[dim]++
        progressed = true
        if (result.length >= questionCount) break
      }
      if (!progressed) break
    }

    // 6) 生成稳定 ai_ 前缀的ID，并保持数量精确
    // 先裁剪到目标数量，再通过转换器为每题生成稳定ID（基于 text/dimension/agree 哈希）
    const capped = result.slice(0, questionCount).map((q) => ({
      id: toStrId(q.id),
      text: q.text,
      dimension: q.dimension,
      agree: q.agree,
    }))
    const withStableIds = convertAIQuestionsToMBTI(capped)
    return withStableIds
  }

  // 流式输出防超时策略
  const generateWithStreamingAPI = async (questionCount: number) => {
    
    return new Promise((resolve, reject) => {
      // 创建可取消的控制器 + 看门狗
      const controller = new AbortController()
      // 若已有未完成请求，先中止
      try { abortRef.current?.abort() } catch {}
      abortRef.current = controller
      let lastActivity = Date.now()
      // 动态空闲超时：按题量给更充分的时间窗口
      const idleTimeoutMs = questionCount >= 120 ? 240000 : questionCount >= 60 ? 150000 : 90000
      const watchdog = setInterval(() => {
        if (Date.now() - lastActivity > idleTimeoutMs) {
          console.warn('流式生成超时，主动中止并尝试兜底解析')
          try { controller.abort() } catch {}
        }
      }, 5000)

      // 直接调用流式输出API
      fetch('/api/generate-questions-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: profile, questionCount }),
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`流式生成失败: ${response.status}`)
        }
        
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('无法读取响应流')
        }
        
        let accumulatedContent = ''
        let sseBuffer = ''
        let doneHandled = false
        
        // 初始化进度
        setGenerationProgress({ current: 0, total: questionCount })
        
        // 显示初始提示（只在开始时弹一次）
        toast({
          title: "开始生成个性化题目",
          description: `AI正在为您生成${questionCount}道题目，请查看下方进度条`,
        })
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // 累积SSE数据，按事件边界"\n\n"切分，保留未完成部分
          const chunk = new TextDecoder().decode(value)
          lastActivity = Date.now()
          sseBuffer += chunk
          const events = sseBuffer.split('\n\n')
          // 如果最后一段不是完整事件，先保留到下一轮
          sseBuffer = events.pop() || ''

          for (const evt of events) {
            // 提取每个事件中的 data 行（可容忍多行 data）
            const dataLines = evt.split('\n').filter(l => l.startsWith('data: '))
            if (dataLines.length === 0) continue
            const data = dataLines.map(l => l.slice(6).trim()).join('')

            try {
              const parsed = JSON.parse(data)

              // 处理心跳/启动事件，刷新活动时间，避免误中止
              if (parsed.type === 'start' || parsed.type === 'ping') {
                lastActivity = Date.now()
                continue
              }

              if (parsed.type === 'delta') {
                accumulatedContent = parsed.content

                // 实时解析已生成的题目数量：优先统计ID（数字或字符串），退化到统计文本字段
                const idMatches = accumulatedContent.match(/"id"\s*:\s*(?:"[^"]+"|\d+)/g) || []
                const textMatches = accumulatedContent.match(/"text"\s*:\s*"/g) || []
                const currentCount = Math.min(Math.max(idMatches.length, textMatches.length), questionCount)

                // 使用函数式更新，避免闭包中的旧状态导致卡住
                setGenerationProgress((prev) => {
                  if (currentCount > prev.current) {
                    return { current: currentCount, total: questionCount }
                  }
                  return prev
                })
                lastActivity = Date.now()
              } else if (parsed.type === 'done') {
                // 流结束，解析最终结果
                try {
                  const clean = (s: string) => s.replace(/```json|```/g, '').trim()

                  const extractObject = (raw: string): any | null => {
                    const cleaned = clean(raw)
                    const start = cleaned.indexOf('{')
                    const end = cleaned.lastIndexOf('}')
                    if (start >= 0 && end > start) {
                      // 先尝试整段解析
                      const slice = cleaned.slice(start, end + 1)
                      const sanitize = (s: string) => s.replace(/,\s*([}\]])/g, '$1')
                      try { return JSON.parse(slice) } catch {}
                      try { return JSON.parse(sanitize(slice)) } catch {}
                      // 再用括号平衡法找到最外层（忽略字符串中的花括号）
                      let balance = 0
                      let lastValid = -1
                      let inString = false
                      let escaped = false
                      for (let i = start; i <= end; i++) {
                        const ch = cleaned[i]
                        if (inString) {
                          if (escaped) {
                            escaped = false
                          } else if (ch === '\\') {
                            escaped = true
                          } else if (ch === '"') {
                            inString = false
                          }
                          continue
                        }
                        if (ch === '"') {
                          inString = true
                          continue
                        }
                        if (ch === '{') balance++
                        else if (ch === '}') {
                          balance--
                          if (balance === 0) lastValid = i
                        }
                      }
                      if (lastValid > start) {
                        const subslice = cleaned.slice(start, lastValid + 1)
                        try { return JSON.parse(subslice) } catch {}
                        try { return JSON.parse(sanitize(subslice)) } catch {}
                      }
                    }
                    return null
                  }

                  const result = extractObject(parsed.content) || extractObject(accumulatedContent)

                  let questions: any[] = []
                  if (result && Array.isArray(result.questions)) {
                    questions = result.questions
                  } else {
                    // 兜底：仅提取 questions 数组内容并包裹为对象
                    const cleaned = clean(parsed.content || accumulatedContent)
                    const qKey = cleaned.indexOf('"questions"')
                    if (qKey >= 0) {
                      const lb = cleaned.indexOf('[', qKey)
                      const rb = cleaned.lastIndexOf(']')
                      if (lb >= 0 && rb > lb) {
                        const arrayStr = cleaned.slice(lb, rb + 1)
                        try {
                          const arr = JSON.parse(arrayStr)
                          if (Array.isArray(arr)) {
                            questions = arr
                          }
                        } catch {}
                      }
                    }
                  }

                  if (Array.isArray(questions) && questions.length > 0) {
                    // 规范化并严格保证题量
                    const finalQs = normalizeAndEnforceCount(questions, questionCount)
                    // 保存到本地存储
                    localStorage.setItem('mbti_ai_questions_v1', JSON.stringify(finalQs))
                    localStorage.setItem('mbti_test_mode_v1', selectedMode)

                    // 更新最终进度：准确到指定数量
                    setGenerationProgress({ current: finalQs.length, total: questionCount })

                    toast({ 
                      title: '流式生成成功！', 
                      description: `AI已为您生成${finalQs.length}道个性化题目（已校验数量）`
                    })
                    doneHandled = true
                    resolve(finalQs)
                    return
                  }
                  // 无法直接解析，进入兜底流程：不在此处抛错/拒绝，留给循环结束后的兜底解析
                } catch (parseError) {
                  console.warn('done事件解析失败，将进入兜底解析')
                  // 不立即reject，等待循环结束后的兜底解析逻辑
                }
              } else if (parsed.type === 'error') {
                reject(new Error(parsed.error))
              }
            } catch (parseError) {
              // 忽略解析错误，继续读取
            }
          }
        }
        
        // 兜底：如果流已经结束但未处理完成，尝试用已累计内容再次解析
        if (!doneHandled && accumulatedContent) {
          console.log('🔄 开始兜底解析，原始内容长度:', accumulatedContent.length)
          try {
            // 多种清理策略
            const cleaningStrategies = [
              // 策略1：移除markdown代码块标记
              (content: string) => content.replace(/```json|```/g, '').trim(),
              // 策略2：移除所有非JSON字符
              (content: string) => content.replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim(),
              // 策略3：提取最后一个完整的JSON块
              (content: string) => {
                const matches = content.match(/\{[\s\S]*\}/g)
                return matches ? matches[matches.length - 1] : content
              },
              // 策略4：更激进的清理
              (content: string) => content.replace(/[^\x00-\x7F]/g, '').replace(/```json|```|```/g, '').trim()
            ]

            for (let i = 0; i < cleaningStrategies.length; i++) {
              const cleaned = cleaningStrategies[i](accumulatedContent)
              console.log(`🧹 策略${i + 1}清理后长度:`, cleaned.length)
              
              const start = cleaned.indexOf('{')
              const end = cleaned.lastIndexOf('}')
              if (start >= 0 && end > start) {
                let result: any
                const sanitize = (s: string) => s.replace(/,\s*([}\]])/g, '$1').replace(/,\s*$/, '')
                let slice = cleaned.slice(start, end + 1)
                
                const parseAttempts = [
                  () => JSON.parse(slice),
                  () => JSON.parse(sanitize(slice)),
                  () => {
                    // 括号平衡解析
                    let balance = 0
                    let lastValid = -1
                    let inString = false
                    let escaped = false
                    for (let j = start; j <= end; j++) {
                      const ch = cleaned[j]
                      if (inString) {
                        if (escaped) {
                          escaped = false
                        } else if (ch === '\\') {
                          escaped = true
                        } else if (ch === '"') {
                          inString = false
                        }
                        continue
                      }
                      if (ch === '"') {
                        inString = true
                        continue
                      }
                      if (ch === '{') balance++
                      else if (ch === '}') {
                        balance--
                        if (balance === 0) lastValid = j
                      }
                    }
                    if (lastValid > start) {
                      const subslice = cleaned.slice(start, lastValid + 1)
                      return JSON.parse(sanitize(subslice))
                    }
                    throw new Error('平衡括号解析失败')
                  }
                ]

                for (let j = 0; j < parseAttempts.length; j++) {
                  try {
                    result = parseAttempts[j]()
                    console.log(`✅ 解析方法${j + 1}成功`)
                    break
                  } catch (parseErr: any) {
                    console.log(`❌ 解析方法${j + 1}失败:`, parseErr?.message || parseErr)
                    if (j === parseAttempts.length - 1) throw parseErr
                  }
                }

                const questions = Array.isArray(result.questions) ? result.questions : 
                                 Array.isArray(result) ? result : []
                
                console.log('🎯 提取到题目数量:', questions.length)
                
                if (questions.length > 0) {
                  const finalQs = normalizeAndEnforceCount(questions, questionCount)
                  localStorage.setItem('mbti_ai_questions_v1', JSON.stringify(finalQs))
                  localStorage.setItem('mbti_test_mode_v1', selectedMode)
                  setGenerationProgress({ current: finalQs.length, total: questionCount })
                  toast({ title: '兜底解析成功！', description: `AI已为您生成${finalQs.length}道个性化题目` })
                  doneHandled = true
                  resolve(finalQs)
                  return
                }
              }
            }
          } catch (err: any) {
            console.error('🚫 兜底解析也失败:', err?.message || err)
          }
        }
        
        // 最终兜底：如果解析完全失败，提供详细调试信息
        if (!doneHandled) {
          console.warn('🔄 所有解析方法都失败，开始详细诊断')
          
          // 详细分析累积内容
          const errorDetails = {
            contentLength: accumulatedContent.length,
            hasOpenBrace: accumulatedContent.includes('{'),
            hasCloseBrace: accumulatedContent.includes('}'),
            hasQuestions: accumulatedContent.toLowerCase().includes('questions'),
            braceCount: {
              open: (accumulatedContent.match(/\{/g) || []).length,
              close: (accumulatedContent.match(/\}/g) || []).length
            },
            sample: accumulatedContent.substring(0, 300),
            fullContent: accumulatedContent.length < 2000 ? accumulatedContent : accumulatedContent.substring(0, 2000) + '...[截断]'
          }
          
          console.error('💥 解析失败完整诊断:', errorDetails)
          console.log('📄 完整内容输出:')
          console.log('='.repeat(50))
          console.log(errorDetails.fullContent)
          console.log('='.repeat(50))
          
          // 尝试最后一种解救方法：手动提取可能的题目文本
          let rescueQuestions: any[] = []
          try {
            // 尝试查找所有像题目的文本模式
            const textPattern = /"text"\s*:\s*"([^"]+)"/g
            const dimensionPattern = /"dimension"\s*:\s*"([^"]+)"/g
            const agreePattern = /"agree"\s*:\s*"([^"]+)"/g
            
            const texts = Array.from(accumulatedContent.matchAll(textPattern), m => m[1])
            const dimensions = Array.from(accumulatedContent.matchAll(dimensionPattern), m => m[1])
            const agrees = Array.from(accumulatedContent.matchAll(agreePattern), m => m[1])
            
            console.log('🔍 尝试模式匹配救援:', { texts: texts.length, dimensions: dimensions.length, agrees: agrees.length })
            
            if (texts.length > 0 && dimensions.length > 0 && agrees.length > 0) {
              const minLength = Math.min(texts.length, dimensions.length, agrees.length)
              for (let i = 0; i < minLength && i < questionCount; i++) {
                rescueQuestions.push({
                  id: `rescue_${i + 1}`,
                  text: texts[i],
                  dimension: dimensions[i] || 'EI',
                  agree: agrees[i] || 'E'
                })
              }
              
              if (rescueQuestions.length > 0) {
                console.log('🚑 模式匹配救援成功，恢复', rescueQuestions.length, '道题目')
                const finalQs = normalizeAndEnforceCount(rescueQuestions, questionCount)
                localStorage.setItem('mbti_ai_questions_v1', JSON.stringify(finalQs))
                localStorage.setItem('mbti_test_mode_v1', selectedMode)
                setGenerationProgress({ current: finalQs.length, total: questionCount })
                toast({ 
                  title: '紧急救援成功！', 
                  description: `通过模式匹配恢复了${finalQs.length}道题目，可能存在格式问题`,
                  variant: 'destructive'
                })
                resolve(finalQs)
                return
              }
            }
          } catch (rescueErr) {
            console.error('🚑 救援尝试也失败:', rescueErr)
          }
          
          // 最终失败，提供用户友好的错误信息
          const userFriendlyError = accumulatedContent.length === 0 
            ? '未收到任何AI响应内容'
            : errorDetails.braceCount.open === 0 
              ? 'AI响应不包含JSON格式数据' 
              : errorDetails.braceCount.open !== errorDetails.braceCount.close
                ? `JSON格式不完整（花括号不匹配：${errorDetails.braceCount.open}个开始，${errorDetails.braceCount.close}个结束）`
                : 'JSON格式无法解析，可能包含语法错误'
          
          reject(new Error(`AI题目生成失败：${userFriendlyError}。请重试或检查API配置。`))
        }
        
      }).catch(error => {
        console.error('流式生成错误:', error)
        setGenerationProgress({ current: 0, total: 0 })
        reject(error)
      }).finally(() => {
        try { clearInterval(watchdog) } catch {}
        abortRef.current = null
      })
    })
  }

  if (!profile) {
    return (
      <GradientBg className="min-h-[100dvh] bg-white">
        <SiteHeader />
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <Card className="rounded-2xl">
            <CardContent className="p-8 md:p-10 text-center">
              <div className="text-xl md:text-2xl font-semibold mb-3">正在加载...</div>
            </CardContent>
          </Card>
        </main>
      </GradientBg>
    )
  }

  return (
    <GradientBg className="min-h-[100dvh] bg-white">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <Link href={referrer} className="inline-flex items-center text-sm text-muted-foreground hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {referrer === '/profile' ? '返回资料页面' : '返回首页'}
          </Link>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold">选择测试模式</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              你好 {profile.name}！我们为您准备了三种测试模式，请选择最适合的方式
            </p>
          </div>
        </div>

        {/* 继续上次测试 */}
        {resumeInfo.available && (
          <Card className="rounded-2xl mb-6 border-emerald-200 bg-emerald-50/40">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm text-emerald-700 font-medium">检测到未完成的测试</div>
                <div className="text-sm text-emerald-600 mt-1">
                  进度：已完成 {resumeInfo.answered} / {resumeInfo.total} 题（{String(resumeInfo.mode).startsWith('ai') ? 'AI模式' : '标准模式'}）
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={continueLast} className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:opacity-90">
                  继续上次测试
                </Button>
                <Button onClick={resetProgress} variant="outline" className="rounded-xl bg-transparent">
                  清除进度
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 生成进度条 */}
        {isGenerating && generationProgress.total > 0 && (
          <Card className="rounded-2xl mb-6 border-fuchsia-200 bg-fuchsia-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-lg">AI正在生成个性化题目</div>
                  <div className="text-muted-foreground text-sm">
                    已生成 {generationProgress.current} / {generationProgress.total} 道题目
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Progress 
                  value={(generationProgress.current / generationProgress.total) * 100}
                  className="h-3 bg-white/50"
                />
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader className="w-3 h-3 animate-spin" />
                  <span>AI正在根据您的个人资料定制题目...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 xl:gap-8 mb-8">
          {/* AI精简模式 */}
          <Card 
            className={cn(
              "rounded-2xl cursor-pointer transition-all hover:shadow-md h-full",
              selectedMode === "ai30" && "ring-2 ring-fuchsia-500 bg-fuchsia-50/50"
            )}
            onClick={() => setSelectedMode("ai30")}
          >
            <CardHeader className="px-6 pt-6 pb-0">
              <CardTitle className="grid grid-cols-[2.5rem_1fr] items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center h-[40px]">
                  <div className="text-lg">AI精简版</div>
                  <div className="text-sm text-muted-foreground font-normal">智能生成题目</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                <div className="h-8 flex items-center">
                  <div className="text-2xl font-bold text-rose-600">30道题</div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 min-h-[120px]">
                  <div>• AI根据您的背景定制</div>
                  <div>• 题目更贴合个人情况</div>
                  <div>• 快速获得结果</div>
                  <div>• 答题约5-10分钟</div>
                  <div className="text-green-600 font-medium">• 一次性生成约需1-3分钟</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI深度模式 */}
          <Card 
            className={cn(
              "rounded-2xl cursor-pointer transition-all hover:shadow-md h-full",
              selectedMode === "ai60" && "ring-2 ring-fuchsia-500 bg-fuchsia-50/50"
            )}
            onClick={() => setSelectedMode("ai60")}
          >
            <CardHeader className="px-6 pt-6 pb-0">
              <CardTitle className="grid grid-cols-[2.5rem_1fr] items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center h-[40px]">
                  <div className="text-lg">AI深度版</div>
                  <div className="text-sm text-muted-foreground font-normal">全面个性化分析</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                <div className="h-8 flex items-center">
                  <div className="text-2xl font-bold text-fuchsia-600">60道题</div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 min-h-[120px]">
                  <div>• AI深度定制题目</div>
                  <div>• 全面覆盖各个维度</div>
                  <div>• 最详细的个性化分析</div>
                  <div>• 答题约15-20分钟</div>
                  <div className="text-blue-600 font-medium">• 一次性生成约需2-3分钟</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI精准模式（120题） */}
          <Card 
            className={cn(
              "rounded-2xl cursor-pointer transition-all hover:shadow-md h-full",
              selectedMode === "ai120" && "ring-2 ring-fuchsia-500 bg-fuchsia-50/50"
            )}
            onClick={() => setSelectedMode("ai120")}
          >
            <CardHeader className="px-6 pt-6 pb-0">
              <CardTitle className="grid grid-cols-[2.5rem_1fr] items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center h-[40px]">
                  <div className="text-lg">AI精准版</div>
                  <div className="text-sm text-muted-foreground font-normal">高准确性测评</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                <div className="h-8 flex items-center">
                  <div className="text-2xl font-bold text-indigo-600">120道题</div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 min-h-[120px]">
                  <div>• 高覆盖与精细分面</div>
                  <div>• 严谨措辞，降低歧义</div>
                  <div>• 维度与子维度均衡</div>
                  <div>• 答题约25-35分钟</div>
                  <div className="text-blue-600 font-medium">• 一次性生成约需3-5分钟</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={startTest}
            disabled={isGenerating}
            size="lg"
            className="rounded-2xl px-8 bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                AI正在生成题目...
              </>
            ) : (
              <>
                开始AI测试
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        <Card className="rounded-2xl mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              选择最适合您的测试模式，所有模式都将为您提供准确的MBTI性格分析结果。
            </p>
          </CardContent>
        </Card>
      </main>
    </GradientBg>
  )
}