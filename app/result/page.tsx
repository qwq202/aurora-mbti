"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { formatScoresForShare, type MbtiResult, typeDisplayInfo, type UserProfile } from "@/lib/mbti"
import { ArrowLeft, Copy, Home, Share2, Sparkles, Star, Target, TrendingUp, Users, Loader } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const RESULT_KEY = "mbti_result_v1"
const ANSWERS_KEY = "mbti_answers_v1"

function getWorkEnvironment(type: string): string {
  const environments: Record<string, string> = {
    INTJ: "独立思考空间，长期项目规划，最小化不必要会议",
    INTP: "灵活自由的研究环境，允许深度探索，鼓励创新实验",
    ENTJ: "目标明确的领导岗位，快节奏决策环境，资源充足的团队",
    ENTP: "多样化挑战，头脑风暴文化，变化丰富的项目内容",
    INFJ: "价值导向的组织，一对一深度协作，有意义的工作内容",
    INFP: "创意表达空间，价值观契合，灵活的工作方式",
    ENFJ: "团队协作环境，人员发展机会，正面影响他人的平台",
    ENFP: "多元化团队，创意项目，人际互动丰富的环境",
    ISTJ: "稳定有序的流程，明确的角色职责，可预期的工作节奏",
    ISFJ: "支持型团队角色，和谐的人际关系，服务导向的文化",
    ESTJ: "结构化管理岗位，效率驱动环境，清晰的组织层级",
    ESFJ: "团队协调角色，人际关系重要，温暖的组织文化",
    ISTP: "动手实践机会，技术导向环境，独立解决问题的空间",
    ISFP: "创意表达自由，价值观包容，低压力的协作环境",
    ESTP: "快节奏行动环境，实际问题解决，多样化的挑战",
    ESFP: "活跃的团队氛围，人际互动频繁，正能量的工作文化"
  }
  return environments[type] || "多元化环境，发挥个人特长"
}

function getCommunicationStyle(type: string): string {
  const styles: Record<string, string> = {
    INTJ: "偏好简洁高效的沟通，喜欢事先准备，重视深度而非频率",
    INTP: "享受概念探讨，需要时间整理思路，欣赏逻辑清晰的对话",
    ENTJ: "直接明确的表达，快速决策导向，善于激励他人行动",
    ENTP: "思维跳跃式交流，喜欢辩论探讨，能够快速适应话题变化",
    INFJ: "一对一深度交流，重视情感共鸣，需要安全的表达环境",
    INFP: "真诚温和的沟通，重视个人价值观，需要被理解和接纳",
    ENFJ: "善于倾听他人，富有感染力，能够营造温暖的交流氛围",
    ENFP: "热情开放的交流，善于连接不同观点，喜欢启发性对话",
    ISTJ: "实事求是的表达，喜欢有条理的讨论，重视可靠的信息",
    ISFJ: "温和体贴的沟通，善于察觉他人需求，避免冲突和争执",
    ESTJ: "条理分明的表达，重视效率和结果，善于组织和协调",
    ESFJ: "温暖友好的交流，关注他人感受，善于维护团队和谐",
    ISTP: "简洁实用的表达，重视行动胜过言语，偏好一对一交流",
    ISFP: "温和包容的沟通，重视个人空间，通过行动表达关怀",
    ESTP: "直接活跃的交流，善于现场应对，喜欢实际的讨论内容",
    ESFP: "活泼热情的表达，善于调节气氛，重视积极的互动体验"
  }
  return styles[type] || "独特的沟通风格，善于表达个人观点"
}

function getPotentialChallenges(type: string): string {
  const challenges: Record<string, string> = {
    INTJ: "可能过于关注长远而忽略当下细节，有时显得不够灵活或难以妥协",
    INTP: "容易陷入分析瘫痪，可能拖延决策或忽视实际执行",
    ENTJ: "可能过于强势推进，忽略他人感受或细节考虑",
    ENTP: "容易分散注意力，可能缺乏持续性和深度聚焦",
    INFJ: "可能过度理想化，容易感到疲惫或承担过多责任",
    INFP: "可能过于敏感，在冲突面前容易退缩或纠结",
    ENFJ: "可能过度关注他人需求而忽略自己，容易感到负担过重",
    ENFP: "可能缺乏持续性，容易被新想法分散注意力",
    ISTJ: "可能过于依赖既定方式，在变化面前感到不适",
    ISFJ: "可能过度付出而忽视自己需求，难以拒绝他人",
    ESTJ: "可能过于注重效率而忽略人际关系的细腻处理",
    ESFJ: "可能过于在意他人评价，难以做出可能引起不满的决定",
    ISTP: "可能在长期规划方面较弱，沟通时过于简洁",
    ISFP: "可能在竞争环境中感到不适，难以主动推销自己",
    ESTP: "可能缺乏长远规划，在需要深度思考时感到不耐烦",
    ESFP: "可能难以处理批评，在压力下容易情绪化"
  }
  return challenges[type] || "每种性格类型都有其独特的挑战领域"
}

