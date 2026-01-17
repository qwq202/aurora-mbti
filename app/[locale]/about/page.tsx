"use client"

import { useTranslations } from "next-intl"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp } from "@/components/scroll-reveal"
import { Github } from "lucide-react"
import { Claude, Cursor, Gemini, OpenAI, V0, Windsurf } from "@lobehub/icons"

type ThanksItem = {
  rawName: string
  Icon: React.ComponentType<{ size?: number | string; className?: string; title?: string }>
}

const MODEL_THANKS: ThanksItem[] = [
  { rawName: "claude 4 sonnet", Icon: Claude },
  { rawName: "claude 4.5 sonnet", Icon: Claude },
  { rawName: "claude 4.1 opus", Icon: Claude },
  { rawName: "claude 4.5 opus", Icon: Claude },
  { rawName: "gpt 5", Icon: OpenAI },
  { rawName: "gpt 5.1", Icon: OpenAI },
  { rawName: "gpt 5.2", Icon: OpenAI },
  { rawName: "gemini 3 flash", Icon: Gemini },
  { rawName: "gemini 3 pro", Icon: Gemini },
]

const TOOL_THANKS: ThanksItem[] = [
  { rawName: "v0", Icon: V0 },
  { rawName: "windsurf", Icon: Windsurf },
  { rawName: "cursor", Icon: Cursor },
  { rawName: "claude code", Icon: Claude },
  { rawName: "codex cli", Icon: OpenAI },
]

type ContributionBlock = {
  title: string
  description: string
  items: ThanksItem[]
}

function formatDisplayName(raw: string) {
  const normalized = raw.replace(/[-_]+/g, " ").trim()
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (/^\d+(\.\d+)*$/.test(token)) return token
      if (token.toLowerCase() === "gpt") return "GPT"
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
    })
    .join(" ")
}

