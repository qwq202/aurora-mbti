"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { type UserProfile } from "@/lib/mbti"
import { ArrowLeft, ArrowRight, Sparkles, Zap, Brain, Loader } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const PROFILE_KEY = "mbti_profile_v1"

type TestMode = "standard" | "ai30" | "ai60"

export default function TestModePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedMode, setSelectedMode] = useState<TestMode>("standard")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const { toast } = useToast()

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
      const questionCount = selectedMode === "ai30" ? 30 : 60
      
      // SSE流式生成模式
      await generateWithStreamingAPI(questionCount)
      router.push('/test')
      
    } catch (error) {
      console.error('Error generating questions:', error)
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "AI题目生成失败，请检查网络后重试",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setGenerationProgress({ current: 0, total: 0 })
    }
  }

  // 流式输出防超时策略
  const generateWithStreamingAPI = async (questionCount: number) => {
    
    return new Promise((resolve, reject) => {
      // 直接调用流式输出API
      fetch('/api/generate-questions-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: profile, questionCount })
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`流式生成失败: ${response.status}`)
        }
        
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('无法读取响应流')
        }
        
        let accumulatedContent = ''
        
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
                  
                  // 实时解析已生成的题目数量
                  const questionMatches = accumulatedContent.match(/"id"\s*:\s*"\d+"/g) || []
                  const currentCount = questionMatches.length
                  
                  // 只更新进度状态，不弹toast（避免频繁弹窗）
                  if (currentCount > generationProgress.current) {
                    setGenerationProgress({ current: currentCount, total: questionCount })
                  }
                } else if (parsed.type === 'done') {
                  // 流结束，解析最终结果
                  try {
                    // 解析JSON内容 - 添加更严格的验证
                    const jsonMatch = parsed.content.match(/\{[\s\S]*\}/)
                    if (jsonMatch) {
                      const jsonStr = jsonMatch[0]
                      
                      // 验证JSON是否完整（简单检查括号匹配）
                      const openBraces = (jsonStr.match(/\{/g) || []).length
                      const closeBraces = (jsonStr.match(/\}/g) || []).length
                      
                      if (openBraces !== closeBraces) {
                        console.log('JSON还不完整，继续等待...')
                        return
                      }
                      
                      const result = JSON.parse(jsonStr)
                      const questions = result.questions || []
                      
                      if (Array.isArray(questions) && questions.length > 0) {
                        // 保存到本地存储
                        localStorage.setItem('mbti_ai_questions_v1', JSON.stringify(questions))
                        localStorage.setItem('mbti_test_mode_v1', selectedMode)
                        
                        // 更新最终进度
                        setGenerationProgress({ current: questions.length, total: questionCount })
                        
                        toast({ 
                          title: '流式生成成功！', 
                          description: `AI已为您生成${questions.length}道个性化题目`
                        })
                        
                        resolve(questions)
                        return
                      }
                    }
                    throw new Error('解析生成结果失败')
                  } catch (parseError) {
                    console.error('解析生成结果失败:', parseError)
                    reject(new Error('生成的题目格式无效'))
                    return
                  }
                } else if (parsed.type === 'error') {
                  reject(new Error(parsed.error))
                  return
                }
              } catch (parseError) {
                // 忽略解析错误，继续读取
              }
            }
          }
        }
        
      }).catch(error => {
        console.error('流式生成错误:', error)
        setGenerationProgress({ current: 0, total: 0 })
        reject(error)
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
          <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回资料页面
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
                <div className="flex justify-between text-sm">
                  <span>生成进度</span>
                  <span className="font-semibold">
                    {Math.round((generationProgress.current / generationProgress.total) * 100)}%
                  </span>
                </div>
                
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

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* 标准模式 */}
          <Card 
            className={cn(
              "rounded-2xl cursor-pointer transition-all hover:shadow-md",
              selectedMode === "standard" && "ring-2 ring-fuchsia-500 bg-fuchsia-50/50"
            )}
            onClick={() => setSelectedMode("standard")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-fuchsia-500 text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg">标准模式</div>
                  <div className="text-sm text-muted-foreground font-normal">经典MBTI题库</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-emerald-600">60道题</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• 基于经典MBTI理论</div>
                  <div>• 根据您的资料个性化筛选</div>
                  <div>• 结果稳定可靠</div>
                  <div>• 用时约10-15分钟</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI精简模式 */}
          <Card 
            className={cn(
              "rounded-2xl cursor-pointer transition-all hover:shadow-md",
              selectedMode === "ai30" && "ring-2 ring-fuchsia-500 bg-fuchsia-50/50"
            )}
            onClick={() => setSelectedMode("ai30")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg">AI精简版</div>
                  <div className="text-sm text-muted-foreground font-normal">智能生成题目</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-rose-600">30道题</div>
                <div className="text-sm text-muted-foreground space-y-1">
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
              "rounded-2xl cursor-pointer transition-all hover:shadow-md",
              selectedMode === "ai60" && "ring-2 ring-fuchsia-500 bg-fuchsia-50/50"
            )}
            onClick={() => setSelectedMode("ai60")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg">AI深度版</div>
                  <div className="text-sm text-muted-foreground font-normal">全面个性化分析</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-fuchsia-600">60道题</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• AI深度定制题目</div>
                  <div>• 全面覆盖各个维度</div>
                  <div>• 最详细的个性化分析</div>
                  <div>• 答题约15-20分钟</div>
                  <div className="text-blue-600 font-medium">• 一次性生成约需2-3分钟</div>
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
                开始{selectedMode === "standard" ? "标准" : "AI"}测试
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