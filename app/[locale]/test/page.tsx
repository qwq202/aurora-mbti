"use client"

import { useEffect, useMemo, useState, type SVGProps } from "react"
import { useRouter } from "@/i18n/routing"
import { useLocale, useTranslations } from "next-intl"
import { type Question, type Answers, type UserProfile, type AIQuestionInput, computeMbti, getPersonalizedQuestions, convertAIQuestionsToMBTI, getQuestions } from "@/lib/mbti"
import { ANSWERS_KEY, RESULT_KEY, PROFILE_KEY, TEST_MODE_KEY, AI_QUESTIONS_KEY } from "@/lib/constants"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp, SlideLeft, SlideRight } from "@/components/scroll-reveal"
import { MbtiQuestion, type LikertValue } from "@/components/mbti-question"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check, RotateCcw, AlertTriangle, User, Target, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"


export default function TestPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('test')
  const tCommon = useTranslations('common')
  const [step, setStep] = useState(0)
  const [showRepeatDialog, setShowRepeatDialog] = useState(false)
  const [showQuickFillDialog, setShowQuickFillDialog] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  // 
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [testMode, setTestMode] = useState("standard")
  
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
      
      const savedTestMode = localStorage.getItem(TEST_MODE_KEY)
      if (savedTestMode) {
        setTestMode(savedTestMode)
      }
    } catch (error) {
      console.warn(":", error)
      router.push('/profile')
      return
    }
    setProfileLoaded(true)
  }, [router])
  
  const questions = useMemo(() => {
    if (!profile) return []
    const localeQuestions = getQuestions(locale)
    
    if (testMode.startsWith("ai")) {
      try {
        const aiQuestions = localStorage.getItem(AI_QUESTIONS_KEY)
        if (aiQuestions) {
          return convertAIQuestionsToMBTI(JSON.parse(aiQuestions) as AIQuestionInput[])
        }
      } catch (error) {
        console.error('AI:', error)
        return getPersonalizedQuestions(profile, localeQuestions)
      }
    } else {
      try {
        localStorage.removeItem(AI_QUESTIONS_KEY)
      } catch (error) {
        console.warn("AI:", error)
      }
    }
    
    return getPersonalizedQuestions(profile, localeQuestions)
  }, [profile, testMode, locale])
  
  const total = questions.length

  const [answers, setAnswers] = useState<Answers>({})
  const currentQuestion: Question = useMemo(() => questions[step], [questions, step])
  const currentValue = answers[currentQuestion?.id] as LikertValue | undefined

  useEffect(() => {
    if (questions.length === 0) return
    
    try {
      const saved = localStorage.getItem(ANSWERS_KEY)
      if (saved) {
        const parsed: Answers = JSON.parse(saved)
        const matchedAnswers: Answers = {}
        questions.forEach(q => {
          if (parsed[q.id]) matchedAnswers[q.id] = parsed[q.id]
        })
        setAnswers(matchedAnswers)
        
        const idx = questions.findIndex((q: Question) => !matchedAnswers[q.id])
        setStep(idx === -1 ? 0 : idx)
      }
    } catch (error) {
      console.warn(":", error)
    }
  }, [questions])
  
  const [initialTestMode, setInitialTestMode] = useState<string>("")
  useEffect(() => {
    if (!profileLoaded) return
    if (!initialTestMode) {
      setInitialTestMode(testMode)
      return
    }
    
    if (testMode !== initialTestMode) {
      try {
        localStorage.removeItem(ANSWERS_KEY)
        localStorage.removeItem(RESULT_KEY)
        setAnswers({})
        setStep(0)
        setInitialTestMode(testMode)
      } catch (error) {
        console.warn(":", error)
      }
    }
  }, [testMode, profileLoaded, initialTestMode])

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers))
      } catch (error) {
        console.warn(":", error)
      }
    }
  }, [answers])

  const answeredCount = questions.filter((q: Question) => answers[q.id]).length
  const progress = Math.round((answeredCount / total) * 100)

  const onSetValue = (v: LikertValue) => {
    const newAnswers = { ...answers, [currentQuestion.id]: v }
    setAnswers(newAnswers)
    
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
    setShowResetConfirm(true)
  }

  const confirmResetAll = () => {
    setAnswers({})
    setStep(0)
    try {
      localStorage.removeItem(ANSWERS_KEY)
      localStorage.removeItem(RESULT_KEY)
    } catch (error) {
      console.warn(":", error)
    }
    setShowResetConfirm(false)
  }

  const fillAllNeutral = () => {
    const neutralAnswers: Answers = {}
    questions.forEach((q: Question) => {
      neutralAnswers[q.id] = 4
    })
    setAnswers(neutralAnswers)
    setShowQuickFillDialog(false)
  }

  const submit = () => {
    if (!canSubmit) return
    const result = computeMbti(answers, questions)
    try {
      localStorage.setItem(RESULT_KEY, JSON.stringify(result))
    } catch (error) {
      console.warn(":", error)
    }
    router.push("/result")
  }

  if (!profileLoaded || questions.length === 0) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
        <SiteHeader />
        <main className="pt-48 pb-32 px-6 lg:px-20 text-center">
          <LoaderIcon className="w-12 h-12 animate-spin mx-auto text-zinc-200 mb-8" />
          <h1 className="text-4xl font-bold tracking-tight">{tCommon('loading')}</h1>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <SiteHeader />
      
      <main>
        {/* --- Hero: Editorial Progress --- */}
        <section className="pt-48 pb-12 px-6 lg:px-20 border-b border-zinc-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-4xl">
              <FadeIn>
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-12">
                  {t('hero.label')}
                </div>
              </FadeIn>
              <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                <div className="flex-1 space-y-6">
                  <SlideUp>
                    <h1 className="text-6xl font-bold tracking-tight">
                      {progress}% <br />
                      <span className="text-zinc-300">{t('hero.progressLabel')}</span>
                    </h1>
                  </SlideUp>
                  <SlideUp delay={200}>
                    <p className="text-xl text-zinc-500 font-medium">
                      {t('hero.questionInfo', {
                        current: answeredCount,
                        total,
                        mode: testMode.startsWith("ai") ? t('hero.modeAI') : t('hero.modeStandard'),
                      })}
                    </p>
                  </SlideUp>
                </div>
                <SlideUp delay={300}>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowQuickFillDialog(true)}
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors"
                    >
                      {t('hero.quickFill')} // {tCommon('tags.auto')}
                    </button>
                    <button 
                      onClick={resetAll}
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-rose-500 transition-colors"
                    >
                      {t('hero.reset')} // {tCommon('tags.reset')}
                    </button>
                  </div>
                </SlideUp>
              </div>
            </div>
          </div>
        </section>

        {/* --- Question Area --- */}
        <section className="py-24 px-6 lg:px-20">
          <div className="max-w-3xl mx-auto space-y-12">
            <Progress value={progress} className="h-1 rounded-md bg-zinc-50 border border-zinc-100" />
            
            <FadeIn>
              <div className="relative">
                <MbtiQuestion
                  index={step}
                  total={total}
                  text={currentQuestion?.text || ""}
                  value={currentValue}
                  onChange={onSetValue}
                />
              </div>
            </FadeIn>

            <div className="flex items-center justify-between pt-12">
              <button
                onClick={goPrev}
                disabled={!canPrev}
                className="h-16 px-10 border border-zinc-100 text-zinc-400 font-bold text-xs tracking-widest uppercase hover:text-zinc-900 hover:border-zinc-900 transition-all rounded-md disabled:opacity-30 disabled:hover:border-zinc-100 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('actions.previous')}
              </button>

              {step < total - 1 ? (
                <button
                  onClick={goNext}
                  disabled={!canNext}
                  className="h-16 px-12 bg-zinc-900 text-white font-bold text-xs tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md disabled:opacity-30 flex items-center gap-2"
                >
                  {t('actions.next')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="h-16 px-12 bg-zinc-900 text-white font-bold text-xs tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md disabled:opacity-30 flex items-center gap-2"
                >
                  {t('actions.submit')}
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* --- Footer Note --- */}
        <section className="py-24 px-6 lg:px-20 border-t border-zinc-100 bg-zinc-50/50">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">{t('guidelines.label')}</div>
            <p className="text-sm text-zinc-400 font-medium leading-loose whitespace-pre-line">
              {t('guidelines.text')}
            </p>
          </div>
        </section>

        <SiteFooter variant="compact" />
      </main>

      {/* --- Dialogs --- */}
      <ConfirmDialog
        open={showRepeatDialog}
        onOpenChange={setShowRepeatDialog}
        title={t('dialogs.repeat.title')}
        description={t('dialogs.repeat.description')}
        confirmText={t('dialogs.repeat.continue')}
        variant="info"
        singleAction={true}
        onConfirm={() => setShowRepeatDialog(false)}
      />

      <ConfirmDialog
        open={showQuickFillDialog}
        onOpenChange={setShowQuickFillDialog}
        title={t('dialogs.quickFill.title')}
        description={t('dialogs.quickFill.description')}
        confirmText={t('dialogs.quickFill.proceed')}
        cancelText={t('dialogs.quickFill.cancel')}
        variant="warning"
        onConfirm={fillAllNeutral}
      />

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title={t('dialogs.reset.title')}
        description={t('dialogs.reset.description')}
        confirmText={t('dialogs.reset.confirm')}
        cancelText={t('dialogs.reset.cancel')}
        variant="destructive"
        onConfirm={confirmResetAll}
      />
    </div>
  )
}

function LoaderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="m16.2 4.8 2.9 2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 19.2 2.9-2.9" />
      <path d="M12 22v-4" />
      <path d="m4.8 19.2 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.8 4.8 2.9 2.9" />
    </svg>
  )
}