export default function AboutPage() {
  const t = useTranslations('about')
  const contributions: ContributionBlock[] = [
    {
      title: t('contributions.initial.title'),
      description: t('contributions.initial.description'),
      items: [{ rawName: "v0", Icon: V0 }],
    },
    {
      title: t('contributions.mvp.title'),
      description: t('contributions.mvp.description'),
      items: [
        { rawName: "gpt 5.2 codex", Icon: OpenAI },
        { rawName: "claude 4.5 opus", Icon: Claude },
        { rawName: "gemini 3 pro", Icon: Gemini },
      ],
    },
    {
      title: t('contributions.core.title'),
      description: t('contributions.core.description'),
      items: [
        { rawName: "windsurf", Icon: Windsurf },
        { rawName: "claude 4 sonnet", Icon: Claude },
      ],
    },
    {
      title: t('contributions.ui.title'),
      description: t('contributions.ui.description'),
      items: [
        { rawName: "gemini 3 flash", Icon: Gemini },
        { rawName: "gemini 3 pro", Icon: Gemini },
      ],
    },
    {
      title: t('contributions.refactor.title'),
      description: t('contributions.refactor.description'),
      items: [
        { rawName: "codex cli", Icon: OpenAI },
        { rawName: "claude code", Icon: Claude },
        { rawName: "cursor", Icon: Cursor },
        { rawName: "claude 4.5 opus", Icon: Claude },
        { rawName: "claude 4.5 sonnet", Icon: Claude },
        { rawName: "gpt 5.2 codex", Icon: OpenAI },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* 装饰性背景流光 */}
      <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-zinc-50 rounded-full blur-[120px] -z-10 opacity-60" />
      <div className="absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-zinc-50 rounded-full blur-[100px] -z-10 opacity-40" />
      
      <SiteHeader />

      <main>
        {/* --- Hero: Editorial Style --- */}
        <section className="pt-56 pb-40 px-6 lg:px-20 relative">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-4xl">
              <FadeIn>
                <div className="flex items-center gap-4 mb-12">
                  <div className="h-[1px] w-8 bg-zinc-200" />
                  <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-400">
                    {t('hero.label')}
                  </div>
                </div>
              </FadeIn>
              <SlideUp>
                <h1 className="text-7xl md:text-9xl font-bold tracking-tight leading-[0.85] mb-20">
                  {t('hero.title')} <br />
                  <span className="text-zinc-200">{t('hero.titleHighlight')}</span>
                </h1>
              </SlideUp>
              <SlideUp delay={200}>
                <div className="grid md:grid-cols-2 gap-12 items-end">
                  <div className="space-y-6">
                    <p className="text-xl text-zinc-500 font-medium leading-relaxed">
                      {t('hero.description')}
                    </p>
                    <div className="flex items-center gap-3 py-2 px-4 bg-zinc-50 rounded-full w-fit border border-zinc-100">
                      <Gemini size={14} className="text-zinc-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {t('hero.credit')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="https://github.com/qwq202/aurora-mbti"
                      target="_blank"
                      rel="noreferrer"
                      className="h-14 px-10 bg-zinc-900 text-white font-bold text-[10px] tracking-widest uppercase hover:bg-black hover:shadow-2xl hover:shadow-zinc-200 transition-all active:scale-95 rounded-full inline-flex items-center justify-center gap-3"
                    >
                      <Github size={14} />
                      {t('hero.github')}
                    </a>
                  </div>
                </div>
              </SlideUp>
            </div>
          </div>
        </section>

        {/* --- Contributions Grid --- */}
        <section className="py-32 px-6 lg:px-20 bg-zinc-50/30 backdrop-blur-3xl border-y border-zinc-100/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-baseline mb-24 gap-8">
              <div className="space-y-4">
                <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-300">{t('contributions.label')}</div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{t('contributions.title')}</h2>
              </div>
              <p className="max-w-xs text-xs text-zinc-400 font-bold uppercase tracking-widest leading-loose">
                {t('contributions.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {contributions.map((block, idx) => (
                <FadeIn key={block.title} delay={idx * 100}>
                  <div className="group h-full flex flex-col p-8 md:p-10 bg-white border border-zinc-100 rounded-3xl hover:border-zinc-900 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] transition-all duration-500">
                    <div className="mb-10 flex flex-wrap gap-3">
                      {Array.from(new Set(block.items.map(i => i.Icon))).map((UniqueIcon, iIdx) => (
                        <div
                          key={`${block.title}-icon-${iIdx}`}
                          className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center transition-all duration-500 group-hover:bg-zinc-900 group-hover:border-zinc-900"
                        >
                          <UniqueIcon size={20} className="text-zinc-900 transition-colors group-hover:text-white" />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-xl font-bold tracking-tight group-hover:translate-x-1 transition-transform">{block.title}</h3>
                      <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                        {block.description}
                      </p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-zinc-50 flex flex-wrap gap-2">
                      {block.items.map(({ rawName }) => (
                        <span key={rawName} className="text-[9px] font-black tracking-widest uppercase text-zinc-300 group-hover:text-zinc-900 transition-colors">
                          {formatDisplayName(rawName)}
                        </span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* --- Lists Section --- */}
        <section className="py-40 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-24 items-start">
            <div className="lg:col-span-1 space-y-12">
              <div className="space-y-6">
                <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-300">{t('matrix.label')}</div>
                <h2 className="text-4xl font-bold tracking-tighter">{t('matrix.title')}</h2>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  {t('matrix.description')}
                </p>
              </div>
              <div className="p-8 bg-zinc-900 rounded-3xl text-white space-y-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('matrix.quoteLabel')}</div>
                <p className="text-sm font-medium leading-relaxed opacity-80 italic">
                  {t('matrix.quote')}
                </p>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-16">
              <SlideUp>
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">{t('matrix.models')}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{t('matrix.modelsCount', { count: MODEL_THANKS.length })}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {MODEL_THANKS.map(({ rawName, Icon }) => (
                      <div key={rawName} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Icon size={16} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 truncate">{formatDisplayName(rawName)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SlideUp>

              <SlideUp delay={200}>
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">{t('matrix.tools')}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{t('matrix.toolsCount', { count: TOOL_THANKS.length })}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {TOOL_THANKS.map(({ rawName, Icon }) => (
                      <div key={rawName} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Icon size={16} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 truncate">{formatDisplayName(rawName)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SlideUp>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  )
}
