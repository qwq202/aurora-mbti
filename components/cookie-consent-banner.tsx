"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"

const CONSENT_COOKIE_NAME = "aurora_cookie_consent"
const CONSENT_VALUE = "accepted"
const CONSENT_STORAGE_KEY = "aurora.cookieConsent"
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function hasConsent() {
  if (typeof document === "undefined") return true

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${CONSENT_COOKIE_NAME}=`))

  if (cookie) {
    const value = decodeURIComponent(cookie.split("=").slice(1).join("="))
    return value === CONSENT_VALUE
  }

  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === CONSENT_VALUE
  } catch {
    return false
  }
}

export function CookieConsentBanner() {
  const t = useTranslations("cookieConsent")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!hasConsent())
  }, [])

  const handleAccept = () => {
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(CONSENT_VALUE)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, CONSENT_VALUE)
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] md:inset-x-auto md:right-6 md:w-[420px]">
      <section
        role="dialog"
        aria-live="polite"
        aria-label={t("title")}
        className="rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-[0_24px_56px_-16px_rgba(0,0,0,0.25)] backdrop-blur"
      >
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">{t("title")}</h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">{t("description")}</p>
        <p className="mt-2 text-xs text-zinc-500">
          <Link href="/cookies" className="font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-700">
            {t("learnMore")}
          </Link>
        </p>
        <Button onClick={handleAccept} className="mt-4 w-full">
          {t("accept")}
        </Button>
      </section>
    </div>
  )
}
