"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp } from "@/components/scroll-reveal"
import { getCelebrities, getTypeGroups, getTypeInfoMap, type UserProfile } from "@/lib/mbti"
import { PROFILE_KEY } from "@/lib/constants"
import { Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"



export default function TypesPage() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const locale = useLocale()
  const t = useTranslations('types')
  const typeGroups = getTypeGroups(locale)
  const celebrities = getCelebrities(locale)
  const typeInfo = getTypeInfoMap(locale)

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
              <SlideUp delay={200}>
                <p className="max-w-xl text-xl text-zinc-500 font-medium leading-relaxed">
                  {t('hero.description')}
                </p>
              </SlideUp>
            </div>
          </div>
        </section>

        {/* --- Type Groups --- */}
        {typeGroups.map((group, gIdx) => (
          <section key={group.code} className="border-b border-zinc-100">
            <div className="grid grid-cols-1 lg:grid-cols-4">
              {/* Group Info Sidebar */}
              <div className="p-12 lg:p-20 lg:border-r border-zinc-100 bg-zinc-50/50">
                <div className="sticky top-32 space-y-8">
                  <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">
                    {t('groupLabel', { index: String(gIdx + 1).padStart(2, '0'), code: group.code })}
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">{group.title}</h2>
                  <p className="text-zinc-500 font-medium leading-relaxed">
                    {group.description}
                  </p>
                </div>
              </div>

              {/* Types Grid */}
              <div className="lg:col-span-3 p-6 lg:p-20 grid grid-cols-1 md:grid-cols-2 gap-8">
                {group.types.map((type) => {
                  const info = typeInfo[type]
                  const celebs = celebrities[type] || []
                  
                  return (
                    <FadeIn key={type}>
                      <div className="group h-full p-10 bg-white border border-zinc-100 rounded-md hover:border-zinc-900 transition-all duration-500">
                        <div className="flex items-start justify-between mb-12">
                          <div className="w-16 h-16 bg-zinc-900 text-white rounded-md flex items-center justify-center text-2xl font-black tracking-tighter">
                            {type}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 group-hover:text-zinc-900 transition-colors">
                            {info.vibe}
                          </div>
                        </div>

                        <div className="space-y-4 mb-12">
                          <h3 className="text-2xl font-bold tracking-tight">{info.name}</h3>
                          <p className="text-zinc-500 font-medium leading-relaxed">
                            {info.blurb}
                          </p>
                        </div>

                        <div className="pt-8 border-t border-zinc-50">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 mb-4">{t('groups.representatives')}</div>
                          <div className="flex flex-wrap gap-2">
                            {celebs.map((celeb) => (
                              <span key={celeb} className="text-[10px] font-bold px-3 py-1.5 bg-zinc-50 text-zinc-500 rounded-md">
                                {celeb}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  )
                })}
              </div>
            </div>
          </section>
        ))}

        {/* --- Final CTA --- */}
        <section className="py-48 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900">
              {t('cta.title')} <br />
              {t('cta.titleHighlight')}
            </h2>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed">
              {t('cta.description')}
            </p>
            <div className="pt-12">
              <Link href={hasProfile ? "/test-mode" : "/profile"}>
                <button className="h-16 px-16 bg-zinc-900 text-white font-bold text-lg tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md">
                  {t('cta.button')}
                </button>
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter activeLink="types" />
      </main>
    </div>
  )
}
