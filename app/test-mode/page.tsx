"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

    // AI生成题目 - 使用快速并发生成API提升速度
    setIsGenerating(true)
    try {
      const questionCount = selectedMode === "ai30" ? 30 : 60
      
      // 显示生成开始提示
      toast({
        title: "AI正在生成题目...",
        description: `正在为您生成${questionCount}道个性化题目，请稍等片刻`,
      })
      
      // 一次性同步生成 - 使用新的同步并发API
      const response = await fetch('/api/generate-questions-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileData: profile,
          questionCount
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `生成失败 (状态码: ${response.status})`)
      }

      const data = await response.json()
      console.log('AI生成完成:', data)
      console.log('API响应结构分析:', {
        hasQuestions: !!data.questions,
        questionsType: typeof data.questions,
        questionsKeys: data.questions ? Object.keys(data.questions) : 'N/A',
        dataKeys: Object.keys(data),
        fullResponse: data
      })
      
      // 处理同步API响应格式
      const questions = data.questions || []
      
      if (Array.isArray(questions) && questions.length > 0) {
        // 保存题目并跳转
        localStorage.setItem('mbti_ai_questions_v1', JSON.stringify(questions))
        localStorage.setItem('mbti_test_mode_v1', selectedMode)
        
        toast({
          title: "生成成功！",
          description: `AI已为您生成${questions.length}道个性化题目`,
        })
        
        router.push("/test")
        return
      } else {
        throw new Error(`生成的题目格式无效 (获得${questions.length}道题目)`)
      }
      
    } catch (error) {
      console.error('Error generating questions:', error)
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "AI题目生成失败，请检查网络后重试",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
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
                  <div className="text-amber-600 font-medium">• AI生成约需5分钟</div>
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
                  <div className="text-amber-600 font-medium">• AI生成约需5-10分钟</div>
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
                AI正在生成题目...({selectedMode === "ai30" ? "约5分钟" : "约5-10分钟"})
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
              <strong>AI模式说明：</strong>我们的AI会根据您的年龄、职业、教育背景等信息，生成最适合您的个性化题目。
              这些题目更贴近您的生活场景，能够更准确地反映您的性格特征。
            </p>
          </CardContent>
        </Card>
      </main>
    </GradientBg>
  )
}