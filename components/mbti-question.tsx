"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"

export type LikertValue = 1 | 2 | 3 | 4 | 5 | 6 | 7

export function MbtiQuestion(props: {
  index?: number
  total?: number
  text?: string
  value?: LikertValue | null | undefined
  onChange?: (v: LikertValue) => void
}) {
  const { index = 0, total = 1, text = "", value = null, onChange = () => {} } = props
  const containerRef = useRef<HTMLDivElement | null>(null)
  const t = useTranslations('test')

  // Keyboard support for left/right keys
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "1", "2", "3", "4", "5", "6", "7"].includes(e.key)) {
        e.preventDefault()
      }
      if (e.key === "ArrowLeft" && value && value > 1) onChange((value - 1) as LikertValue)
      if (e.key === "ArrowRight" && value && value < 7) onChange((value + 1) as LikertValue)
      if (["1", "2", "3", "4", "5", "6", "7"].includes(e.key)) onChange(Number.parseInt(e.key, 10) as LikertValue)
    }
    el.addEventListener("keydown", handler)
    return () => el.removeEventListener("keydown", handler)
  }, [value, onChange])

  const labels = (t.raw('likert.labels') as string[]) || []

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="focus:outline-none py-12"
    >
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">
            {t('questionLabel', { current: index + 1, total })}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-zinc-900">
            {text}
          </h2>
        </div>

        <div className="pt-8">
          <RadioGroup
            value={value ? String(value) : ""}
            onValueChange={(v) => onChange(Number.parseInt(v, 10) as LikertValue)}
            className="grid grid-cols-7 gap-4"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((v, i) => {
              const active = value === v
              // 根据选项权重调整圆形大小 (1/7最大，4最小)
              let size = "w-10 h-10" // 中立选项
              if (i === 0 || i === 6) size = "w-16 h-16" // 非常同意/不同意
              else if (i === 1 || i === 5) size = "w-14 h-14" // 同意/不同意
              else if (i === 2 || i === 4) size = "w-12 h-12" // 略同意/不同意
              
              return (
                <div key={v} className="flex flex-col items-center">
                  <div className="h-16 flex items-center justify-center">
                    <RadioGroupItem
                      id={`q-${index}-v-${v}`}
                      value={String(v)}
                      className={cn(
                        "transition-all duration-300 border-2",
                        size,
                        active 
                          ? "bg-zinc-900 border-zinc-900 scale-110 shadow-lg text-white" 
                          : "bg-white border-zinc-200 hover:border-zinc-400",
                        // 
                        !active && i <= 2 && "hover:border-rose-100",
                        !active && i >= 4 && "hover:border-emerald-100"
                      )}
                      aria-label={labels[i] || String(v)}
                    />
                  </div>
                  <Label
                    htmlFor={`q-${index}-v-${v}`}
                    className={cn(
                      "mt-8 text-[10px] font-bold uppercase tracking-widest transition-colors",
                      active ? "text-zinc-900" : "text-zinc-500"
                    )}
                  >
                    {labels[i] || String(v)}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}
