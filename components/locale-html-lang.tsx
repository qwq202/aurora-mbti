'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'

export function LocaleHtmlLang() {
  const locale = useLocale()

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale
    document.documentElement.dataset.locale = locale
  }, [locale])

  return null
}
