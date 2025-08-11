"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

export function SiteHeader(props: { className?: string }) {
  const { className = "" } = props
  const pathname = usePathname()
  const nav = [
    { href: "/", label: "首页" },
    { href: "/test", label: "开始测试" },
    { href: "/result", label: "我的结果" },
  ]
  return (
    <header className={cn("w-full z-30", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="inline-flex items-center justify-center rounded-xl w-9 h-9 bg-gradient-to-br from-fuchsia-400 via-rose-400 to-amber-300 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg tracking-tight">Aurora MBTI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname === item.href
                    ? "text-foreground font-medium bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/test">
              <Button className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 hover:from-fuchsia-600 hover:to-rose-600 text-white">
                立即开始
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

SiteHeader.defaultProps = {
  className: "",
}
