"use client"

import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"
import { Github } from "lucide-react"
import { LanguageSwitcher } from "./language-switcher"

export function SiteHeader(props: { className?: string }) {
  const { className = "" } = props
  const pathname = usePathname()
  const t = useTranslations('header')
  
  return (
    <header className={cn("fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 lg:px-20", className)}>
      <div className="h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase">Aurora MBTI</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-12 text-[10px] uppercase tracking-[0.2em] font-medium">
          <Link href="/types" className={cn("hover:text-zinc-900 transition-colors", pathname?.includes("/types") ? "text-zinc-900" : "text-zinc-400")}>{t('nav.types')}</Link>
          <Link href="/test" className={cn("hover:text-zinc-900 transition-colors", pathname?.includes("/test") ? "text-zinc-900" : "text-zinc-400")}>{t('nav.test')}</Link>
          <Link href="/history" className={cn("hover:text-zinc-900 transition-colors", pathname?.includes("/history") ? "text-zinc-900" : "text-zinc-400")}>{t('nav.history')}</Link>
          <Link href="/profile" className={cn("hover:text-zinc-900 transition-colors", pathname?.includes("/profile") ? "text-zinc-900" : "text-zinc-400")}>{t('nav.profile')}</Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href="https://github.com/qwq202/aurora-mbti"
            target="_blank"
            rel="noreferrer"
            aria-label={t('github')}
            title={t('github')}
            className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-zinc-100 text-zinc-500 hover:text-zinc-900 hover:border-zinc-900 transition-all active:scale-95"
          >
            <Github className="h-4 w-4" />
          </a>
          <Link href="/test-mode">
            <button className="h-10 px-6 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 rounded-md">
              {t('nav.test')}
            </button>
          </Link>
        </div>
      </div>
    </header>
  )
}