function getPracticalTips(type: string): string {
  const tips: Record<string, string> = {
    INTJ: "设置定期回顾检查点，主动征求他人反馈，培养灵活应变能力",
    INTP: "设定明确的截止日期，找到思考与行动的平衡点，寻找志同道合的合作伙伴",
    ENTJ: "练习倾听技巧，留出时间考虑他人观点，培养耐心和共情能力",
    ENTP: "使用任务管理工具，设置优先级，定期回顾和聚焦核心目标",
    INFJ: "学会设置边界，定期独处恢复能量，将理想分解为可行的步骤",
    INFP: "练习表达不同意见，寻找支持性环境，将价值观转化为具体行动",
    ENFJ: "学会说不，定期自我关怀，建立个人支持网络",
    ENFP: "使用提醒工具保持专注，寻找变化与稳定的平衡，培养完成项目的习惯",
    ISTJ: "小步尝试新方法，寻找变化中的规律，与开放型伙伴合作",
    ISFJ: "练习表达个人需求，学会适度拒绝，定期评估自己的付出与回报",
    ESTJ: "留出时间处理人际关系，练习换位思考，培养包容不同工作风格的能力",
    ESFJ: "建立自信心，练习基于事实而非他人反应做决定，寻求建设性反馈",
    ISTP: "制定简单的长期计划，练习更详细的沟通，主动分享想法和进展",
    ISFP: "寻找适合的表达方式，在支持性环境中展示能力，培养自信心",
    ESTP: "使用简单的规划工具，培养反思习惯，寻找长远目标的即时收益",
    ESFP: "学习接受建设性批评，培养情绪管理技巧，建立稳定的支持系统"
  }
  return tips[type] || "持续学习和自我发展是每个人的成长之路"
}

