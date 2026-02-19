"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp } from "@/components/scroll-reveal"
import { formatScoresForShare, type MbtiResult, type UserProfile, type Answers, type Question, typeDisplayInfo } from "@/lib/mbti"
import { getCommunicationStyle, type HistoryEntry, RESULT_KEY, ANSWERS_KEY, HISTORY_KEY, COMPARE_KEY } from "@/lib/result-helpers"
import { AI_ANALYSIS_KEY, AI_QUESTIONS_KEY, PROFILE_KEY, TEST_MODE_KEY, QUESTION_IDS_KEY } from "@/lib/constants"
import { type AIAnalysis } from "@/lib/ai-types"
import { RobustAnalysisClient } from "@/lib/robust-analysis-client"
import { Copy, Share2, Sparkles, Loader, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import dynamic from "next/dynamic"
import { type RadarScores } from "@/components/charts/RadarChart"
import { toFriendlyErrorMessage } from "@/lib/friendly-error"

const RadarChart = dynamic(() => import("@/components/charts/RadarChart").then(mod => ({ default: mod.RadarChart })), {
  loading: () => <div className="flex items-center justify-center h-[320px] text-zinc-400 font-bold uppercase tracking-widest text-[10px]">...</div>,
  ssr: false
})

export default function ResultPage() {
  const [loaded, setLoaded] = useState(false)
  const [result, setResult] = useState<MbtiResult | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [testMode, setTestMode] = useState<string>("standard")
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [streamingAnalysis, setStreamingAnalysis] = useState<string>('')
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [compareEntry, setCompareEntry] = useState<HistoryEntry | null>(null)
  const locale = useLocale()
  const t = useTranslations('result')
  const tCommon = useTranslations('common')
  const tHistory = useTranslations('history')
  const { toast } = useToast()

  useEffect(() => {
    try {
      const savedResult = localStorage.getItem(RESULT_KEY)
      if (savedResult) {
        const parsed = JSON.parse(savedResult) as MbtiResult
        setResult(parsed)
        // 静默上报匿名测试记录
        const savedProfile = localStorage.getItem(PROFILE_KEY)
        void fetch('/api/results/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result: parsed,
            profile: savedProfile ? JSON.parse(savedProfile) : null,
            locale,
          }),
        }).catch(() => {})
      }

      const savedProfile = localStorage.getItem(PROFILE_KEY)
      if (savedProfile) setProfile(JSON.parse(savedProfile) as UserProfile)

      const savedMode = localStorage.getItem(TEST_MODE_KEY)
      if (savedMode) setTestMode(savedMode)

      const savedCompare = localStorage.getItem(COMPARE_KEY)
      if (savedCompare) setCompareEntry(JSON.parse(savedCompare) as HistoryEntry)
      
      const savedAnalysis = localStorage.getItem(AI_ANALYSIS_KEY)
      if (savedAnalysis) setAiAnalysis(JSON.parse(savedAnalysis) as AIAnalysis)
    } catch (error) {
      console.warn(":", error)
    } finally {
      setLoaded(true)
    }
  }, [])

  const info = useMemo(() => (result ? typeDisplayInfo(result.type, locale) : null), [result, locale])

  const saveToHistory = () => {
    if (!result) return
    try {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        testMode,
        result,
        profile: profile ?? null,
      }
      const raw = localStorage.getItem(HISTORY_KEY)
      const list: HistoryEntry[] = raw ? (JSON.parse(raw) as HistoryEntry[]) : []
      list.unshift(entry)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 100)))
      toast({ title: tHistory('saved') })
    } catch (e) {
      toast({ title: tCommon('error'), variant: "destructive" })
    }
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: t('copied') })
      return
    } catch {}

    try {
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.top = "-9999px"
      el.style.left = "-9999px"
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      toast({ title: t('copied') })
    } catch (error) {
      console.warn("copy failed:", error)
      toast({ title: tCommon('error'), variant: "destructive" })
    }
  }

  const baseShareText = useMemo(() => {
    if (!result) return ""
    const title = `MBTI ${result.type}${info?.name ? ` - ${info.name}` : ""}`
    return [title, formatScoresForShare(result)].join("\n")
  }, [result, info?.name])

  const shareOrCopy = async () => {
    if (!result) return
    const url = typeof window !== "undefined" ? window.location.href : ""
    const text = url ? `${baseShareText}\n${url}` : baseShareText

    try {
      if (navigator.share && url) {
        await navigator.share({ title: `MBTI ${result.type}`, text, url })
        return
      }
      await copyText(text)
    } catch (error) {
      console.warn("share failed:", error)
      toast({ title: tCommon('error'), variant: "destructive" })
    }
  }

  const copyAIAnalysis = async () => {
    if (!result || !aiAnalysis) return
    const parts: string[] = [`MBTI ${result.type}${info?.name ? ` - ${info.name}` : ""}`]
    if (aiAnalysis.summary) parts.push(`${t('aiAnalysis.summary.label')}\n${aiAnalysis.summary}`)
    parts.push(`${t('aiAnalysis.career.label')}\n${aiAnalysis.careerGuidance}`)
    parts.push(`${t('aiAnalysis.growth.label')}\n${aiAnalysis.personalGrowth}`)
    await copyText(parts.join("\n\n"))
  }

  const generateAIAnalysis = async () => {
    if (!result || !profile || isAnalyzing) return
    setIsAnalyzing(true)
    setStreamingAnalysis('') 
    setAiAnalysis(null)
    
    try {
      const client = new RobustAnalysisClient()
      await new Promise<void>((resolve, reject) => {
        client.generateAnalysis({
          profile,
          answers: JSON.parse(localStorage.getItem(ANSWERS_KEY) || "{}") as Answers,
          questions: testMode.startsWith("ai")
            ? (JSON.parse(localStorage.getItem(AI_QUESTIONS_KEY) || "[]") as Question[])
            : [],
          mbtiResult: result,
          onProgress: (msg) => setStreamingAnalysis(msg),
          onSuccess: (analysis) => {
            setAiAnalysis(analysis)
            setStreamingAnalysis('')
            localStorage.setItem(AI_ANALYSIS_KEY, JSON.stringify(analysis))
            resolve()
          },
          onError: (err) => {
            setStreamingAnalysis('')
            const message = toFriendlyErrorMessage(err, locale)
            toast({ title: tCommon('error'), description: message, variant: "destructive" })
            reject(new Error(message))
          }
        })
      })
    } catch (error) {
      console.warn(":", error)
      setIsAnalyzing(false)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
        <SiteHeader />
        <main className="pt-48 pb-32 px-6 lg:px-20 text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto text-zinc-200 mb-8" />
          <h1 className="text-4xl font-bold tracking-tight">{tCommon('loading')}</h1>
        </main>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
        <SiteHeader />
        <main className="pt-48 pb-32 px-6 lg:px-20">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">{t('empty.label')}</div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t('empty.title')}</h1>
            <p className="text-lg text-zinc-500 font-medium leading-relaxed">{t('empty.description')}</p>
            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Link href="/test">
                <button className="h-14 px-8 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded-md hover:bg-black transition-all">
                  {tCommon('startTest')}
                </button>
              </Link>
              <Link href="/history">
                <button className="h-14 px-8 border border-zinc-100 text-zinc-900 font-bold text-xs uppercase tracking-widest rounded-md hover:border-zinc-900 transition-all">
                  {tCommon('history')}
                </button>
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter variant="minimal" />
      </div>
    )
  }

  const radarScores = result.scores as RadarScores
  const compareScores = compareEntry?.result?.scores as RadarScores | undefined

  const bars = [
    { title: t('dimensions.ei.title'), left: t('dimensions.ei.left'), right: t('dimensions.ei.right'), leftPct: result.scores.EI.percentFirst, rightPct: result.scores.EI.percentSecond },
    { title: t('dimensions.sn.title'), left: t('dimensions.sn.left'), right: t('dimensions.sn.right'), leftPct: result.scores.SN.percentFirst, rightPct: result.scores.SN.percentSecond },
    { title: t('dimensions.tf.title'), left: t('dimensions.tf.left'), right: t('dimensions.tf.right'), leftPct: result.scores.TF.percentFirst, rightPct: result.scores.TF.percentSecond },
    { title: t('dimensions.jp.title'), left: t('dimensions.jp.left'), right: t('dimensions.jp.right'), leftPct: result.scores.JP.percentFirst, rightPct: result.scores.JP.percentSecond },
  ]

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <SiteHeader />
      
      <main>
        {/* --- Hero: Results Overview --- */}
        <section className="pt-48 pb-32 px-6 lg:px-20 border-b border-zinc-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-4xl">
              <FadeIn>
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-12">
                  {t('hero.label')}
                </div>
              </FadeIn>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end">
                <div>
                  <SlideUp>
                    <h1 className="text-8xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8">
                      {result.type}
                    </h1>
                  </SlideUp>
                  <SlideUp delay={200}>
                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold tracking-tight text-zinc-900">{info?.name}</h2>
                      <p className="text-xl text-zinc-500 font-medium leading-relaxed max-w-md">
                        {info?.blurb}
                      </p>
                    </div>
                  </SlideUp>
                </div>
                <SlideUp delay={300}>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={saveToHistory}
                      className="h-14 px-8 border border-zinc-100 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded-md hover:text-zinc-900 hover:border-zinc-900 transition-all flex items-center gap-2"
                    >
                      <History className="w-3 h-3" />
                      {t('hero.saveToHistory')}
                    </button>
                    <button 
                      onClick={shareOrCopy}
                      className="h-14 px-8 bg-zinc-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-md hover:bg-black transition-all flex items-center gap-2"
                    >
                      <Share2 className="w-3 h-3" />
                      {t('hero.share')}
                    </button>
                  </div>
                </SlideUp>
              </div>
            </div>
          </div>
        </section>

        {/* --- Main Content: Metrics & Analysis --- */}
        <section className="py-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Left Col: Metrics */}
            <div className="lg:col-span-7 space-y-24">
              <div className="space-y-12">
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">{t('dimensions.label')}</div>
                <div className="grid gap-10">
                  {bars.map((b) => (
                    <div key={b.title} className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{b.title}</span>
                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                          <span className={b.leftPct > b.rightPct ? "text-zinc-900" : "text-zinc-300"}>{b.left} {b.leftPct}%</span>
                          <span className={b.rightPct > b.leftPct ? "text-zinc-900" : "text-zinc-300"}>{b.right} {b.rightPct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden flex">
                        <div className="h-full bg-zinc-900 transition-all duration-1000" style={{ width: `${b.leftPct}%` }} />
                        <div className="h-full bg-zinc-200 transition-all duration-1000" style={{ width: `${b.rightPct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-12">
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">{t('radar.label')}</div>
                <div className="p-12 border border-zinc-100 rounded-md bg-zinc-50/30 flex flex-col items-center">
                  <RadarChart
                    scores={radarScores}
                    size={400}
                    compareScores={compareScores}
                  />
                  {compareEntry && (
                    <div className="mt-8 text-[10px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-900" />
                        {t('radar.current')}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-300" />
                        {t('radar.compare', { type: compareEntry.result.type })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: AI Analysis & Insights */}
            <div className="lg:col-span-5 space-y-16">
              <div className="p-12 bg-zinc-900 text-white rounded-md space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('aiAnalysis.label')}</span>
                  </div>
                  {isAnalyzing && <Loader className="w-4 h-4 animate-spin text-zinc-500" />}
                </div>

                {!aiAnalysis && !streamingAnalysis ? (
                  <div className="space-y-8">
                    <p className="text-zinc-400 text-sm leading-loose">
                      {profile?.occupation || ''}
                    </p>
                    <button 
                      onClick={generateAIAnalysis}
                      disabled={isAnalyzing || !profile}
                      className="w-full h-14 bg-white text-zinc-900 font-bold text-xs uppercase tracking-widest rounded-md hover:bg-zinc-100 transition-all disabled:opacity-50"
                    >
                      {t('aiAnalysis.generate')}
                    </button>
                  </div>
                ) : (isAnalyzing || streamingAnalysis) && !aiAnalysis ? (
                  <div className="p-6 bg-white/5 rounded-md border border-white/10">
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {streamingAnalysis || t('aiAnalysis.generating')}
                      <span className="inline-block w-1.5 h-3 bg-white animate-pulse ml-1" />
                    </p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-10">
                    {aiAnalysis.summary && (
                      <div className="space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('aiAnalysis.summary.label')}</div>
                        <p className="text-sm leading-loose text-zinc-300">{aiAnalysis.summary}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-10">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">{t('aiAnalysis.career.label')}</div>
                        <p className="text-sm leading-loose text-zinc-300">{aiAnalysis.careerGuidance}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">{t('aiAnalysis.growth.label')}</div>
                        <p className="text-sm leading-loose text-zinc-300">{aiAnalysis.personalGrowth}</p>
                      </div>
                    </div>
                    <div className="pt-8 border-t border-white/10 flex gap-4">
                      <button 
                        onClick={() => setShowRegenerateDialog(true)}
                        className="flex-1 h-12 border border-white/20 text-white font-bold text-[10px] uppercase tracking-widest rounded-md hover:bg-white/5"
                      >
                        {t('aiAnalysis.actions.regenerate')}
                      </button>
                      <button 
                        onClick={copyAIAnalysis}
                        disabled={!aiAnalysis}
                        className="h-12 w-12 border border-white/20 text-white rounded-md flex items-center justify-center hover:bg-white/5"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-12 p-2">
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">{t('traits.label')}</div>
                <div className="space-y-10">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">{t('traits.strengths')}</h4>
                    <ul className="space-y-3">
                      {info?.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-500 flex items-start gap-3">
                          <div className="w-1 h-1 rounded-full bg-zinc-900 mt-2" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">{t('traits.communication')}</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {getCommunicationStyle(result.type, locale)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Footer CTA --- */}
        <section className="py-48 px-6 text-center border-t border-zinc-100">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900">
              {t('cta.title')}
            </h2>
            <div className="pt-12 flex flex-col md:flex-row justify-center gap-6">
              <Link href="/test" onClick={() => { localStorage.removeItem(RESULT_KEY); localStorage.removeItem(ANSWERS_KEY); localStorage.removeItem(QUESTION_IDS_KEY); }}>
                <button className="h-20 px-16 border border-zinc-900 text-zinc-900 font-bold text-lg tracking-widest uppercase hover:bg-zinc-50 transition-all active:scale-95 rounded-md">
                  {t('cta.retest')}
                </button>
              </Link>
              <Link href="/">
                <button className="h-20 px-16 bg-zinc-900 text-white font-bold text-lg tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md">
                  {t('cta.home')}
                </button>
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter variant="minimal" />
      </main>

      <ConfirmDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
        title={t('aiAnalysis.regenerateDialog.title')}
        description={t('aiAnalysis.regenerateDialog.description')}
        confirmText={t('aiAnalysis.regenerateDialog.confirm')}
        cancelText={t('aiAnalysis.regenerateDialog.cancel')}
        onConfirm={generateAIAnalysis}
      />
    </div>
  )
}
