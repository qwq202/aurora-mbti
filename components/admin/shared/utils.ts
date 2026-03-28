export function formatMB(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}

export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatToken(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function readErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback
  const record = body as Record<string, unknown>
  if (record.error && typeof record.error === "object") {
    const nested = (record.error as Record<string, unknown>).message
    if (typeof nested === "string" && nested.trim()) return nested
  }
  if (typeof record.error === "string" && record.error.trim()) return record.error
  return fallback
}

const MBTI_GROUPS: Record<string, string> = {
  NT: "INTJ INTP ENTJ ENTP",
  NF: "INFJ INFP ENFJ ENFP",
  SP: "ISTP ISFP ESTP ESFP",
  SJ: "ISTJ ISFJ ESTJ ESFJ",
}

const MBTI_GROUP_COLORS: Record<string, string> = {
  NT: "bg-violet-100 text-violet-700",
  NF: "bg-emerald-100 text-emerald-700",
  SP: "bg-amber-100 text-amber-700",
  SJ: "bg-sky-100 text-sky-700",
}

export function getMbtiColor(type: string): string {
  if (!type || type.length < 2) return "bg-zinc-100 text-zinc-600"
  const group = type[1] + type[2]
  return MBTI_GROUP_COLORS[group] || "bg-zinc-100 text-zinc-600"
}

export const MBTI_TYPES = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"]

/**
 * Compare today vs yesterday from StatsData.daily.
 * Returns { pct: string, dir: "up" | "down" | "flat" } or null if insufficient data.
 */
export function calcTrend(
  daily: { date: string; calls: number; tests: number }[] | undefined,
  field: "calls" | "tests"
): { pct: string; dir: "up" | "down" | "flat" } | null {
  if (!daily || daily.length < 2) return null
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date))
  const today = sorted[sorted.length - 1][field]
  const yesterday = sorted[sorted.length - 2][field]
  if (yesterday === 0) return today > 0 ? { pct: "∞", dir: "up" } : null
  const pctNum = ((today - yesterday) / yesterday) * 100
  if (Math.abs(pctNum) < 0.5) return { pct: "0%", dir: "flat" }
  return {
    pct: `${Math.abs(pctNum).toFixed(0)}%`,
    dir: pctNum > 0 ? "up" : "down",
  }
}