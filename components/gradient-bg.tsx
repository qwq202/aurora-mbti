"use client"

import { cn } from "@/lib/utils"
import type { PropsWithChildren } from "react"

export function GradientBg(props: PropsWithChildren<{ className?: string, dark?: boolean }>) {
  const { children, className = "" } = props
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-background", className)}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Subtle atmospheric glow */}
        <div className="absolute top-[-50%] left-[-20%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,var(--aurora-purple)_0%,transparent_50%)] opacity-[0.03] blur-[100px]" />
        <div className="absolute bottom-[-50%] right-[-20%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,var(--aurora-cyan)_0%,transparent_50%)] opacity-[0.03] blur-[100px]" />
        
        {/* Fine grain texture for premium feel */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('/noise.svg')] bg-repeat brightness-100 contrast-150 mix-blend-overlay" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}