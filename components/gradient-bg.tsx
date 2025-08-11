"use client"

import { cn } from "@/lib/utils"
import type { PropsWithChildren } from "react"

export function GradientBg(props: PropsWithChildren<{ className?: string }>) {
  const { children, className = "" } = props
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-40 bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.35),transparent_60%)]" />
        <div className="absolute -bottom-28 -right-24 w-[42rem] h-[42rem] rounded-full blur-3xl opacity-40 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.3),transparent_60%)]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] rounded-full blur-3xl opacity-30 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25),transparent_60%)]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

GradientBg.defaultProps = {
  className: "",
}
