"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/routing"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp, SlideLeft, SlideRight } from "@/components/scroll-reveal"
import { type UserProfile, type Question, getPersonalizedQuestions, getQuestions } from "@/lib/mbti"
import { AI_QUESTIONS_KEY, ANSWERS_KEY, PROFILE_KEY, RESULT_KEY, TEST_MODE_KEY } from "@/lib/constants"
import { RobustAIClient } from "@/lib/robust-ai-client"
import { ArrowLeft, ArrowRight, Sparkles, Zap, Brain, Loader, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"


type TestMode = "standard" | "ai30" | "ai60" | "ai120"

type FollowupQuestion = {
  id: string
  question: string
  detail?: string
  required?: boolean
  expected_answer_type?: "short_text" | "long_text" | "multiple_choice"
}

export default function TestModePage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('testMode')
  const tCommon = useTranslations('common')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedMode, setSelectedMode] = useState<TestMode>("ai60")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [referrer, setReferrer] = useState<string>("/")
  const { toast } = useToast()
  const abortRef = useRef<AbortController | null>(null)

  const [resumeInfo, setResumeInfo] = useState<{ available: boolean; mode: TestMode | string; answered: number; total: number }>({ available: false, mode: "standard", answered: 0, total: 0 })
  const [followupQuestions, setFollowupQuestions] = useState<FollowupQuestion[]>([])
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({})
  const [isFollowupOpen, setIsFollowupOpen] = useState(false)
  const [isFollowupPromptOpen, setIsFollowupPromptOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [pendingGeneration, setPendingGeneration] = useState<{ questionCount: number } | null>(null)
  const [isFetchingFollowups, setIsFetchingFollowups] = useState(false)

  const generationPercent = useMemo(() => {
    if (!generationProgress.total) return 0
    const percent = (generationProgress.current / Math.max(generationProgress.total, 1)) * 100
    return Math.max(0, Math.min(100, Math.round(percent)))
  }, [generationProgress])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const from = urlParams.get('from')
    setReferrer(from === 'profile' ? '/profile' : '/')
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
        }
      } else {
        router.push('/profile')
      }
    } catch (error) {
      console.warn(":", error)
      router.push('/profile')
    }
  }, [router])

  useEffect(() => {
    try {
      const savedAnswersRaw = localStorage.getItem(ANSWERS_KEY)
      const lastMode = localStorage.getItem(TEST_MODE_KEY) || "standard"
      let answered = 0
      let total = 0
      
      if (savedAnswersRaw) {
        const parsed = JSON.parse(savedAnswersRaw) as Record<string, unknown>
        answered = Object.keys(parsed || {}).length
        
        if (answered > 0) {
          if (lastMode.startsWith("ai")) {
            const aiRaw = localStorage.getItem(AI_QUESTIONS_KEY)
            if (aiRaw) {
              const parsedQuestions = JSON.parse(aiRaw) as unknown
              total = Array.isArray(parsedQuestions) ? parsedQuestions.length : 0
            }
          } else if (profile) {
            total = getPersonalizedQuestions(profile, getQuestions(locale)).length
          }
        }
      }
      
      setResumeInfo({ 
        available: answered > 0 && total > 0, 
        mode: lastMode, 
        answered, 
        total 
      })
    } catch (error) {
      console.warn(":", error)
      setResumeInfo({ available: false, mode: "standard", answered: 0, total: 0 })
    }
  }, [profile, locale])

  const continueLast = () => {
    try {
      if (resumeInfo.mode) localStorage.setItem(TEST_MODE_KEY, String(resumeInfo.mode))
    } catch (error) {
      console.warn(":", error)
    }
    router.push('/test')
  }

  const resetProgress = () => {
    setShowClearConfirm(true)
  }

  const confirmResetProgress = () => {
    try {
      localStorage.removeItem(ANSWERS_KEY)
      localStorage.removeItem(RESULT_KEY)
      setResumeInfo((r) => ({ ...r, available: false, answered: 0 }))
      toast({ title: tCommon('success') })
    } catch (error) {
      console.warn(":", error)
    }
    setShowClearConfirm(false)
  }

  const startTest = async () => {
    if (!profile || isGenerating || isFetchingFollowups) return
    
    if (selectedMode === "standard") {
      try {
        localStorage.setItem(TEST_MODE_KEY, "standard")
        localStorage.removeItem(AI_QUESTIONS_KEY)
      } catch (error) {
        console.warn(":", error)
      }
      router.push("/test")
      return
    }

    const questionCount = selectedMode === "ai30" ? 30 : selectedMode === "ai60" ? 60 : 120

    try {
      setIsFetchingFollowups(true)
      const response = await fetch('/api/generate-profile-followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      })
      
      const data = await response.json()
      const followups = Array.isArray(data?.questions) ? data.questions : []
      
      if (followups.length > 0) {
        setFollowupQuestions(followups)
        setFollowupAnswers({})
        setPendingGeneration({ questionCount })
        setIsFollowupPromptOpen(true)
        return
      }
    } catch (error) {
      console.error(':', error)
    } finally {
      setIsFetchingFollowups(false)
    }

    await beginAIGeneration(questionCount, profile, {})
  }

  const beginAIGeneration = async (
    questionCount: number,
    baseProfile: UserProfile,
    extraClarifications: Record<string, string>
  ) => {
    const mergedClarifications = {
      ...(baseProfile.clarifications || {}),
      ...extraClarifications
    }

    const profileForGeneration: UserProfile = {
      ...baseProfile,
      clarifications: Object.keys(mergedClarifications).length ? mergedClarifications : undefined
    }

    setIsGenerating(true)
    setGenerationProgress({ current: 0, total: questionCount })
    
    try {
      const client = new RobustAIClient()
      await new Promise<void>((resolve, reject) => {
        client.generateQuestions({
          profile: profileForGeneration,
          questionCount,
          onProgress: (current: number, total: number) => {
            setGenerationProgress({ current, total })
          },
          onPreview: (previewQuestions: Question[]) => {
            setGenerationProgress((prev) => ({
              current: Math.min(previewQuestions.length, questionCount),
              total: prev.total || questionCount
            }))
          },
          onSuccess: (finalQuestions: Question[]) => {
            try {
              localStorage.setItem(AI_QUESTIONS_KEY, JSON.stringify(finalQuestions))
              localStorage.setItem(TEST_MODE_KEY, selectedMode)
            } catch (error) {
              console.warn("AI:", error)
            }
            resolve()
          },
          onError: (message: string) => reject(new Error(message))
        })
      })

      router.push('/test')
    } catch (error) {
      toast({
        title: tCommon('error'),
        description: t('errors.aiGeneration'),
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFollowupSkip = async () => {
    if (!profile || !pendingGeneration) return
    const { questionCount } = pendingGeneration
    setIsFollowupOpen(false)
    setIsFollowupPromptOpen(false)
    setPendingGeneration(null)
    await beginAIGeneration(questionCount, profile, {})
  }

  const handleFollowupConfirm = async () => {
    if (!profile || !pendingGeneration) return
    const { questionCount } = pendingGeneration
    
    const clarifications: Record<string, string> = {}
    followupQuestions.forEach((q) => {
      const ans = followupAnswers[q.id]
      if (ans?.trim()) clarifications[q.question.slice(0, 64)] = ans.trim()
    })

    setIsFollowupOpen(false)
    setIsFollowupPromptOpen(false)
    setPendingGeneration(null)
    await beginAIGeneration(questionCount, profile, clarifications)
  }

  const handleFollowupPromptProceed = () => {
    setIsFollowupPromptOpen(false)
    setIsFollowupOpen(true)
  }

  if (!profile) return null

  const modeOptions = [
    { id: "ai30", title: t('modes.ai30.title'), icon: <Zap className="w-6 h-6" />, count: t('modes.ai30.count'), time: t('modes.ai30.time'), desc: t('modes.ai30.description'), color: "text-zinc-400" },
    { id: "ai60", title: t('modes.ai60.title'), icon: <Brain className="w-6 h-6" />, count: t('modes.ai60.count'), time: t('modes.ai60.time'), desc: t('modes.ai60.description'), color: "text-zinc-900" },
    { id: "ai120", title: t('modes.ai120.title'), icon: <Sparkles className="w-6 h-6" />, count: t('modes.ai120.count'), time: t('modes.ai120.time'), desc: t('modes.ai120.description'), color: "text-zinc-400" },
  ] as const

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <SiteHeader />
      
      <main>
        {/* --- Hero: Editorial Style --- */}
        <section className="pt-48 pb-32 px-6 lg:px-20 border-b border-zinc-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-4xl">
              <FadeIn>
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-12">
                  {t('hero.label')}
                </div>
              </FadeIn>
              <SlideUp>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] mb-16">
                  {t('hero.title')} <br />
                  <span className="text-zinc-300">{t('hero.titleHighlight')}</span>
                </h1>
              </SlideUp>
              <div className="flex flex-col md:flex-row justify-between items-baseline gap-8">
                <SlideUp delay={200}>
                  <p className="max-w-md text-xl text-zinc-500 font-medium leading-relaxed">
                    {t('hero.description', { name: profile.name })}
                  </p>
                </SlideUp>
                <SlideUp delay={300}>
                  <Link href={referrer} className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors flex items-center gap-2">
                    <ArrowLeft className="w-3 h-3" />
                    {t('hero.back')}
                  </Link>
                </SlideUp>
              </div>
            </div>
          </div>
        </section>

        {/* --- Resume Info --- */}
        {resumeInfo.available && (
          <section className="px-6 lg:px-20 -mt-12 mb-12">
            <div className="max-w-7xl mx-auto">
              <FadeIn>
                <div className="p-8 bg-zinc-900 text-white rounded-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-zinc-300" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{t('resume.title')}</div>
                      <div className="text-sm text-zinc-400">
                        {t('resume.description', {
                          answered: resumeInfo.answered,
                          total: resumeInfo.total,
                          mode: resumeInfo.mode.startsWith('ai') ? t('resume.modeAI') : t('resume.modeStandard'),
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <button 
                      onClick={continueLast}
                      className="flex-1 md:flex-none h-14 px-8 bg-white text-zinc-900 font-bold text-xs uppercase tracking-widest rounded-md hover:bg-zinc-100 transition-all"
                    >
                      {t('resume.continue')}
                    </button>
                    <button 
                      onClick={resetProgress}
                      className="flex-1 md:flex-none h-14 px-8 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-md hover:bg-white/10 transition-all"
                    >
                      {t('resume.reset')}
                    </button>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>
        )}

        {/* --- Generation Progress --- */}
        {isGenerating && (
          <section className="px-6 lg:px-20 mb-24">
            <div className="max-w-7xl mx-auto">
              <FadeIn>
                <div className="p-12 border border-zinc-100 rounded-md bg-zinc-50/50">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-16 h-16 bg-zinc-900 text-white rounded-md flex items-center justify-center">
                      <Loader className="w-8 h-8 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold tracking-tight">{t('generating.title')}</div>
                      <div className="text-zinc-400 font-medium">
                        {t('generating.progress', {
                          percent: generationPercent,
                          current: generationProgress.current,
                          total: generationProgress.total,
                        })}
                      </div>
                    </div>
                  </div>
                  <Progress value={generationPercent} className="h-2 rounded-md bg-white border border-zinc-100" />
                  <p className="mt-8 text-xs font-bold uppercase tracking-widest text-zinc-300">
                    {t('generating.description')}
                  </p>
                </div>
              </FadeIn>
            </div>
          </section>
        )}

        {/* --- Mode Selection --- */}
        {!isGenerating && (
          <section className="py-24 px-6 lg:px-20">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                {modeOptions.map((mode) => (
                  <FadeIn key={mode.id}>
                    <div 
                      onClick={() => setSelectedMode(mode.id as TestMode)}
                      className={cn(
                        "group p-10 bg-white border rounded-md cursor-pointer transition-all duration-500 flex flex-col justify-between h-full",
                        selectedMode === mode.id ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-100 hover:border-zinc-300"
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-12">
                          <div className={cn("w-14 h-14 rounded-md flex items-center justify-center transition-colors", selectedMode === mode.id ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-900")}>
                            {mode.icon}
                          </div>
                          {selectedMode === mode.id && (
                            <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-zinc-900 text-white rounded-md">
                              {t('selected')}
                            </div>
                          )}
                        </div>
                        <div className="space-y-4 mb-12">
                          <h3 className="text-2xl font-bold tracking-tight">{mode.title}</h3>
                          <p className="text-zinc-500 font-medium leading-relaxed">
                            {mode.desc}
                          </p>
                        </div>
                      </div>
                      <div className="pt-8 border-t border-zinc-50 flex items-end justify-between">
                        <div>
                          <div className="text-3xl font-black tracking-tighter text-zinc-900">{mode.count} </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mt-1">{mode.time}</div>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <div className="text-center">
                <button 
                  onClick={startTest}
                  disabled={isFetchingFollowups}
                  className="h-16 px-16 bg-zinc-900 text-white font-bold text-lg tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md flex items-center justify-center gap-4 mx-auto disabled:opacity-50"
                >
                  {isFetchingFollowups ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {t('actions.initializing')}
                    </>
                  ) : (
                    <>
                      {t('actions.startGenerating')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
                  {t('actions.note')}
                </p>
              </div>
            </div>
          </section>
        )}

        <SiteFooter />
      </main>

      {/* --- Dialogs --- */}
      <ConfirmDialog
        open={isFollowupPromptOpen}
        onOpenChange={setIsFollowupPromptOpen}
        title={t('followup.prompt.title')}
        description={t('followup.prompt.description')}
        confirmText={t('followup.prompt.proceed')}
        cancelText={t('followup.prompt.skip')}
        variant="default"
        onConfirm={handleFollowupPromptProceed}
        onCancel={() => void handleFollowupSkip()}
      />

      <Dialog open={isFollowupOpen} onOpenChange={(open) => setIsFollowupOpen(open)}>
        <DialogContent
          className="max-w-2xl rounded-md border-zinc-100 bg-white shadow-2xl p-0 overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="p-10 border-b border-zinc-50">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold tracking-tight">{t('followup.form.title')}</DialogTitle>
              <DialogDescription className="text-zinc-400 font-medium mt-2">
                {t('followup.form.description')}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto">
            {followupQuestions.map((q) => {
              const value = followupAnswers[q.id] || ""
              const isLong = q.expected_answer_type === "long_text"
              return (
                <div key={q.id} className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-bold text-zinc-900">{q.question}</div>
                    {q.required && (
                      <span className="text-[10px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-md">{t('followup.form.required')}</span>
                    )}
                  </div>
                  {isLong ? (
                    <Textarea
                      placeholder={t('followup.form.longPlaceholder')}
                      value={value}
                      onChange={(e) => setFollowupAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="min-h-[120px] bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-900 transition-all rounded-md resize-none"
                    />
                  ) : (
                    <Input
                      placeholder={t('followup.form.shortPlaceholder')}
                      value={value}
                      onChange={(e) => setFollowupAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="h-14 bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-900 transition-all rounded-md"
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="p-10 bg-zinc-50/50 flex flex-col sm:flex-row justify-end gap-4 border-t border-zinc-50">
            <button
              onClick={handleFollowupSkip}
              className="h-14 px-8 border border-zinc-200 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded-md hover:text-zinc-900 hover:border-zinc-900 transition-all"
            >
              {t('followup.form.skip')}
            </button>
            <button
              onClick={handleFollowupConfirm}
              className="h-14 px-8 bg-zinc-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-md hover:bg-black transition-all"
            >
              {t('followup.form.submit')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title={t('resetConfirm.title')}
        description={t('resetConfirm.description')}
        confirmText={t('resetConfirm.confirm')}
        cancelText={t('resetConfirm.cancel')}
        variant="destructive"
        onConfirm={confirmResetProgress}
      />
    </div>
  )
}
