"use client"

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('common')

  const switchLocale = (newLocale: string) => {
    // Remove current locale from pathname
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    // Navigate to new locale
    router.replace(pathnameWithoutLocale, { locale: newLocale })
  }

  return (
    <div className="flex items-center gap-2 border border-zinc-100 rounded-md overflow-hidden">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={cn(
            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
            locale === loc
              ? "bg-zinc-900 text-white"
              : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
          )}
        >
          {t(`languageOptions.${loc}`)}
        </button>
      ))}
    </div>
  )
}
