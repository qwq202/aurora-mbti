"use client"

import { useTranslations } from "next-intl"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp } from "@/components/scroll-reveal"

const COOKIE_ROWS = [
  "aurora_cookie_consent",
  "aurora_admin_token",
  "NEXT_LOCALE",
] as const

export default function CookiePolicyPage() {
  const t = useTranslations("cookiePolicy")

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <SiteHeader />
      <main>
        <section className="pt-48 pb-24 px-6 lg:px-20 border-b border-zinc-100">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-10">
                {t("hero.label")}
              </div>
            </FadeIn>
            <SlideUp>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95]">
                {t("hero.title")}
              </h1>
            </SlideUp>
            <SlideUp delay={160}>
              <p className="mt-8 max-w-3xl text-lg text-zinc-500 font-medium leading-relaxed">
                {t("hero.description")}
              </p>
            </SlideUp>
          </div>
        </section>

        <section className="py-20 px-6 lg:px-20">
          <div className="max-w-5xl mx-auto space-y-14">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-8 md:p-10">
              <h2 className="text-2xl font-bold tracking-tight">{t("table.title")}</h2>
              <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{t("table.description")}</p>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="py-3 pr-6 text-[10px] uppercase tracking-widest text-zinc-400">{t("table.columns.name")}</th>
                      <th className="py-3 pr-6 text-[10px] uppercase tracking-widest text-zinc-400">{t("table.columns.purpose")}</th>
                      <th className="py-3 text-[10px] uppercase tracking-widest text-zinc-400">{t("table.columns.duration")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COOKIE_ROWS.map((key) => (
                      <tr key={key} className="border-b border-zinc-100 last:border-0">
                        <td className="py-4 pr-6 align-top text-xs font-bold text-zinc-800">{t(`table.rows.${key}.name`)}</td>
                        <td className="py-4 pr-6 align-top text-sm text-zinc-600">{t(`table.rows.${key}.purpose`)}</td>
                        <td className="py-4 align-top text-sm text-zinc-500">{t(`table.rows.${key}.duration`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-100 p-7">
                <h3 className="text-lg font-bold tracking-tight">{t("management.title")}</h3>
                <p className="mt-3 text-sm text-zinc-600 leading-relaxed">{t("management.description")}</p>
              </div>
              <div className="rounded-2xl border border-zinc-100 p-7">
                <h3 className="text-lg font-bold tracking-tight">{t("update.title")}</h3>
                <p className="mt-3 text-sm text-zinc-600 leading-relaxed">{t("update.description")}</p>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter variant="compact" />
      </main>
    </div>
  )
}
