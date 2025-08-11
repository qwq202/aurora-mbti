"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

export type LikertValue = 1 | 2 | 3 | 4 | 5

export function MbtiQuestion(props: {
  index?: number
  total?: number
  text?: string
  value?: LikertValue | null | undefined
  onChange?: (v: LikertValue) => void
}) {
  const { index = 0, total = 1, text = "", value = null, onChange = () => {} } = props
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Keyboard support for left/right keys
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "1", "2", "3", "4", "5"].includes(e.key)) {
        e.preventDefault()
      }
      if (e.key === "ArrowLeft" && value && value > 1) onChange((value - 1) as LikertValue)
      if (e.key === "ArrowRight" && value && value < 5) onChange((value + 1) as LikertValue)
      if (["1", "2", "3", "4", "5"].includes(e.key)) onChange(Number.parseInt(e.key, 10) as LikertValue)
    }
    el.addEventListener("keydown", handler)
    return () => el.removeEventListener("keydown", handler)
  }, [value, onChange])

  const labels = ["强烈不同意", "不同意", "中立", "同意", "强烈同意"] as const

  return (
    <Card
      ref={containerRef}
      tabIndex={0}
      className="rounded-2xl border-muted/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
    >
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          <span className="text-muted-foreground mr-2">{`${index + 1} / ${total}`}</span>
          {text}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid gap-4">
          <RadioGroup
            value={value ? String(value) : ""}
            onValueChange={(v) => onChange(Number.parseInt(v, 10) as LikertValue)}
            className="grid grid-cols-5 gap-2 md:gap-3"
          >
            {[1, 2, 3, 4, 5].map((v, i) => {
              const active = value === v
              return (
                <div key={v} className="flex flex-col items-center">
                  <RadioGroupItem
                    id={`q-${index}-v-${v}`}
                    value={String(v)}
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all",
                      i <= 1 && "border-rose-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500",
                      i === 2 &&
                        "border-amber-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400",
                      i >= 3 &&
                        "border-fuchsia-300 data-[state=checked]:bg-fuchsia-500 data-[state=checked]:border-fuchsia-500",
                      active ? "scale-105 shadow-sm text-white" : "bg-background",
                    )}
                    aria-label={labels[i]}
                  />
                  <Label
                    htmlFor={`q-${index}-v-${v}`}
                    className={cn(
                      "mt-2 text-xs md:text-sm text-center text-muted-foreground",
                      active && "text-foreground font-medium",
                    )}
                  >
                    {labels[i]}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
}

MbtiQuestion.defaultProps = {
  index: 0,
  total: 1,
  text: "",
  value: null,
  onChange: () => {},
}
