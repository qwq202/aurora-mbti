"use client"

import { useEffect, useState } from "react"
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp } from "@/components/scroll-reveal"
import { LazyVideo } from "@/components/lazy-video"
import { type UserProfile } from "@/lib/mbti"
import { PROFILE_KEY } from "@/lib/constants"

export default function Page() {
  const t = useTranslations('home')
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        const profile: UserProfile = JSON.parse(saved)
        const isComplete = !!(profile.name && profile.age && profile.gender && profile.occupation)
        setHasProfile(isComplete)
      } else {
        setHasProfile(false)
      }
    } catch (error) {
      console.warn(":", error)
      setHasProfile(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <SiteHeader />
      
      <main>
        {/* --- Hero: Clean, Balanced, High Contrast --- */}
        <section className="pt-48 pb-32 px-6 lg:px-20 border-b border-zinc-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-4xl">
                <FadeIn>
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-12">
                  {t('hero.subtitle')}
                  </div>
                </FadeIn>
              <SlideUp>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] mb-16 text-zinc-900">
                  {t('hero.title')} <br />
                  <span className="text-zinc-300">{t('hero.titleHighlight')}</span>
                  </h1>
              </SlideUp>
                <SlideUp delay={200}>
                <div className="flex flex-col md:flex-row gap-12 items-baseline">
                  <p className="max-w-md text-xl text-zinc-500 font-medium leading-relaxed">
                    {t('hero.description')}
                  </p>
                     <Link href={hasProfile ? "/test-mode" : "/profile"}>
                    <button className="h-16 px-10 bg-zinc-900 text-white font-bold text-sm tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md">
                      {t('hero.cta')}
                    </button>
                    </Link>
                  </div>
                </SlideUp>
            </div>
          </div>
        </section>

        {/* --- Dual Section: Methodology & Technology --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-12 lg:p-24 border-b lg:border-b-0 lg:border-r border-zinc-100">
            <div className="max-w-md space-y-12">
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">{t('methodology.label')}</div>
              <h2 className="text-4xl font-bold tracking-tight">{t('methodology.title')}</h2>
              <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                {t('methodology.description')}
              </p>
              <div className="pt-8 border-t border-zinc-100">
                <Link href="/types" className="text-xs font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors">
                  {t('methodology.link')}
                </Link>
              </div>
            </div>
          </div>
          <div className="p-12 lg:p-24 border-b border-zinc-100">
            <div className="max-w-md space-y-12">
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">{t('technology.label')}</div>
              <h2 className="text-4xl font-bold tracking-tight">{t('technology.title')}</h2>
              <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                {t('technology.description')}
              </p>
            </div>
          </div>
        </section>

        {/* --- Visual Focus: Simple, Strong Video --- */}
        <section className="bg-zinc-50 py-32 border-b border-zinc-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="aspect-[21/9] w-full grayscale overflow-hidden mb-16 rounded-md">
                 <LazyVideo
                    src="/demo-video.mp4"
                    poster="/hero-image.jpeg"
                className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                    </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest text-xs">{t('features.scientific.title')}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">{t('features.scientific.description')}</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest text-xs">{t('features.personalized.title')}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">{t('features.personalized.description')}</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest text-xs">{t('features.intelligent.title')}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">{t('features.intelligent.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Final CTA: Clean, Centered --- */}
        <section className="py-48 px-6 text-center">
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

        <SiteFooter />
      </main>
    </div>
  )
}