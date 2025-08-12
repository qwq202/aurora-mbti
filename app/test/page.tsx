"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { QUESTIONS, type Question, type Answers, computeMbti, getPersonalizedQuestions, type UserProfile, convertAIQuestionsToMBTI } from "@/lib/mbti"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { MbtiQuestion, type LikertValue } from "@/components/mbti-question"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check, RotateCcw, AlertTriangle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ANSWERS_KEY = "mbti_answers_v1"
const RESULT_KEY = "mbti_result_v1"
const PROFILE_KEY = "mbti_profile_v1"

export default function TestPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [showRepeatDialog, setShowRepeatDialog] = useState(false)
  const [showQuickFillDialog, setShowQuickFillDialog] = useState(false)
  
  // 加载个人资料和测试模式
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [testMode, setTestMode] = useState("standard")
  
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY)
      if (savedProfile) {
        const profile: UserProfile = JSON.parse(savedProfile)
        // 检查必填项是否完整
        const isComplete = profile.name && profile.age && profile.gender && profile.occupation
        if (isComplete) {
          setProfile(profile)
        } else {
          // 资料不完整，重定向到个人资料页面
          router.push('/profile')
          return
        }
      } else {
        // 没有资料，重定向到个人资料页面
        router.push('/profile')
        return
      }
      
      // 检查测试模式
      const savedTestMode = localStorage.getItem("mbti_test_mode_v1")
      if (savedTestMode) {
        setTestMode(savedTestMode)
      }
    } catch {
      router.push('/profile')
      return
    }
    setProfileLoaded(true)
  }, [router])
  
  // 根据测试模式加载题目
  const questions = useMemo(() => {
    if (!profile) return []
    
    if (testMode.startsWith("ai")) {
      // AI模式：从localStorage获取AI生成的题目
      try {
        const aiQuestions = localStorage.getItem("mbti_ai_questions_v1")
        if (aiQuestions) {
          const parsed = JSON.parse(aiQuestions)
          console.log('AI题目原始数据:', {
            count: parsed.length,
            firstFew: parsed.slice(0, 3).map((q: any) => ({ 
              id: q.id, 
              text: q.text?.substring(0, 30),
              dimension: q.dimension,
              agree: q.agree
            }))
          })
          
          // 转换AI题目为标准MBTI格式
          const convertedQuestions = convertAIQuestionsToMBTI(parsed)
          console.log('AI题目转换后:', {
            count: convertedQuestions.length,
            firstFew: convertedQuestions.slice(0, 3).map((q: Question) => ({ 
              id: q.id, 
              text: q.text?.substring(0, 30),
              dimension: q.dimension,
              agree: q.agree
            }))
          })
          
          return convertedQuestions
        }
      } catch (error) {
        console.error('AI题目加载失败:', error)
        // 如果AI题目加载失败，回退到标准模式
        return getPersonalizedQuestions(profile)
      }
    } else {
      // 非AI模式时，清理AI题目缓存，确保不会干扰
      try {
        localStorage.removeItem("mbti_ai_questions_v1")
      } catch {}
    }
    
    // 标准模式：使用个性化题库
    return getPersonalizedQuestions(profile)
  }, [profile, testMode])
  
  const total = questions.length

  const [answers, setAnswers] = useState<Answers>({})
  const currentQuestion: Question = useMemo(() => questions[step], [questions, step])
  const currentValue = answers[currentQuestion?.id] as LikertValue | undefined

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ANSWERS_KEY)
      if (saved) {
        const parsed: Answers = JSON.parse(saved)
        setAnswers(parsed)
        // Move to first unanswered
        const idx = questions.findIndex((q: Question) => !parsed[q.id])
        setStep(idx === -1 ? 0 : idx)
      }
    } catch {}
  }, [questions])
  
  // 监听测试模式变化，清理相关缓存
  useEffect(() => {
    if (!profileLoaded) return
    
    // 当测试模式改变时，清理之前的答案和结果缓存
    try {
      localStorage.removeItem(ANSWERS_KEY)
      localStorage.removeItem(RESULT_KEY)
      setAnswers({})
      setStep(0)
    } catch {}
  }, [testMode, profileLoaded])

  useEffect(() => {
    try {
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers))
    } catch {}
  }, [answers])

  const answeredCount = questions.filter((q: Question) => answers[q.id]).length
  const progress = Math.round((answeredCount / total) * 100)

  const onSetValue = (v: LikertValue) => {
    const newAnswers = { ...answers, [currentQuestion.id]: v }
    setAnswers(newAnswers)
    
    // 检查连续5题是否选择了相同答案
    if (step >= 4) {
      const recent5 = questions.slice(step - 4, step + 1)
      const recent5Values = recent5.map((q: Question) => newAnswers[q.id]).filter(Boolean)
      
      if (recent5Values.length === 5 && recent5Values.every((val: LikertValue) => val === v)) {
        setShowRepeatDialog(true)
      }
    }
  }

  const canPrev = step > 0
  const canNext = step < total - 1 && !!currentValue
  const canSubmit = answeredCount === total

  const goPrev = () => setStep((s) => Math.max(0, s - 1))
  const goNext = () => {
    if (!currentValue) return
    setStep((s) => Math.min(total - 1, s + 1))
  }
  const resetAll = () => {
    setAnswers({})
    setStep(0)
    try {
      localStorage.removeItem(ANSWERS_KEY)
      localStorage.removeItem(RESULT_KEY)
    } catch {}
  }

  // 快速填充所有题目为中立答案
  const fillAllNeutral = () => {
    const neutralAnswers: Answers = {}
    questions.forEach((q: Question) => {
      neutralAnswers[q.id] = 3 // 中立选项
    })
    setAnswers(neutralAnswers)
    setShowQuickFillDialog(false)
  }
  
  // 显示快速填充确认对话框
  const showQuickFillConfirm = () => {
    setShowQuickFillDialog(true)
  }

  const submit = () => {
    if (!canSubmit) return
    // 传入当前使用的题目数组（可能是AI生成的题目或标准题库）
    const result = computeMbti(answers, questions)
    try {
      localStorage.setItem(RESULT_KEY, JSON.stringify(result))
    } catch {}
    router.push("/result")
  }

  // 如果资料还没加载完成或没有题目，显示加载状态
  if (!profileLoaded || questions.length === 0) {
    return (
      <GradientBg className="min-h-[100dvh] bg-white">
        <SiteHeader />
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <Card className="rounded-2xl">
            <CardContent className="p-8 md:p-10 text-center">
              <div className="text-xl md:text-2xl font-semibold mb-3">正在准备个性化测试...</div>
              <p className="text-muted-foreground">请稍等片刻</p>
            </CardContent>
          </Card>
        </main>
      </GradientBg>
    )
  }

  return (
    <GradientBg className="min-h-[100dvh] bg-white">
      <SiteHeader className="backdrop-blur supports-[backdrop-filter]:bg-white/50 sticky top-0 border-b" />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground" aria-live="polite">
              已完成 {answeredCount} / {total}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground" onClick={showQuickFillConfirm}>
                快速填充
              </Button>
              <Button variant="ghost" className="rounded-xl text-muted-foreground" onClick={resetAll}>
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-muted rounded-full" />
        </div>

        <div className="grid gap-6">
          {/* 个人化提示 */}
          {profile && (
            <Card className="rounded-2xl bg-gradient-to-r from-emerald-50 to-fuchsia-50 border-emerald-200/50">
              <CardContent className="p-4 text-sm">
                <div className="flex items-center gap-2 text-emerald-700">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    {testMode.startsWith("ai") ? "AI个性化测试" : "个性化测试"}
                  </span>
                </div>
                <p className="text-emerald-600 mt-1">
                  {testMode.startsWith("ai") 
                    ? `AI为您定制了 ${total} 道题目，更贴合您的个人情况`
                    : `基于您的资料，我们为您精选了 ${total} 道更贴合的题目`
                  }
                </p>
              </CardContent>
            </Card>
          )}
          
          <MbtiQuestion
            index={step}
            total={total}
            text={currentQuestion?.text || ""}
            value={currentValue}
            onChange={onSetValue}
          />

          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={goPrev}
              variant="outline"
              className={cn("rounded-xl", !canPrev && "opacity-50 cursor-not-allowed")}
              disabled={!canPrev}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              上一题
            </Button>

            {step < total - 1 ? (
              <Button
                onClick={goNext}
                className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
                disabled={!canNext}
              >
                下一题
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
                disabled={!canSubmit}
              >
                查看结果
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-4 text-sm text-muted-foreground leading-relaxed">
              MBTI 仅用于自我探索与沟通协作参考，不作为临床诊断依据。请基于"多数情况下的你"作答。
            </CardContent>
          </Card>
        </div>
        
        {/* 连续答案提醒弹窗 */}
        <AlertDialog open={showRepeatDialog} onOpenChange={setShowRepeatDialog}>
          <AlertDialogContent className="max-w-md rounded-2xl border-muted/60">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <AlertDialogTitle className="text-lg">友好提醒</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-muted-foreground leading-relaxed">
                我们注意到您连续5题选择了相同答案。为了获得更准确的性格分析，建议您仔细阅读每道题目，根据真实感受作答。
                <br />
                <br />
                每个人都有独特的性格特质，诚实回答能帮您更好地认识自己。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction 
                className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
                onClick={() => setShowRepeatDialog(false)}
              >
                我知道了
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 快速填充确认对话框 */}
        <AlertDialog open={showQuickFillDialog} onOpenChange={setShowQuickFillDialog}>
          <AlertDialogContent className="rounded-2xl max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                确认快速填充
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left leading-relaxed">
                您确定要将所有剩余题目都填充为"中立"选项吗？
                <br />
                <br />
                这个操作将会：
                <br />
                • 将所有未回答的题目设为中立选项
                <br />
                • 可能影响测试结果的准确性
                <br />
                • 此操作不可撤销（除非手动重置）
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction 
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800"
                onClick={() => setShowQuickFillDialog(false)}
              >
                取消
              </AlertDialogAction>
              <AlertDialogAction 
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                onClick={fillAllNeutral}
              >
                确定填充
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </GradientBg>
  )
}
