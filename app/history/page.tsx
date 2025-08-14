"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { type MbtiResult, type UserProfile, typeDisplayInfo } from "@/lib/mbti"
import { ArrowLeft, Trash2, Target, Users, History as HistoryIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const HISTORY_KEY = "mbti_history_v1"
const COMPARE_KEY = "mbti_compare_target_v1"

export type HistoryEntry = {
  id: string
  createdAt: number
  testMode?: string
  result: MbtiResult
  profile?: UserProfile | null
}

export default function HistoryPage() {
  const [list, setList] = useState<HistoryEntry[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      const arr: HistoryEntry[] = raw ? JSON.parse(raw) : []
      // 最新的在前
      setList(arr.sort((a, b) => b.createdAt - a.createdAt))
    } catch {
      setList([])
    }
  }, [])

  const clearAll = () => {
    try {
      localStorage.removeItem(HISTORY_KEY)
      setList([])
      toast({ title: "已清空", description: "历史记录已全部删除" })
    } catch {
      toast({ title: "操作失败", description: "无法写入本地存储", variant: "destructive" })
    }
  }

  const removeOne = (id: string) => {
    const next = list.filter((x) => x.id !== id)
    setList(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }

  const setAsCompare = (entry: HistoryEntry) => {
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(entry))
      toast({ title: "已设为对比", description: `类型 ${entry.result.type}` })
      router.push("/result")
    } catch {
      toast({ title: "操作失败", description: "无法写入本地存储", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen">
      <GradientBg />
      <SiteHeader />

      <main className="relative z-10 py-6 space-y-6 max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-5 h-5 text-foreground/70" />
            <h1 className="text-xl font-semibold">历史记录</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/result" className="inline-flex">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-1" /> 返回结果
              </Button>
            </Link>
            {list.length > 0 && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={clearAll}>
                清空全部
              </Button>
            )}
          </div>
        </div>

        {list.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              暂无历史记录。回到结果页点击“保存到历史”即可在此查看与对比。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => {
              const info = typeDisplayInfo(e.result.type)
              return (
                <Card key={e.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold">
                          {e.result.type}
                          <span className="ml-2 text-sm text-muted-foreground">{info?.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(e.createdAt).toLocaleString()} {e.testMode ? `• ${e.testMode}` : ""}
                        </div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-md bg-secondary/60">
                        置信度 {Math.round(e.result.confidence?.overall ?? 0)}%
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>EI: {e.result.scores.EI.percentFirst}% / {e.result.scores.EI.percentSecond}%</div>
                      <div>SN: {e.result.scores.SN.percentFirst}% / {e.result.scores.SN.percentSecond}%</div>
                      <div>TF: {e.result.scores.TF.percentFirst}% / {e.result.scores.TF.percentSecond}%</div>
                      <div>JP: {e.result.scores.JP.percentFirst}% / {e.result.scores.JP.percentSecond}%</div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setAsCompare(e)}>
                        设为对比
                        <Target className="w-4 h-4 ml-2" />
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={() => removeOne(e.id)}>
                        删除
                        <Trash2 className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
