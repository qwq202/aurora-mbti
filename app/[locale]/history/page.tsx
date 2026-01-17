"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/routing"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp } from "@/components/scroll-reveal"
import { type MbtiResult, type UserProfile, typeDisplayInfo, type Dimension, type DimensionScore } from "@/lib/mbti"
import { HISTORY_KEY, COMPARE_KEY } from "@/lib/result-helpers"
import { PROFILE_KEY } from "@/lib/constants"
import { ArrowLeft, Trash2, Target, History as HistoryIcon, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export type HistoryEntry = {
  id: string
  createdAt: number
  testMode?: string
  result: MbtiResult
  profile?: UserProfile | null
}

export default function HistoryPage() {
  const [list, setList] = useState<HistoryEntry[]>([])
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('history')
  const tCommon = useTranslations('common')
  const { toast } = useToast()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      const arr: HistoryEntry[] = raw ? (JSON.parse(raw) as HistoryEntry[]) : []
      setList(arr.sort((a, b) => b.createdAt - a.createdAt))

      const savedProfile = localStorage.getItem(PROFILE_KEY)
      if (savedProfile) {
        const profile: UserProfile = JSON.parse(savedProfile)
        setHasProfile(!!(profile.name && profile.age && profile.gender && profile.occupation))
      } else {
        setHasProfile(false)
      }
    } catch (error) {
      console.warn(":", error)
      setList([])
      setHasProfile(false)
    }
  }, [])

  const clearAll = () => {
    setShowClearConfirm(true)
  }

  const confirmClearAll = () => {
    try {
      localStorage.removeItem(HISTORY_KEY)
      setList([])
      toast({ title: t('cleared') })
    } catch (error) {
      console.warn(":", error)
      toast({ title: t('clearFailed'), variant: "destructive" })
    }
    setShowClearConfirm(false)
  }

  const removeOne = (id: string) => {
    const next = list.filter((x) => x.id !== id)
    setList(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    toast({ title: t('deleted') })
  }

  const setAsCompare = (entry: HistoryEntry) => {
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(entry))
      toast({ title: t('compareSet', { type: entry.result.type }) })
      router.push("/result")
    } catch {
      toast({ title: t('compareFailed'), variant: "destructive" })
    }
  }

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
                    {t('hero.description')}
                  </p>
                </SlideUp>
                <SlideUp delay={300}>
                  {list.length > 0 && (
                    <button 
                      onClick={clearAll}
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-rose-500 transition-colors"
                    >
                      {t('hero.clearAll')} // {tCommon('tags.resetAll')}
                    </button>
                  )}
                </SlideUp>
              </div>
            </div>
          </div>
        </section>

        {/* --- History List --- */}
        <section className="py-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            {list.length === 0 ? (
              <FadeIn>
                <div className="py-32 text-center border border-dashed border-zinc-100 rounded-md">
                  <div className="text-zinc-300 mb-8 flex justify-center">
                    <HistoryIcon className="w-12 h-12 stroke-[1]" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{t('empty.title')}</h3>
                  <p className="text-zinc-400 font-medium mb-12 max-w-sm mx-auto leading-relaxed">
                    {t('empty.description')}
                  </p>
                  <Link href={hasProfile ? "/test-mode" : "/profile"}>
                    <button className="h-14 px-10 bg-zinc-900 text-white font-bold text-xs tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md">
                      {t('empty.cta')}
                    </button>
                  </Link>
                </div>
              </FadeIn>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {list.map((e, idx) => {
                  const info = typeDisplayInfo(e.result.type, locale)
                  return (
                    <FadeIn key={e.id} delay={idx * 50}>
                      <div className="group p-8 bg-white border border-zinc-100 rounded-md hover:border-zinc-900 transition-all duration-500 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-start justify-between mb-10">
                            <div className="space-y-1">
                              <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {new Date(e.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {e.testMode?.startsWith('ai') ? t('entry.modeAI') : t('entry.modeStandard')}
                              </div>
                            </div>
                            <div className="text-[10px] font-black px-2 py-1 bg-zinc-50 rounded-md text-zinc-400">
                               {Math.round(e.result.confidence?.overall ?? 0)}%
                            </div>
                          </div>

                          <div className="mb-10">
                            <h2 className="text-5xl font-black tracking-tighter text-zinc-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-zinc-900 group-hover:to-zinc-400 transition-all">
                              {e.result.type}
                            </h2>
                            <div className="text-lg font-bold tracking-tight text-zinc-400 mb-4">{info?.name}</div>
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-2">
                              {info?.blurb}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-10 pt-8 border-t border-zinc-50">
                            {Object.entries(e.result.scores as Record<Dimension, DimensionScore>).map(([key, score]) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter text-zinc-300">
                                  <span>{key[0]}</span>
                                  <span>{key[1]}</span>
                                </div>
                                <div className="h-1 w-full bg-zinc-50 rounded-full overflow-hidden flex">
                                  <div className="h-full bg-zinc-900" style={{ width: `${score.percentFirst}%` }} />
                                  <div className="h-full bg-zinc-200" style={{ width: `${score.percentSecond}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-6">
                          <button 
                            onClick={() => setAsCompare(e)}
                            className="flex-1 h-12 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Target className="w-3 h-3" />
                            {t('entry.compare')}
                          </button>
                          <button 
                            onClick={() => removeOne(e.id)}
                            className="w-12 h-12 border border-zinc-100 text-zinc-300 hover:text-rose-500 hover:border-rose-100 rounded-md transition-all flex items-center justify-center"
                            title={t('entry.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </FadeIn>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-48 px-6 text-center border-t border-zinc-100">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-zinc-500 font-medium">
              {t('cta.description')}
            </p>
            <div className="pt-12">
              <Link href={hasProfile ? "/test-mode" : "/profile"}>
                <button className="h-20 px-16 bg-zinc-900 text-white font-bold text-lg tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md">
                  {t('cta.button')}
                </button>
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter activeLink="history" />
      </main>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title={t('clearConfirm.title')}
        description={t('clearConfirm.description')}
        confirmText={t('clearConfirm.confirm')}
        cancelText={t('clearConfirm.cancel')}
        variant="destructive"
        onConfirm={confirmClearAll}
      />
    </div>
  )
}