export default function ResultPage() {
  const [result, setResult] = useState<MbtiResult | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [testMode, setTestMode] = useState<string>("standard")
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [streamingAnalysis, setStreamingAnalysis] = useState<string>('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const isAiMode = useMemo(() => testMode?.startsWith("ai"), [testMode])
  const { toast } = useToast()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RESULT_KEY)
      if (saved) setResult(JSON.parse(saved))
      
      const savedProfile = localStorage.getItem("mbti_profile_v1")
      if (savedProfile) setProfile(JSON.parse(savedProfile))
      
      const savedTestMode = localStorage.getItem("mbti_test_mode_v1")
      if (savedTestMode) setTestMode(savedTestMode)
    } catch {}
  }, [])

  const generateAIAnalysis = async () => {
    if (!result || !profile || isAnalyzing) return
    
    setIsAnalyzing(true)
    setStreamingAnalysis('') 
    setAiAnalysis(null)  // 清空旧的分析结果
    
    try {
      const answers = JSON.parse(localStorage.getItem("mbti_answers_v1") || "{}")
      const questions = testMode.startsWith("ai") 
        ? JSON.parse(localStorage.getItem("mbti_ai_questions_v1") || "[]")
        : []
      
      // 使用流式分析API
      const response = await fetch('/api/generate-analysis-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile,
          answers,
          questions,
          mbtiResult: result
        })
      })

      if (!response.ok) {
        throw new Error(`流式分析失败: ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }
      
      let accumulatedContent = ''
      
      // 不显示初始提示toast，按钮状态已足够清楚
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        // 解析SSE数据
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'delta') {
                accumulatedContent = parsed.content
                // 实时更新流式分析内容（打字机效果）
                setStreamingAnalysis(parsed.content || accumulatedContent)
                
              } else if (parsed.type === 'done') {
                // 流结束，解析最终结果
                try {
                  // 解析JSON内容 - 添加验证机制
                  const jsonMatch = parsed.content.match(/\{[\s\S]*\}/)
                  if (jsonMatch) {
                    const jsonStr = jsonMatch[0]
                    
                    // 验证JSON是否完整（检查括号匹配）
                    const openBraces = (jsonStr.match(/\{/g) || []).length
                    const closeBraces = (jsonStr.match(/\}/g) || []).length
                    
                    if (openBraces !== closeBraces) {
                      console.log('分析JSON还不完整，继续等待...')
                      return
                    }
                    
                    const analysisResult = JSON.parse(jsonStr)
                    const analysis = analysisResult.analysis || {}
                    
                    setAiAnalysis(analysis)
                    setStreamingAnalysis('')  // 清空流式内容
                    
                    // 保存AI分析结果
                    localStorage.setItem('mbti_ai_analysis_v1', JSON.stringify(analysis))
                    
                    toast({ 
                      title: 'AI分析完成！', 
                      description: '个性化分析报告已生成，请查看下方内容'
                    })
                    
                    return
                  }
                  throw new Error('解析分析结果失败')
                } catch (parseError) {
                  console.error('解析分析结果失败:', parseError)
                  throw new Error('生成的分析结果格式无效')
                }
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error)
              }
            } catch (parseError) {
              // 忽略解析错误，继续读取
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error generating AI analysis:', error)
      setStreamingAnalysis('')
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "AI分析生成失败，请检查网络后重试",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyAnalysis = async () => {
    if (!aiAnalysis) return
    const { summary, strengths, challenges, recommendations, careerGuidance, personalGrowth, relationships } = aiAnalysis
    const text = [
      `【AI 个性化分析】`,
      summary ? `概述：${summary}` : "",
      strengths?.length ? `优势：\n- ${strengths.join("\n- ")}` : "",
      challenges?.length ? `挑战：\n- ${challenges.join("\n- ")}` : "",
      recommendations?.length ? `建议：\n- ${recommendations.join("\n- ")}` : "",
      careerGuidance ? `职业发展：${careerGuidance}` : "",
      personalGrowth ? `个人成长：${personalGrowth}` : "",
      relationships ? `人际关系：${relationships}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "复制成功",
        description: "AI分析内容已复制到剪贴板",
      })
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast({
        title: "复制失败",
        description: "无法访问剪贴板，请手动复制",
        variant: "destructive",
      })
    }
  }

  const handleRegenerateAnalysis = () => {
    setShowRegenerateDialog(true)
  }
  
  const confirmRegenerateAnalysis = async () => {
    setShowRegenerateDialog(false)
    try {
      localStorage.removeItem('mbti_ai_analysis_v1')
      setAiAnalysis(null)
      await generateAIAnalysis()
    } catch (error) {
      console.error('Error regenerating analysis:', error)
      toast({
        title: "重新生成失败",
        description: "重新生成AI分析时出错，请重试",
        variant: "destructive",
      })
    }
  }

  // 检查是否已有AI分析结果（本地缓存）
  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem('mbti_ai_analysis_v1')
      if (savedAnalysis) {
        setAiAnalysis(JSON.parse(savedAnalysis))
      }
    } catch {}
  }, [testMode])

  const info = useMemo(() => (result ? typeDisplayInfo(result.type) : null), [result])

  const share = async () => {
    if (!result) return
    // 获取当前网站的完整URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mbti.example.com'
    const text = `我的 MBTI 类型是 ${result.type}\n${formatScoresForShare(result)}\n来测一测你是哪一型：${baseUrl}`
    try {
      if (navigator.share) {
        await navigator.share({ title: "我的 MBTI 类型", text })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        toast({
          title: "复制成功",
          description: "测试结果已复制到剪贴板",
        })
      }
    } catch {
      toast({
        title: "分享失败",
        description: "无法分享或复制内容，请重试",
        variant: "destructive",
      })
    }
  }

  const copyBrief = async () => {
    if (!result) return
    const text = `MBTI: ${result.type}\n${formatScoresForShare(result)}`
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "复制成功",
        description: "简要结果已复制到剪贴板",
      })
    } catch {
      toast({
        title: "复制失败",
        description: "无法访问剪贴板，请重试",
        variant: "destructive",
      })
    }
  }

  const retake = () => {
    try {
      localStorage.removeItem(RESULT_KEY)
      localStorage.removeItem(ANSWERS_KEY)
    } catch {}
  }

  if (!result) {
    return (
      <GradientBg className="min-h-[100dvh] bg-white">
        <SiteHeader />
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <Card className="rounded-2xl">
            <CardContent className="p-8 md:p-10 text-center">
              <div className="text-xl md:text-2xl font-semibold mb-3">尚未生成结果</div>
              <p className="text-muted-foreground mb-6">请先完成测试，然后在这里查看你的个性类型与维度百分比。</p>
              <Link href="/test">
                <Button className="rounded-xl">
                  去开始测试
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </GradientBg>
    )
  }

  const dims = result.scores
  const gradient = info?.gradient || "from-fuchsia-500 to-rose-500"

  const bars: Array<{
    key: keyof typeof dims
    title: string
    left: string
    right: string
    leftPct: number
    rightPct: number
  }> = [
    {
      key: "EI",
      title: "能量来源",
      left: "E 外向",
      right: "I 内向",
      leftPct: dims.EI.percentFirst,
      rightPct: dims.EI.percentSecond,
    },
    {
      key: "SN",
      title: "信息获取",
      left: "S 事实",
      right: "N 直觉",
      leftPct: dims.SN.percentFirst,
      rightPct: dims.SN.percentSecond,
    },
    {
      key: "TF",
      title: "决策倾向",
      left: "T 思考",
      right: "F 情感",
      leftPct: dims.TF.percentFirst,
      rightPct: dims.TF.percentSecond,
    },
    {
      key: "JP",
      title: "生活方式",
      left: "J 计划",
      right: "P 自由",
      leftPct: dims.JP.percentFirst,
      rightPct: dims.JP.percentSecond,
    },
  ]

  return (
    <GradientBg className="min-h-[100dvh] bg-white">
      <SiteHeader className="backdrop-blur supports-[backdrop-filter]:bg-white/50 sticky top-0 border-b" />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
          <section>
            <div className={cn("rounded-3xl p-6 md:p-8 border relative overflow-hidden")}>
              <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", gradient)} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Link href="/" className="text-sm text-muted-foreground hover:underline flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    返回首页
                  </Link>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl bg-transparent" onClick={copyBrief}>
                      复制结果
                      <Copy className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
                      onClick={share}
                    >
                      分享
                      <Share2 className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground">你的 MBTI 类型</div>
                    <div className="text-4xl md:text-6xl font-semibold tracking-tight">
                      <span className={cn("text-transparent bg-clip-text bg-gradient-to-br", gradient)}>
                        {result.type}
                      </span>
                      <span className="ml-3 text-xl md:text-2xl text-muted-foreground">{info?.name}</span>
                    </div>
                    <div className="mt-3 text-sm md:text-base text-muted-foreground">{info?.blurb}</div>
                    <div className="mt-2 text-xs md:text-sm text-foreground/80">气质关键词：{info?.vibe}</div>
                  </div>
                  <div className="shrink-0">
                    <div
                      className={cn(
                        "w-28 h-28 md:w-32 md:h-32 rounded-2xl border flex items-center justify-center text-3xl md:text-4xl font-bold bg-gradient-to-br text-white shadow-sm",
                        gradient,
                      )}
                    >
                      {result.type}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {bars.map((b) => (
                <div key={b.key} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <div className="font-medium">{b.title}</div>
                    <div className="text-muted-foreground">
                      {b.left} · {b.right}
                    </div>
                  </div>
                  <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-emerald-400"
                      style={{ width: `${b.leftPct}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-rose-400"
                      style={{ width: `${b.rightPct}%` }}
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 flex items-center justify-between text-[10px] px-2 font-medium text-white/90">
                      <span>{b.leftPct}%</span>
                      <span>{b.rightPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 成长建议 - AI分析后移到左侧 */}
            {aiAnalysis && (
              <Card className="rounded-2xl mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="font-semibold">成长建议</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-foreground mb-2">🎯 发展方向</div>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {info?.growth.map((g, i) => (
                          <li key={`gr-${i}`}>{g}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/30">
                      <div className="text-sm font-medium text-foreground mb-2">⚡ 潜在挑战</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {getPotentialChallenges(result.type)}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/30">
                      <div className="text-sm font-medium text-foreground mb-2">💡 实用建议</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {getPracticalTips(result.type)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 下一步 - 移到左侧 */}
            <Card className="rounded-2xl mt-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="font-semibold">下一步</div>
                </div>
                <div className="grid gap-3">
                  <Link href="/test" onClick={retake}>
                    <Button variant="outline" className="w-full rounded-xl bg-transparent hover:bg-muted/50">
                      🔄 再测一次
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button className={cn("w-full rounded-xl text-white", `bg-gradient-to-br hover:opacity-90 ${gradient}`)}>
                      🏠 返回首页
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            {/* AI 个性化分析 */}
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="font-semibold">AI 个性化分析</div>
                  </div>
                  {isAiMode ? (
                    <span className="text-xs text-muted-foreground">AI 模式</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">基于你的资料与结果</span>
                  )}
                </div>

                {!aiAnalysis && !streamingAnalysis ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      由 AI 结合你的个人资料、答题与结果，生成更具针对性的解读与建议。
                    </p>
                    <Button
                      className={cn("w-full rounded-xl text-white", `bg-gradient-to-br hover:opacity-90 ${gradient}`)}
                      onClick={generateAIAnalysis}
                      disabled={isAnalyzing || !profile}
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          AI正在分析中...
                        </div>
                      ) : (
                        '生成AI分析'
                      )}
                    </Button>
                    {!profile && (
                      <p className="text-xs text-amber-600">需要先在资料页完善个人资料后再生成分析。</p>
                    )}
                  </div>
                ) : (isAnalyzing || streamingAnalysis) && !aiAnalysis ? (
                  // 流式分析内容（打字机效果）
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Loader className="h-4 w-4 animate-spin" />
                      AI正在生成个性化分析报告...
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg border border-dashed">
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {streamingAnalysis || '正在连接AI分析服务...'}
                        <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-muted/30">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={generateAIAnalysis}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            重新生成中...
                          </div>
                        ) : (
                          '重新生成分析'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-4">
                    {aiAnalysis.summary && (
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">🧭 概述</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.summary}</div>
                      </div>
                    )}
                    {Array.isArray(aiAnalysis.strengths) && aiAnalysis.strengths.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">✨ 优势</div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {aiAnalysis.strengths.map((s: string, i: number) => (
                            <li key={`a-st-${i}`}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(aiAnalysis.challenges) && aiAnalysis.challenges.length > 0 && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">⚠️ 潜在挑战</div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {aiAnalysis.challenges.map((c: string, i: number) => (
                            <li key={`a-ch-${i}`}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">💡 具体建议</div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {aiAnalysis.recommendations.map((r: string, i: number) => (
                            <li key={`a-re-${i}`}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiAnalysis.careerGuidance && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">🏹 职业发展建议</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.careerGuidance}</div>
                      </div>
                    )}
                    {aiAnalysis.personalGrowth && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">🌱 个人成长方向</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.personalGrowth}</div>
                      </div>
                    )}
                    {aiAnalysis.relationships && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">🤝 人际关系建议</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.relationships}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button variant="outline" className="rounded-xl bg-transparent" onClick={copyAnalysis}>
                        复制分析
                        <Copy className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        className={cn("rounded-xl text-white", `bg-gradient-to-br hover:opacity-90 ${gradient}`)} 
                        onClick={handleRegenerateAnalysis}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            重新生成中...
                          </div>
                        ) : (
                          <>
                            重新生成
                            <Sparkles className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">分析已自动保存到本地，仅你可见。</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                    <Star className="w-4 h-4" />
                  </div>
                  <div className="font-semibold">你的独特风格</div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-foreground mb-2">✨ 核心优势</div>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {info?.strengths.map((s, i) => (
                        <li key={`st-${i}`}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-muted/30">
                    <div className="text-sm font-medium text-foreground mb-2">🎯 适合的工作环境</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {getWorkEnvironment(result.type)}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-muted/30">
                    <div className="text-sm font-medium text-foreground mb-2">🤝 沟通偏好</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {getCommunicationStyle(result.type)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 成长建议 - AI分析生成后移到左侧，右侧不再显示 */}
            {!aiAnalysis && (
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="font-semibold">成长建议</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-foreground mb-2">🎯 发展方向</div>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {info?.growth.map((g, i) => (
                          <li key={`gr-${i}`}>{g}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/30">
                      <div className="text-sm font-medium text-foreground mb-2">⚡ 潜在挑战</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {getPotentialChallenges(result.type)}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/30">
                      <div className="text-sm font-medium text-foreground mb-2">💡 实用建议</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {getPracticalTips(result.type)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


          </aside>
        </div>
      </main>
      <footer className="py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Aurora MBTI · 仅供娱乐与自我探索，不作为临床诊断依据
        </div>
      </footer>

      <ConfirmDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
        title="重新生成AI分析"
        description="确定要重新生成AI分析吗？这将覆盖当前的分析结果。"
        confirmText="重新生成"
        cancelText="取消"
        variant="default"
        onConfirm={confirmRegenerateAnalysis}
      />
    </GradientBg>
  )
}
