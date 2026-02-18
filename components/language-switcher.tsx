"use client"

import { useEffect, useRef, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const prefetched = useRef<Set<string>>(new Set())
  const t = useTranslations('common')

  const prefetchLocale = (targetLocale: string) => {
    const key = `${targetLocale}:${pathname}`
    if (prefetched.current.has(key)) return
    prefetched.current.add(key)
    router.prefetch(pathname, { locale: targetLocale })
  }

  useEffect(() => {
    routing.locales
      .filter((loc) => loc !== locale)
      .forEach((loc) => prefetchLocale(loc))
  }, [locale, pathname])

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: newLocale, scroll: false })
    })
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(event) => switchLocale(event.target.value)}
        disabled={isPending}
        className="h-9 w-[84px] rounded-md border border-zinc-100 bg-white px-2 text-xs font-semibold text-zinc-700 outline-none transition-colors hover:border-zinc-300 focus:border-zinc-900 disabled:opacity-60"
        aria-label={t('language')}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(`languageOptions.${loc}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
