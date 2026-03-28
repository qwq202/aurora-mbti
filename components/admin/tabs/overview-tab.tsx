"use client"

import React from "react"
import {
  CheckCircle, Clock, Cpu, Layers,
  Minus, RefreshCw, Server, TrendingDown, TrendingUp, Wifi, Zap, Brain
} from "lucide-react"
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { OverviewData, StatsData, ProviderInfo } from "../shared/types"
import { Toggle } from "../shared/toggle"
import { formatMB, formatUptime, formatNumber, formatToken, calcTrend } from "../shared/utils"

export interface OverviewTabProps {
  overview: OverviewData | null
  stats: StatsData | null
  text: {
    stats: {
      totalCalls: string
      testCompletions: string
      tokenUsage: string
      dailyTrend: string
      byEndpoint: string
      successRate: string
    }
    overview: {
      runtime: string
      uptime: string
      model: string
      memory: string
      heapTotal: string
      rss: string
      external: string
      baseUrl: string
    }
    providerConfig: string
    providerTest: string
    testing: string
    runTest: string
    autoRefresh: string
    autoRefreshHint: string
  }
  isZh: boolean
  error: string | null
  derivedStats: {
    errorRate: string
    successRate: string
    dailyAvg: number
    tokenRatio: string
    errorLogs: number
  }
  providerToTest: string
  testing: boolean
  testResult: string | null
  autoRefresh: boolean
  onAutoRefreshChange: (value: boolean) => void
  handleProviderTest: () => void
  setProviderToTest: (value: string) => void
}

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

export function OverviewTab({
  overview,
  stats,
  text,
  isZh,
  error,
  derivedStats,
  providerToTest,
  testing,
  testResult,
  autoRefresh,
  onAutoRefreshChange,
  handleProviderTest,
  setProviderToTest,
}: OverviewTabProps) {
  const callsTrend = calcTrend(stats?.daily, "calls")
  const testsTrend = calcTrend(stats?.daily, "tests")
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {/* 自动刷新开关 */}
      <div className="flex items-center gap-2 justify-end">
        <Toggle
          checked={autoRefresh}
          onChange={onAutoRefreshChange}
          label={text.autoRefresh}
          hint={text.autoRefreshHint}
        />
      </div>
      {/* 快速统计摘要行 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-xs text-zinc-500">{text.stats.totalCalls}</span>
          </div>
          <div className="text-2xl font-bold">{stats ? formatNumber(stats.totalCalls) : "—"}</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-zinc-400">{isZh ? "累计请求次数" : "Total requests"}</span>
            <TrendBadge trend={callsTrend} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs text-zinc-500">{text.stats.testCompletions}</span>
          </div>
          <div className="text-2xl font-bold">{stats ? formatNumber(stats.testCompletions) : "—"}</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-zinc-400">{isZh ? "完成测试人次" : "Completed tests"}</span>
            <TrendBadge trend={testsTrend} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-zinc-500">{text.stats.tokenUsage}</span>
          </div>
          <div className="text-2xl font-bold">{stats ? formatToken(stats.totalTokens) : "—"}</div>
          <div className="mt-1 text-xs text-zinc-400">
            {isZh ? "输入" : "In"} {stats ? formatToken(stats.tokenUsage.input) : 0} / {isZh ? "输出" : "Out"} {stats ? formatToken(stats.tokenUsage.output) : 0}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${parseFloat(derivedStats.errorRate) > 10 ? "bg-rose-50" : "bg-teal-50"}`}>
              <TrendingUp className={`w-4 h-4 ${parseFloat(derivedStats.errorRate) > 10 ? "text-rose-600" : "text-teal-600"}`} />
            </div>
            <span className="text-xs text-zinc-500">{text.stats.successRate}</span>
          </div>
          <div className="text-2xl font-bold">{derivedStats.successRate}%</div>
          <div className="mt-1 text-xs text-zinc-400">
            {derivedStats.errorLogs} {isZh ? "条错误日志" : "error logs"}
          </div>
        </div>
      </div>

      {/* 系统状态三卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-zinc-300">{text.overview.runtime}</span>
          </div>
          <div className="text-2xl font-bold">
            {overview?.runtime.nodeEnv === "development" ? (isZh ? "开发环境" : "Dev")
              : overview?.runtime.nodeEnv === "production" ? (isZh ? "生产环境" : "Prod")
              : overview?.runtime.nodeEnv || "unknown"}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="w-4 h-4" />
            {text.overview.uptime}: {overview ? formatUptime(overview.runtime.uptimeSeconds) : "—"}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-emerald-100">{isZh ? "AI 渠道" : "AI Provider"}</span>
          </div>
          <div className="text-2xl font-bold capitalize">{overview?.ai.activeProvider || "—"}</div>
          <div className="mt-3 space-y-1">
            <div className="text-sm text-emerald-100">{text.overview.model}: {overview?.ai.activeConfig?.model || "—"}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-indigo-100">{text.overview.memory}</span>
          </div>
          <div className="text-2xl font-bold">{overview ? formatMB(overview.runtime.memory.heapUsed) : "—"}</div>
          <div className="mt-3 space-y-1 text-xs text-indigo-200">
            <div className="flex justify-between">
              <span>{text.overview.heapTotal}</span>
              <span>{overview ? formatMB(overview.runtime.memory.heapTotal) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>{text.overview.rss}</span>
              <span>{overview ? formatMB(overview.runtime.memory.rss) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>{text.overview.external}</span>
              <span>{overview ? formatMB(overview.runtime.memory.external) : "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 趋势图 */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{text.stats.dailyTrend}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart data={stats?.daily || []}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" name={isZh ? "API 调用" : "API Calls"} />
              <Area type="monotone" dataKey="tests" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTests)" name={isZh ? "测试完成" : "Tests"} />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 端点统计 */}
      {stats && Object.keys(stats.byEndpoint).length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{text.stats.byEndpoint}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(stats.byEndpoint).map(([k, v]) => ({ name: k, value: v })).slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#71717a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI 配置 + 连接测试 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{text.providerConfig}</h3>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm text-zinc-500 mb-1">{isZh ? "当前渠道" : "Active Provider"}</label>
                <div className="h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm flex items-center">
                  <span className="font-medium capitalize">{overview?.ai.activeProvider || "—"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-1">{text.overview.model}</label>
                <div className="h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm flex items-center font-mono">
                  {overview?.ai.activeConfig?.model || "—"}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1">{text.overview.baseUrl}</label>
              <div className="h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm flex items-center font-mono truncate">
                {overview?.ai.activeConfig?.baseUrl || "—"}
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1">API Key</label>
              <div className="h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm flex items-center">
                {overview?.ai.activeConfig?.hasKey ? (
                  <span className="text-emerald-600">{isZh ?"已配置" : "Configured"}</span>
                ) : (
                  <span className="text-amber-600">{isZh ? "未配置" : "Not configured"}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{text.providerTest}</h3>
          <div className="flex gap-3 mb-4">
            <select
              value={providerToTest}
              onChange={(e) => setProviderToTest(e.target.value)}
              className="flex-1 h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
            >
              {(overview?.specs || []).map((p: ProviderInfo) => (
                <option key={p.id} value={p.id}>{p.id} - {p.label}</option>
              ))}
            </select>
            <button
              onClick={handleProviderTest}
              disabled={testing || !providerToTest}
              className="h-10 px-5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              {testing ? text.testing : text.runTest}
            </button>
          </div>
          {testResult && (
            <pre className="p-4 bg-zinc-900 text-emerald-400 text-xs rounded-lg overflow-auto max-h-32">
              {testResult}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}