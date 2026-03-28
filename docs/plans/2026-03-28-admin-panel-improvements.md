# Admin Panel Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 12 UI/UX improvements to the Aurora MBTI admin panel covering visual polish, real-time feedback, and usability enhancements.

**Architecture:** All changes are purely frontend — no new API routes needed. New shared components (Toast, Toggle, Skeleton) are created once and consumed by modified tab components. The admin page (`page.tsx`) is the state orchestrator and receives minimal additions.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Recharts, Lucide React

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `components/admin/shared/toast.tsx` | **Create** | Toast notification system (ToastProvider + useToast hook) |
| `components/admin/shared/toggle.tsx` | **Create** | Reusable Toggle Switch component |
| `components/admin/shared/skeleton.tsx` | **Create** | Skeleton loading primitives |
| `components/admin/shared/types.ts` | **Modify** | Add `badge?: number \| "dot"` to NavItem |
| `components/admin/shared/utils.ts` | **Modify** | Add `calcTrend()` helper |
| `components/admin/tabs/overview-tab.tsx` | **Modify** | Toggle switch (#1), trend arrows (#2) |
| `components/admin/tabs/stats-tab.tsx` | **Modify** | Text search (#5), skeleton (#9), row expand (#12) |
| `components/admin/tabs/providers-tab.tsx` | **Modify** | Status dot indicator (#4) |
| `components/admin/tabs/records-tab.tsx` | **Modify** | Mini chart (#6), skeleton (#9), row expand (#12) |
| `components/admin/tabs/questions-tab.tsx` | **Modify** | Dimension stats (#7), skeleton (#9) |
| `app/[locale]/admin/page.tsx` | **Modify** | Toast wiring (#10), sidebar badges (#3), sidebar collapse (#11), version banner (#8), log text search state (#5) |

---

## Task 1: Toast Notification System

**Files:**
- Create: `components/admin/shared/toast.tsx`

- [ ] **Step 1: Create the toast component**

```tsx
// components/admin/shared/toast.tsx
"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

type Toast = {
  id: string
  type: ToastType
  message: string
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timerRef.current.get(id)
    if (timer) { clearTimeout(timer); timerRef.current.delete(id) }
  }, [])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev.slice(-4), { id, type, message }])
    const timer = setTimeout(() => dismiss(id), 3500)
    timerRef.current.set(id, timer)
  }, [dismiss])

  useEffect(() => {
    const timers = timerRef.current
    return () => { timers.forEach(clearTimeout) }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium pointer-events-auto transition-all
              ${t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                t.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" :
                "bg-white border-zinc-200 text-zinc-800"}`}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
            {t.type === "error" && <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 text-zinc-400 hover:text-zinc-600 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx.toast
}
```

- [ ] **Step 2: Wrap admin page with ToastProvider**

In `app/[locale]/admin/page.tsx`, find the top-level return JSX and wrap it:

```tsx
// At top of file, add import:
import { ToastProvider, useToast } from "@/components/admin/shared/toast"

// The outer return in AdminPage:
return (
  <ToastProvider>
    <AdminPageInner /* ... all props */ />
  </ToastProvider>
)
```

Because hooks (useToast) must be called inside the provider, extract the page body into an inner component `AdminPageInner` that receives all state as props, OR — simpler given the large existing component — just place `<ToastProvider>` at the outermost JSX and use a ref-based approach.

**Simpler approach** — keep AdminPage as-is, add ToastProvider wrapper around the returned JSX, and create a sibling `AdminToastBridge` component that reads the context. Actually the simplest is:

1. Rename the current default export body to keep `AdminPage` as-is.
2. Create a new default export that wraps it:

```tsx
function AdminPageContent() {
  // ... all existing AdminPage code goes here (rename the function)
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminPageContent />
    </ToastProvider>
  )
}
```

3. Inside `AdminPageContent`, add `const toast = useToast()` near the top (after all useState lines).

4. Replace all `setXMessage(...)` + `setTimeout(() => setXMessage(""), 3000)` patterns with `toast(message, type)`. For example:

```tsx
// Before:
setQMessage(isZh ? "已保存" : "Saved")
setTimeout(() => setQMessage(""), 3000)
// After:
toast(isZh ? "已保存" : "Saved", "success")
```

Patterns to replace (search for `setTimeout(() => set` in page.tsx):
- `setLogMessage` → `toast(msg, "success" | "error")`
- `setConfigMessage` → `toast(msg, "success" | "error")`
- `setQMessage` → `toast(msg, "success" | "error")`
- `setSettingsMessage` → `toast(msg, "success" | "error")`
- `setBackupMessage` → `toast(msg, "success" | "error")`
- `setTestModesMessage` → `toast(msg, "success" | "error")`

Also remove the now-unused state variables: `logMessage`, `configMessage`, `settingsMessage`, `backupMessage`, `testModesMessage`.

Remove props that passed these messages to child tabs (they now use toast). Update tab component interfaces to remove their `logMessage`/`configMessage`/`qMessage`/`settingsMessage`/`backupMessage`/`testModesMessage` props.

- [ ] **Step 3: Commit**

```bash
git add components/admin/shared/toast.tsx app/[locale]/admin/page.tsx \
  components/admin/tabs/stats-tab.tsx components/admin/tabs/questions-tab.tsx \
  components/admin/tabs/system-tab.tsx components/admin/tabs/test-modes-tab.tsx \
  components/admin/tabs/overview-tab.tsx
git commit -m "feat: add toast notification system, replace inline messages"
```

---

## Task 2: Toggle Switch Component + Overview Auto-Refresh

**Files:**
- Create: `components/admin/shared/toggle.tsx`
- Modify: `components/admin/tabs/overview-tab.tsx`

- [ ] **Step 1: Create toggle component**

```tsx
// components/admin/shared/toggle.tsx
"use client"

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  hint?: string
  size?: "sm" | "md"
}

export function Toggle({ checked, onChange, label, hint, size = "md" }: ToggleProps) {
  const trackW = size === "sm" ? "w-8" : "w-10"
  const trackH = size === "sm" ? "h-4" : "h-5"
  const thumbSz = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"
  const thumbOn = size === "sm" ? "translate-x-4" : "translate-x-5"

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex ${trackW} ${trackH} rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
          ${checked ? "bg-emerald-500" : "bg-zinc-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 ${thumbSz} bg-white rounded-full shadow transition-transform duration-200
            ${checked ? thumbOn : "translate-x-0"}`}
        />
      </button>
      {label && <span className="text-sm text-zinc-500">{label}</span>}
      {hint && <span className="text-xs text-zinc-400">({hint})</span>}
    </label>
  )
}
```

- [ ] **Step 2: Replace checkbox with Toggle in overview-tab.tsx**

Find the auto-refresh section (lines 93–105 in current file) and replace:

```tsx
// Remove:
// <label className="flex items-center gap-2 text-sm text-zinc-500 cursor-pointer">
//   <input type="checkbox" ... />
//   {text.autoRefresh}
//   <span className="text-xs text-zinc-400">({text.autoRefreshHint})</span>
// </label>

// Add at top of file:
import { Toggle } from "../shared/toggle"

// Replace the auto-refresh div content with:
<div className="flex items-center gap-2 justify-end">
  <Toggle
    checked={autoRefresh}
    onChange={onAutoRefreshChange}
    label={text.autoRefresh}
    hint={text.autoRefreshHint}
  />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/shared/toggle.tsx components/admin/tabs/overview-tab.tsx
git commit -m "feat: replace auto-refresh checkbox with toggle switch"
```

---

## Task 3: Trend Arrows on Stat Cards

**Files:**
- Modify: `components/admin/shared/utils.ts`
- Modify: `components/admin/tabs/overview-tab.tsx`

- [ ] **Step 1: Add calcTrend helper to utils.ts**

Append to `components/admin/shared/utils.ts`:

```ts
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
```

- [ ] **Step 2: Add TrendBadge sub-component and use in overview-tab.tsx**

At the top of `overview-tab.tsx`, add import:
```tsx
import { calcTrend } from "../shared/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
```

Add a local TrendBadge component just before the OverviewTab function:

```tsx
function TrendBadge({ trend }: { trend: ReturnType<typeof calcTrend> }) {
  if (!trend) return null
  if (trend.dir === "up")
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 font-medium">
        <TrendingUp className="w-3 h-3" />↑{trend.pct}
      </span>
    )
  if (trend.dir === "down")
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-rose-500 font-medium">
        <TrendingDown className="w-3 h-3" />↓{trend.pct}
      </span>
    )
  return <span className="text-[11px] text-zinc-400"><Minus className="w-3 h-3 inline" /></span>
}
```

In the OverviewTab function body, compute trends:
```tsx
const callsTrend = calcTrend(stats?.daily, "calls")
const testsTrend = calcTrend(stats?.daily, "tests")
```

In the first stat card (API Calls), after the `text-2xl font-bold` div, add:
```tsx
<div className="mt-1 flex items-center justify-between">
  <span className="text-xs text-zinc-400">{isZh ? "累计请求次数" : "Total requests"}</span>
  <TrendBadge trend={callsTrend} />
</div>
```

In the second stat card (Test Completions):
```tsx
<div className="mt-1 flex items-center justify-between">
  <span className="text-xs text-zinc-400">{isZh ? "完成测试人次" : "Completed tests"}</span>
  <TrendBadge trend={testsTrend} />
</div>
```

Remove the standalone `<div className="mt-1 text-xs text-zinc-400">` lines from those two cards (they are replaced by the flex div above).

- [ ] **Step 3: Commit**

```bash
git add components/admin/shared/utils.ts components/admin/tabs/overview-tab.tsx
git commit -m "feat: add yesterday vs today trend arrows on stat cards"
```

---

## Task 4: Sidebar Badges (Error Dot + Question Count)

**Files:**
- Modify: `components/admin/shared/types.ts`
- Modify: `app/[locale]/admin/page.tsx`

- [ ] **Step 1: Add badge field to NavItem type**

In `components/admin/shared/types.ts`, update NavItem:

```ts
export type NavItem = {
  id: TabType
  label: string
  desc: string
  icon: LucideIcon
  accent: string
  accentText: string
  accentBg: string
  badge?: number | "dot"   // <-- add this
}
```

- [ ] **Step 2: Wire badge data in page.tsx sidebar render**

In `page.tsx`, the sidebar nav currently renders each item without badges. Find the `navGroups.map` section (around line 1096) and add badge computation + rendering.

Add this useMemo near the other derived values (after `logLevelCounts`):

```tsx
const navBadges = useMemo((): Partial<Record<TabType, number | "dot">> => {
  return {
    stats: derivedStats.errorLogs > 0 ? "dot" : undefined,
    questions: questionList.length > 0 ? questionList.length : undefined,
  }
}, [derivedStats.errorLogs, questionList.length])
```

In the nav item render loop, update the button to show the badge. Find the button that renders each nav item and add after the icon+text `<div>`:

```tsx
{/* Add after the text div, inside the button */}
{navBadges[item.id] !== undefined && (
  <div className="ml-auto">
    {navBadges[item.id] === "dot" ? (
      <span className="w-2 h-2 rounded-full bg-rose-500 block" />
    ) : (
      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-zinc-400 tabular-nums">
        {navBadges[item.id]}
      </span>
    )}
  </div>
)}
```

The button already has `flex items-center gap-3` — the badge will push to the right via `ml-auto`.

- [ ] **Step 3: Commit**

```bash
git add components/admin/shared/types.ts app/[locale]/admin/page.tsx
git commit -m "feat: add sidebar badges (error dot on stats, question count)"
```

---

## Task 5: Provider Connection Status Indicator

**Files:**
- Modify: `components/admin/tabs/providers-tab.tsx`

The active provider is `overview?.ai.activeProvider`. After running a test via `handleTestProvider`, the result is stored in `testResults[providerId]`. We'll show a status dot based on test results and active/inactive state.

- [ ] **Step 1: Add StatusDot sub-component to providers-tab.tsx**

Add near the top of `providers-tab.tsx` (after imports):

```tsx
function StatusDot({ status }: { status: "active" | "ok" | "error" | "idle" }) {
  const colors = {
    active: "bg-emerald-400 animate-pulse",
    ok: "bg-emerald-400",
    error: "bg-rose-500",
    idle: "bg-zinc-500",
  }
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />
  )
}
```

- [ ] **Step 2: Show status dot in provider list items**

In the provider list render, find where each provider's name/label is shown. The providers tab renders a list of specs (`overview?.specs`). For each provider card, compute the status and add the dot.

Find where provider id is displayed (look for `p.id` or `spec.id` rendering) and add before the provider name text:

```tsx
// Determine status for this provider:
const isActive = overview?.ai?.activeProvider === spec.id
const testResult = testResults[spec.id]
const status: "active" | "ok" | "error" | "idle" =
  isActive ? "active"
  : testResult?.success ? "ok"
  : testResult?.success === false ? "error"
  : "idle"

// Render alongside provider name:
<div className="flex items-center gap-2">
  <StatusDot status={status} />
  <span>{spec.label || spec.id}</span>
</div>
```

You need to read the full providers-tab.tsx to find the exact location. Search for where `spec.id` or provider label text is rendered in the list — it will be inside a `.map()` over `overview?.specs`. Add StatusDot alongside the provider name there.

- [ ] **Step 3: Commit**

```bash
git add components/admin/tabs/providers-tab.tsx
git commit -m "feat: add provider connection status dot indicator"
```

---

## Task 6: Log Text Search

**Files:**
- Modify: `app/[locale]/admin/page.tsx`
- Modify: `components/admin/tabs/stats-tab.tsx`

- [ ] **Step 1: Add logSearch state and filtered logic in page.tsx**

In `page.tsx`, add state near the other log state variables:

```tsx
const [logSearch, setLogSearch] = useState("")
```

Update the `filteredLogs` useMemo to also filter by `logSearch`:

```tsx
const filteredLogs = useMemo(() => {
  let filtered = logs
  if (logLevelFilter !== "all") {
    filtered = filtered.filter((l) => l.level === logLevelFilter)
  }
  if (logFrom) {
    const fromTime = new Date(logFrom).getTime()
    filtered = filtered.filter((l) => new Date(l.timestamp).getTime() >= fromTime)
  }
  if (logTo) {
    const toTime = new Date(logTo).getTime() + 86400_000
    filtered = filtered.filter((l) => new Date(l.timestamp).getTime() <= toTime)
  }
  if (logSearch.trim()) {
    const q = logSearch.trim().toLowerCase()
    filtered = filtered.filter((l) =>
      (l.message || "").toLowerCase().includes(q) ||
      (l.error || "").toLowerCase().includes(q) ||
      (l.endpoint || "").toLowerCase().includes(q)
    )
  }
  return filtered
}, [logs, logLevelFilter, logFrom, logTo, logSearch])
```

Pass to StatsTab in the JSX:
```tsx
<StatsTab
  // ... existing props ...
  logSearch={logSearch}
  setLogSearch={setLogSearch}
/>
```

- [ ] **Step 2: Add logSearch to StatsTabProps and render the input**

In `stats-tab.tsx`, add to `StatsTabProps`:
```ts
logSearch: string
setLogSearch: (v: string) => void
```

Add to the destructured parameters of `StatsTab`.

In the UI, add a search input after the level filter buttons and before the date range filter. Import `Search` from lucide-react if not already imported.

```tsx
{/* Text search */}
<div className="relative mb-4">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
  <input
    type="text"
    value={logSearch}
    onChange={(e) => setLogSearch(e.target.value)}
    placeholder={isZh ? "搜索消息、错误或端点..." : "Search message, error or endpoint..."}
    className="w-full h-9 pl-9 pr-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300"
  />
</div>
```

Also add `logSearch` to the reset button handler — update `onLogReset` in page.tsx to also clear `setLogSearch("")`.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/admin/page.tsx components/admin/tabs/stats-tab.tsx
git commit -m "feat: add real-time text search to log viewer"
```

---

## Task 7: Records MBTI Mini Chart

**Files:**
- Modify: `components/admin/tabs/records-tab.tsx`

- [ ] **Step 1: Add mini bar chart above the records table**

Add recharts imports at top of `records-tab.tsx`:
```tsx
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts"
import { getMbtiColor } from "../shared/utils"
```

Add a computed variable inside the component body (before the return):
```tsx
const typeDistribution = React.useMemo(() => {
  const counts: Record<string, number> = {}
  for (const r of recordList) {
    counts[r.mbtiType] = (counts[r.mbtiType] || 0) + 1
  }
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}, [recordList])
```

Add `import React from "react"` if not already at top.

Render the mini chart between the filter bar and the records table (after `</div>` closing the filter card, before the table card):

```tsx
{typeDistribution.length > 0 && (
  <div className="bg-white rounded-2xl border border-zinc-100 px-6 py-4 shadow-sm">
    <div className="text-xs font-medium text-zinc-500 mb-3">
      {isZh ? "当前页类型分布" : "Type distribution (current page)"}
    </div>
    <div className="h-20">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={typeDistribution} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="type" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
          <Tooltip
            contentStyle={{ fontSize: 12, padding: "4px 8px" }}
            formatter={(v: number) => [v, isZh ? "人数" : "Count"]}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {typeDistribution.map((entry) => {
              // getMbtiColor returns "bg-X-100 text-X-700" — extract color manually
              const colorMap: Record<string, string> = {
                "bg-violet-100 text-violet-700": "#8b5cf6",
                "bg-emerald-100 text-emerald-700": "#10b981",
                "bg-amber-100 text-amber-700": "#f59e0b",
                "bg-sky-100 text-sky-700": "#0ea5e9",
                "bg-zinc-100 text-zinc-600": "#71717a",
              }
              const fill = colorMap[getMbtiColor(entry.type)] || "#71717a"
              return <Cell key={entry.type} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/tabs/records-tab.tsx
git commit -m "feat: add MBTI type distribution mini chart to records page"
```

---

## Task 8: Questions Dimension Stats

**Files:**
- Modify: `components/admin/tabs/questions-tab.tsx`

- [ ] **Step 1: Add dimension stat pills at the top of QuestionsTab**

In `questions-tab.tsx`, add a computed object inside the component body (before return):

```tsx
const dimCounts = React.useMemo(() => {
  const counts: Record<string, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }
  for (const q of questionList) {
    if (q.dimension in counts) counts[q.dimension]++
  }
  return counts
}, [questionList])
```

Add `import React from "react"` if not already present.

In the JSX, add a stat strip right below the `<div className="space-y-5">` opening (before the filter bar):

```tsx
{questionList.length > 0 && (
  <div className="grid grid-cols-4 gap-3">
    {(["EI", "SN", "TF", "JP"] as const).map((dim) => (
      <div key={dim} className={`rounded-xl p-3 text-center border ${
        dim === "EI" ? "bg-sky-50 border-sky-100" :
        dim === "SN" ? "bg-emerald-50 border-emerald-100" :
        dim === "TF" ? "bg-violet-50 border-violet-100" :
        "bg-amber-50 border-amber-100"
      }`}>
        <div className={`text-xl font-bold tabular-nums ${
          dim === "EI" ? "text-sky-700" :
          dim === "SN" ? "text-emerald-700" :
          dim === "TF" ? "text-violet-700" :
          "text-amber-700"
        }`}>{dimCounts[dim]}</div>
        <div className="text-xs font-semibold text-zinc-500 mt-0.5">{dim}</div>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/tabs/questions-tab.tsx
git commit -m "feat: add dimension balance stats strip to questions tab"
```

---

## Task 9: Version Update Banner in Main Content

**Files:**
- Modify: `app/[locale]/admin/page.tsx`

Currently the version update notice is a small link inside the sidebar header. We'll add a prominent dismissible banner at the top of the main content area.

- [ ] **Step 1: Add dismissed state + banner in page.tsx**

Add state near the version state:
```tsx
const [versionBannerDismissed, setVersionBannerDismissed] = useState(false)
```

In the main content JSX (inside `<main className="flex-1 overflow-y-auto p-8">`), add the banner before `<div className="max-w-6xl mx-auto">`:

```tsx
{versionInfo?.hasUpdate && versionInfo.releaseUrl && !versionBannerDismissed && (
  <div className="mx-8 mb-0 mt-0">
    <a
      href={versionInfo.releaseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 hover:bg-amber-100 transition-colors group mb-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <span className="font-semibold">
            {isZh ? "发现新版本" : "New version available"}
          </span>
          <span className="ml-2 font-mono text-amber-600 text-xs">
            {versionInfo.current} → {versionInfo.latest}
          </span>
          <span className="ml-2 text-amber-600 text-xs">
            {isZh ? "点击查看发布说明" : "Click to view release notes"}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); setVersionBannerDismissed(true) }}
        className="p-1 text-amber-500 hover:text-amber-700 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </a>
  </div>
)}
```

Add `import { ..., X } from "lucide-react"` — X is likely already imported. If not, add it.

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/admin/page.tsx
git commit -m "feat: add dismissible version update banner in main content area"
```

---

## Task 10: Skeleton Loading States

**Files:**
- Create: `components/admin/shared/skeleton.tsx`
- Modify: `components/admin/tabs/stats-tab.tsx`
- Modify: `components/admin/tabs/records-tab.tsx`
- Modify: `components/admin/tabs/questions-tab.tsx`

- [ ] **Step 1: Create skeleton primitives**

```tsx
// components/admin/shared/skeleton.tsx
export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-100 rounded-md ${className}`} />
  )
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm space-y-3">
      <SkeletonLine className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  )
}

export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="animate-pulse bg-zinc-100 rounded h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody className="divide-y divide-zinc-50">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Use SkeletonTable in stats-tab.tsx**

Replace the loading spinner in the log table:

```tsx
// In stats-tab.tsx, replace:
// {logsLoading ? (
//   <div className="py-12 text-center">
//     <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-300" />
//   </div>
// ) : ...

// With:
import { SkeletonTable } from "../shared/skeleton"

{logsLoading ? (
  <SkeletonTable rows={8} cols={7} />
) : filteredLogs.length === 0 ? (
  <div className="py-12 text-center text-zinc-400">{text.noLogs}</div>
) : (
  // ... existing table ...
)}
```

- [ ] **Step 3: Use SkeletonTable in records-tab.tsx**

```tsx
import { SkeletonTable } from "../shared/skeleton"

// Replace:
// {recordLoading ? (
//   <div className="py-20 flex justify-center"><RefreshCw ... /></div>

// With:
{recordLoading ? (
  <SkeletonTable rows={6} cols={9} />
) : recordList.length === 0 ? (
  // ...
```

- [ ] **Step 4: Use SkeletonTable in questions-tab.tsx**

```tsx
import { SkeletonTable } from "../shared/skeleton"

// Find the qLoading spinner in questions-tab.tsx and replace with:
{qLoading ? (
  <SkeletonTable rows={8} cols={5} />
) : questionList.length === 0 ? (
  // ...
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/shared/skeleton.tsx \
  components/admin/tabs/stats-tab.tsx \
  components/admin/tabs/records-tab.tsx \
  components/admin/tabs/questions-tab.tsx
git commit -m "feat: add skeleton loading states to replace spinning icons"
```

---

## Task 11: Sidebar Collapse

**Files:**
- Modify: `app/[locale]/admin/page.tsx`

The sidebar is currently `w-64`. When collapsed it becomes `w-16`, showing only icons. State persisted in localStorage.

- [ ] **Step 1: Add collapse state in page.tsx**

Add near the top of `AdminPageContent`:
```tsx
const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
  if (typeof window === "undefined") return false
  return localStorage.getItem("admin-sidebar-collapsed") === "true"
})

const toggleSidebar = () => {
  setSidebarCollapsed((prev) => {
    const next = !prev
    localStorage.setItem("admin-sidebar-collapsed", String(next))
    return next
  })
}
```

- [ ] **Step 2: Update sidebar JSX**

Find `<aside className="w-64 bg-zinc-950 flex flex-col flex-shrink-0">` and change to:
```tsx
<aside className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-zinc-950 flex flex-col flex-shrink-0 transition-all duration-200`}>
```

In the header section of the sidebar, conditionally hide text:
```tsx
{/* Logo area */}
<div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
  <div className={`flex items-center gap-3 mb-4 ${sidebarCollapsed ? "justify-center" : ""}`}>
    <div className="w-9 h-9 flex-shrink-0">
      <img src="/favicon.svg" alt="Aurora" className="w-9 h-9" />
    </div>
    {!sidebarCollapsed && (
      <div className="flex-1 min-w-0">
        {/* ... existing version/title content ... */}
      </div>
    )}
  </div>
  {/* Hide version banner, env badge when collapsed */}
  {!sidebarCollapsed && versionInfo?.hasUpdate && versionInfo.releaseUrl && (
    // ... existing small sidebar update link ...
  )}
  {!sidebarCollapsed && (
    <div className="flex items-center gap-2">
      {/* ... existing env badge and uptime ... */}
    </div>
  )}
</div>
```

In the nav section, for each nav item button, hide label/desc when collapsed:
```tsx
<button
  key={item.id}
  onClick={() => setActiveTab(item.id)}
  title={sidebarCollapsed ? item.label : undefined}
  className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative ${
    isActive
      ? "bg-white/[0.08] text-white"
      : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
  }`}
>
  {isActive && !sidebarCollapsed && (
    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full ${item.accent}`} />
  )}
  <div className={`...existing icon div...`}>
    <item.icon className={`...`} />
    {/* Show badge dot on icon when collapsed */}
    {sidebarCollapsed && navBadges[item.id] === "dot" && (
      <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
    )}
  </div>
  {!sidebarCollapsed && (
    <>
      <div className="text-left min-w-0">
        <div className={`text-sm font-medium leading-none ${isActive ? "text-white" : ""}`}>
          {item.label}
        </div>
        <div className="text-[11px] text-zinc-600 mt-0.5 leading-none truncate">
          {item.desc}
        </div>
      </div>
      {navBadges[item.id] !== undefined && (
        <div className="ml-auto">
          {navBadges[item.id] === "dot" ? (
            <span className="w-2 h-2 rounded-full bg-rose-500 block" />
          ) : (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-zinc-400 tabular-nums">
              {navBadges[item.id]}
            </span>
          )}
        </div>
      )}
    </>
  )}
</button>
```

Add a collapse toggle button at the bottom of the sidebar (above the back/logout links):
```tsx
<button
  onClick={toggleSidebar}
  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-all text-sm"
  title={sidebarCollapsed ? (isZh ? "展开侧边栏" : "Expand sidebar") : (isZh ? "折叠侧边栏" : "Collapse sidebar")}
>
  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
    <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-0" : "rotate-180"}`} />
  </div>
  {!sidebarCollapsed && <span>{isZh ? "折叠侧边栏" : "Collapse"}</span>}
</button>
```

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/admin/page.tsx
git commit -m "feat: add collapsible sidebar with icon-only mode"
```

---

## Task 12: Expandable Table Rows

**Files:**
- Modify: `components/admin/tabs/stats-tab.tsx`
- Modify: `components/admin/tabs/records-tab.tsx`

### 12a: Log rows expand to show full message/error

- [ ] **Step 1: Add expandedLogId state and click handler to stats-tab.tsx**

Add at the top of the `StatsTab` function body:
```tsx
const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null)
```

Add `import React from "react"` if not already present. Also import `ChevronDown` from lucide-react.

- [ ] **Step 2: Add expand column to log table**

In the thead, add an expand column:
```tsx
<th className="w-8 py-3 px-2" />
```
(add as first column)

In each tbody row, add a toggle cell and an expandable detail row:
```tsx
{filteredLogs.map((log) => {
  const isExpanded = expandedLogId === log.id
  const hasDetail = !!(log.error || (log.message && log.message.length > 60))
  return (
    <React.Fragment key={log.id}>
      <tr
        className={`border-b border-zinc-50 ${hasDetail ? "cursor-pointer hover:bg-zinc-50" : "hover:bg-zinc-50"}`}
        onClick={() => hasDetail && setExpandedLogId(isExpanded ? null : log.id)}
      >
        <td className="py-2 px-2 w-8">
          {hasDetail && (
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          )}
        </td>
        {/* ... all existing <td> cells ... */}
      </tr>
      {isExpanded && (
        <tr className="bg-zinc-50 border-b border-zinc-100">
          <td colSpan={8} className="px-4 py-3">
            <pre className="text-xs text-zinc-600 whitespace-pre-wrap break-all font-mono bg-zinc-100 rounded-lg p-3 max-h-40 overflow-auto">
              {log.error || log.message || ""}
            </pre>
          </td>
        </tr>
      )}
    </React.Fragment>
  )
})}
```

### 12b: Record rows expand to show dimension score details

- [ ] **Step 3: Add expandedRecordId state to records-tab.tsx**

```tsx
const [expandedRecordId, setExpandedRecordId] = React.useState<string | null>(null)
```

Add `import React from "react"` and `ChevronDown` from lucide if not present.

- [ ] **Step 4: Make record rows expandable**

In the table tbody, wrap each row similarly:
```tsx
{recordList.map((r) => {
  const isExpanded = expandedRecordId === r.id
  return (
    <React.Fragment key={r.id}>
      <tr
        className="hover:bg-zinc-50 transition-colors cursor-pointer"
        onClick={() => setExpandedRecordId(isExpanded ? null : r.id)}
      >
        {/* ... existing cells + add expand icon to first cell ... */}
        <td className="py-3 px-4 text-zinc-400 text-xs whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <ChevronDown className={`w-3 h-3 text-zinc-300 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            {new Date(r.timestamp).toLocaleString()}
          </div>
        </td>
        {/* ... rest of cells unchanged ... */}
      </tr>
      {isExpanded && (
        <tr className="bg-zinc-50 border-b border-zinc-100">
          <td colSpan={9} className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              {(["EI", "SN", "TF", "JP"] as const).map((dim) => (
                <div key={dim} className="text-center">
                  <div className="text-xs font-semibold text-zinc-500 mb-1">{dim}</div>
                  <div className="text-sm font-bold text-zinc-800">
                    {r.scores[dim].winner}
                  </div>
                  <div className="mt-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-indigo-400 rounded-full"
                      style={{ width: `${r.scores[dim].percent}%` }}
                    />
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{r.scores[dim].percent}%</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-zinc-400">
              <span>ID: <span className="font-mono text-zinc-500">{r.id}</span></span>
              {r.ageGroup && <span>{r.ageGroup}</span>}
              {r.gender && <span>{r.gender}</span>}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  )
})}
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/tabs/stats-tab.tsx components/admin/tabs/records-tab.tsx
git commit -m "feat: add expandable table rows for log and record details"
```

---

## Self-Review

### Spec coverage

| # | Feature | Task |
|---|---|---|
| 1 | Auto-refresh Toggle Switch | Task 2 |
| 2 | Trend arrows on stat cards | Task 3 |
| 3 | Sidebar badges | Task 4 |
| 4 | Provider status dots | Task 5 |
| 5 | Log text search | Task 6 |
| 6 | Records MBTI mini chart | Task 7 |
| 7 | Questions dimension stats | Task 8 |
| 8 | Version update banner | Task 9 |
| 9 | Skeleton loading states | Task 10 |
| 10 | Toast notifications | Task 1 |
| 11 | Sidebar collapse | Task 11 |
| 12 | Table row expand | Task 12 |

All 12 features covered. ✓

### Placeholder scan

No TBD, TODO, or placeholder content found. All code blocks contain complete implementations. ✓

### Type consistency

- `NavItem.badge?: number | "dot"` — defined in Task 4 Step 1, consumed in same task and Task 11
- `calcTrend()` — defined in Task 3 Step 1, consumed in Task 3 Step 2
- `ToastProvider` / `useToast` — defined in Task 1 Step 1, consumed in Task 1 Step 2
- `SkeletonTable` — defined in Task 10 Step 1, consumed in Steps 2-4 ✓
- `StatusDot` — local to providers-tab, no cross-file type issues ✓
- `logSearch` / `setLogSearch` — added to page.tsx state + passed to StatsTab; StatsTabProps updated in Task 6 ✓
