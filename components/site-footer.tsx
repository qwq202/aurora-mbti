"use client"

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ProjectIterationDays } from './project-iteration-days'

export type SiteFooterVariant = "full" | "compact" | "minimal"

export function SiteFooter({
  variant = "full",
  activeLink,
}: {
  variant?: SiteFooterVariant
  activeLink?: "types" | "history"
}) {
  const t = useTranslations('footer')
  
  if (variant === "minimal") {
    return (
      <footer className="py-24 px-6 lg:px-20 border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <ProjectIterationDays />
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
            {t('copyright')}
          </div>
        </div>
      </footer>
    )
  }

  if (variant === "compact") {
    return (
      <footer className="py-24 px-6 lg:px-20 border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6">
            <div className="text-xl font-bold tracking-tighter uppercase text-zinc-900">Aurora MBTI</div>
            <p className="text-xs text-zinc-400 leading-loose uppercase tracking-widest">
              {t('tagline')}
            </p>
          </div>
          <ProjectIterationDays />
          <div className="space-y-4 text-xs font-bold uppercase tracking-widest text-zinc-300">
            <div>© 2026 AURORA MBTI</div>
            <div className="text-zinc-200">{t('madeWith')}</div>
          </div>
        </div>
      </footer>
    )
  }

  const typesLinkClass = `block hover:text-zinc-400 transition-colors${activeLink === "types" ? " text-zinc-900" : ""}`
  const historyLinkClass = `block hover:text-zinc-400 transition-colors${activeLink === "history" ? " text-zinc-900" : ""}`

  return (
    <footer className="py-24 px-6 lg:px-20 border-t border-zinc-100 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16">
        <div className="space-y-6">
          <div className="text-xl font-bold tracking-tighter uppercase text-zinc-900">Aurora MBTI</div>
          <p className="text-xs text-zinc-400 leading-loose uppercase tracking-widest">
            {t('taglineShort')}
          </p>
        </div>
        <div className="space-y-4 text-xs font-bold uppercase tracking-widest">
          <div className="text-zinc-300">{t('explore')}</div>
          <Link href="/types" className={typesLinkClass}>{t('links.types')}</Link>
          <Link href="/history" className={historyLinkClass}>{t('links.history')}</Link>
        </div>
        <div className="space-y-4 text-xs font-bold uppercase tracking-widest">
          <div className="text-zinc-300">{t('resources')}</div>
          <Link href="/cookies" className="block hover:text-zinc-400 transition-colors">{t('docs')}</Link>
          <Link href="/about" className="block hover:text-zinc-400 transition-colors">{t('links.about')}</Link>
          <a
            href="https://github.com/qwq202/aurora-mbti"
            target="_blank"
            rel="noreferrer"
            className="block hover:text-zinc-400 transition-colors"
          >
            GitHub
          </a>
        </div>
        <ProjectIterationDays />
        <div className="space-y-4 text-xs font-bold uppercase tracking-widest text-zinc-300">
          <div>© 2026 AURORA MBTI</div>
          <div className="text-zinc-200">{t('madeWith')}</div>
        </div>
      </div>
    </footer>
  )
}
