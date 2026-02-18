"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/routing"
import { 
  Activity, BarChart3, Brain, 
  CheckCircle, ChevronRight, Clock, Cpu, Database,
  Gauge, Globe, Key, Layers, 
  LogOut, Network, RefreshCw, Server, 
  Shield, Trash2, Unlock, Wifi, WifiOff,
  AlertTriangle, TrendingUp, Zap, Filter
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
  PieChart,
  Pie,
  Cell,
} from "recharts"

type ProviderInfo = {
  id: string
  label: string
  defaultBaseUrl: string
  defaultModel: string
  requiresApiKey: boolean
}

type OverviewData = {
  runtime: {
    nodeEnv: string
    uptimeSeconds: number
    memory: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
      arrayBuffers: number
    }
    timestamp: string
  }
  ai: {
    currentProvider: string
    baseUrl: string
    model: string
    apiKeySet: boolean
    apiKeyMasked: string
    source?: string
  }
  security: {
    debugApiLogs: boolean
    corsAllowedOrigins: string
  }
  providers: ProviderInfo[]
}

type StatsData = {
  totalCalls: number
  testCompletions: number
  tokenUsage: {
    input: number
    output: number
  }
  totalTokens: number
  daily: { date: string; calls: number; tests: number }[]
  byEndpoint: Record<string, number>
}

type LogEntry = {
  id: string
  timestamp: string
  level: string
  endpoint: string
  method: string
  statusCode?: number
  duration?: number
  message?: string
  error?: string
}

type TabType = "overview" | "stats" | "providers" | "security"
type LogLevel = "all" | "error" | "warn" | "info" | "debug"

type AIEditableConfig = {
  provider: string
  baseUrl: string
  model: string
  apiKey: string
}

function formatMB(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}

function formatUptime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function formatToken(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default function AdminPage() {
  const router = useRouter()
  const locale = useLocale()
  const isZh = locale.startsWith("zh")

  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState("")
  const [providerToTest, setProviderToTest] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState("")
  const [logsLoading, setLogsLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [configMessage, setConfigMessage] = useState("")
  const [switchingProvider, setSwitchingProvider] = useState("")
  const [logLevelFilter, setLogLevelFilter] = useState<LogLevel>("all")
  const [configDraft, setConfigDraft] = useState<AIEditableConfig>({
    provider: "",
    baseUrl: "",
    model: "",
    apiKey: "",
  })

  const readErrorMessage = (body: unknown, fallback: string) => {
    if (!body || typeof body !== "object") return fallback
    const record = body as Record<string, unknown>
    if (record.error && typeof record.error === "object") {
      const nested = (record.error as Record<string, unknown>).message
      if (typeof nested === "string" && nested.trim()) return nested
    }
    if (typeof record.error === "string" && record.error.trim()) return record.error
    return fallback
  }

  const text = useMemo(
    () => ({
      title: isZh ? "控制台" : "Console",
      subtitle: isZh ? "Aurora MBTI 管理后台" : "Aurora MBTI Admin",
      loginTitle: isZh ? "管理员登录" : "Admin Login",
      goToLogin: isZh ? "前往登录" : "Go to Login",
      loadFailed: isZh ? "加载数据失败" : "Failed to load data",
      logout: isZh ? "退出" : "Logout",
      refresh: isZh ? "刷新" : "Refresh",
      providerTest: isZh ? "连接测试" : "Connection Test",
      providerConfig: isZh ? "AI 配置" : "AI Config",
      runTest: isZh ? "测试" : "Test",
      saveConfig: isZh ? "保存" : "Save",
      testing: isZh ? "测试中..." : "Testing...",
      saving: isZh ? "保存中..." : "Saving...",
      configSaved: isZh ? "已保存" : "Saved",
      unauthorized: isZh ? "请先登录" : "Please login first",
      switchProvider: isZh ? "切换" : "Switch",
      switching: isZh ? "切换中..." : "Switching...",
      switchSuccess: isZh ? "已切换" : "Switched",
      tabs: {
        overview: isZh ? "概览" : "Overview",
        stats: isZh ? "统计" : "Stats",
        providers: isZh ? "渠道" : "Providers",
        security: isZh ? "安全" : "Security",
      },
      stats: {
        totalCalls: isZh ? "API 调用" : "API Calls",
        testCompletions: isZh ? "测试完成" : "Tests",
        tokenUsage: isZh ? "Token 消耗" : "Tokens",
        inputTokens: isZh ? "输入" : "In",
        outputTokens: isZh ? "输出" : "Out",
        dailyTrend: isZh ? "调用趋势" : "Call Trend",
        byEndpoint: isZh ? "端点统计" : "Endpoints",
        logsTitle: isZh ? "请求日志" : "Request Logs",
        clearLogs: isZh ? "清空" : "Clear",
        noLogs: isZh ? "暂无日志" : "No logs",
        errorRate: isZh ? "错误率" : "Error Rate",
        dailyAvg: isZh ? "日均调用" : "Daily Avg",
        tokenRatio: isZh ? "输出/输入比" : "Out/In Ratio",
        successRate: isZh ? "成功率" : "Success Rate",
        allLevels: isZh ? "全部" : "All",
      },
      overview: {
        runtime: isZh ? "运行状态" : "Runtime",
        aiProvider: isZh ? "当前渠道" : "Provider",
        memory: isZh ? "内存" : "Memory",
        uptime: isZh ? "运行时间" : "Uptime",
        model: isZh ? "模型" : "Model",
        baseUrl: isZh ? "地址" : "URL",
        rss: isZh ? "物理内存" : "RSS",
        heapTotal: isZh ? "堆总量" : "Heap Total",
        heapUsed: isZh ? "堆已用" : "Heap Used",
        external: isZh ? "外部" : "External",
      },
      providers: {
        title: isZh ? "渠道管理" : "Provider Management",
        current: isZh ? "当前" : "Active",
        defaultUrl: isZh ? "默认地址" : "Default URL",
        defaultModel: isZh ? "默认模型" : "Default Model",
        requiresKey: isZh ? "需要 Key" : "Requires Key",
        noKey: isZh ? "无需 Key" : "No Key",
        config: isZh ? "配置" : "Config",
        source: isZh ? "来源" : "Source",
        leaveEmpty: isZh ? "留空保持不变" : "Leave empty to keep",
      },
      security: {
        title: isZh ? "安全设置" : "Security",
        debugLogs: isZh ? "调试日志" : "Debug Logs",
        debugLogsDesc: isZh ? "开启后记录详细请求信息" : "Enable detailed request logging",
        cors: isZh ? "跨域来源" : "CORS Origins",
        corsDesc: isZh ? "允许跨域请求的来源" : "Allowed origins for CORS requests",
        apiKey: isZh ? "AI API Key" : "AI API Key",
        apiKeyDesc: isZh ? "当前配置的 AI 服务密钥" : "Currently configured AI service key",
        adminToken: isZh ? "管理员令牌" : "Admin Token",
        adminTokenDesc: isZh ? "控制台访问凭证" : "Console access credential",
        memStatus: isZh ? "内存状态" : "Memory Status",
        memStatusDesc: isZh ? "RSS 内存使用情况" : "Physical memory (RSS) usage",
        configured: isZh ? "已配置" : "Configured",
        notConfigured: isZh ? "未配置" : "Not configured",
        normal: isZh ? "正常" : "Normal",
        warning: isZh ? "偏高" : "High",
      },
    }),
    [isZh]
  )

  const navItems = [
    {
      id: "overview" as TabType,
      label: text.tabs.overview,
      desc: isZh ? "系统状态一览" : "System status",
      icon: Gauge,
      accent: "bg-sky-500",
      accentText: "text-sky-400",
      accentBg: "bg-sky-500/15",
    },
    {
      id: "stats" as TabType,
      label: text.tabs.stats,
      desc: isZh ? "数据统计分析" : "Analytics & logs",
      icon: BarChart3,
      accent: "bg-emerald-500",
      accentText: "text-emerald-400",
      accentBg: "bg-emerald-500/15",
    },
    {
      id: "providers" as TabType,
      label: text.tabs.providers,
      desc: isZh ? "AI 渠道管理" : "AI providers",
      icon: Network,
      accent: "bg-violet-500",
      accentText: "text-violet-400",
      accentBg: "bg-violet-500/15",
    },
    {
      id: "security" as TabType,
      label: text.tabs.security,
      desc: isZh ? "安全与环境配置" : "Security & env",
      icon: Shield,
      accent: "bg-amber-500",
      accentText: "text-amber-400",
      accentBg: "bg-amber-500/15",
    },
  ]

  const loadStats = async (signal?: AbortSignal) => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch("/api/admin/stats?days=7", { credentials: "include", signal }),
        fetch("/api/admin/logs?limit=100", { credentials: "include", signal })
      ])
      const statsData = await statsRes.json()
      const logsData = await logsRes.json()
      if (statsRes.ok) setStats(statsData.stats)
      if (logsRes.ok) setLogs(logsData.logs)
    } catch (err) {
      // AbortError 是主动取消，不视为错误
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Failed to load stats:", err)
    } finally {
      setLogsLoading(false)
    }
  }

  const loadOverview = async (signal?: AbortSignal) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/overview", { credentials: "include", signal })
      const data = await res.json()
      if (!res.ok) {
        setAuthorized(false)
        setOverview(null)
        setError(readErrorMessage(data, text.loadFailed))
        router.push(`/${locale}/login`)
        return
      }
      setAuthorized(true)
      setOverview(data.overview as OverviewData)
      setProviderToTest((prev) => prev || data.overview.ai.currentProvider)
      setConfigDraft((prev) => ({
        provider: prev.provider || data.overview.ai.currentProvider || "",
        baseUrl: prev.baseUrl || data.overview.ai.baseUrl || "",
        model: prev.model || data.overview.ai.model || "",
        apiKey: "",
      }))
      // 同步加载统计数据，概览页图表需要
      setLogsLoading(true)
      void loadStats(signal)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(text.loadFailed)
      router.push(`/${locale}/login`)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      await fetch("/api/admin/logs", { method: "DELETE", credentials: "include" })
      setLogs([])
    } catch (err) {
      console.error("Failed to clear logs:", err)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadOverview(controller.signal)
    // 组件卸载时取消飞行中的请求，防止在已卸载组件上 setState
    return () => controller.abort()
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    setAuthorized(false)
    setOverview(null)
    setTestResult("")
    setStats(null)
    setLogs([])
    router.push(`/${locale}/login`)
  }

  const handleProviderTest = async () => {
    setTesting(true)
    setTestResult("")
    try {
      const res = await fetch("/api/admin/provider-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ config: { provider: providerToTest } }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTestResult(`${isZh ? "失败" : "Failed"}: ${readErrorMessage(data, "Unknown error")}`)
      } else {
        setTestResult(`${isZh ? "成功" : "Success"}: ${data?.preview || "OK"}`)
      }
    } catch {
      setTestResult(isZh ? "网络错误" : "Network error")
    } finally {
      setTesting(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!configDraft.provider) {
      setConfigMessage(isZh ? "请选择渠道" : "Select provider")
      return
    }
    setConfigSaving(true)
    setConfigMessage("")
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ config: configDraft }),
      })
      const data = await res.json()
      if (!res.ok) {
        setConfigMessage(readErrorMessage(data, isZh ? "保存失败" : "Save failed"))
        return
      }
      setConfigMessage(text.configSaved)
      setConfigDraft((prev) => ({ ...prev, apiKey: "" }))
      await loadOverview()
    } catch {
      setConfigMessage(isZh ? "保存失败" : "Save failed")
    } finally {
      setConfigSaving(false)
    }
  }

  const handleSwitchProvider = async (providerId: string) => {
    setSwitchingProvider(providerId)
    try {
      const provider = (overview?.providers || []).find((p) => p.id === providerId)
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          config: {
            provider: providerId,
            baseUrl: provider?.defaultBaseUrl || "",
            model: provider?.defaultModel || "",
            apiKey: "",
          },
        }),
      })
      if (res.ok) {
        await loadOverview()
      }
    } catch (err) {
      console.error("Failed to switch provider:", err)
    } finally {
      setSwitchingProvider("")
    }
  }

  // 从日志计算派生指标
  const derivedStats = useMemo(() => {
    const totalLogs = logs.length
    const errorLogs = logs.filter((l) => l.level === "error").length
    const errorRate = totalLogs > 0 ? ((errorLogs / totalLogs) * 100).toFixed(1) : "0.0"
    const successRate = totalLogs > 0 ? (((totalLogs - errorLogs) / totalLogs) * 100).toFixed(1) : "100.0"

    const daysWithData = stats?.daily?.filter((d) => d.calls > 0).length || 1
    const dailyAvg = stats ? Math.round(stats.totalCalls / Math.max(daysWithData, 1)) : 0

    const tokenRatio = stats && stats.tokenUsage.input > 0
      ? (stats.tokenUsage.output / stats.tokenUsage.input).toFixed(2)
      : "0.00"

    return { errorRate, successRate, dailyAvg, tokenRatio, errorLogs }
  }, [logs, stats])

  const filteredLogs = useMemo(() => {
    if (logLevelFilter === "all") return logs
    return logs.filter((l) => l.level === logLevelFilter)
  }, [logs, logLevelFilter])

  const logLevelCounts = useMemo(() => ({
    all: logs.length,
    error: logs.filter((l) => l.level === "error").length,
    warn: logs.filter((l) => l.level === "warn").length,
    info: logs.filter((l) => l.level === "info").length,
    debug: logs.filter((l) => l.level === "debug").length,
  }), [logs])

  const tokenPieData = useMemo(() => {
    if (!stats || stats.totalTokens === 0) return []
    return [
      { name: isZh ? "输入" : "Input", value: stats.tokenUsage.input },
      { name: isZh ? "输出" : "Output", value: stats.tokenUsage.output },
    ]
  }, [stats, isZh])

  const PIE_COLORS = ["#6366f1", "#10b981"]

  // ──────────────────────────────────────────────
  // 渲染：概览
  // ──────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
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
          <div className="mt-1 text-xs text-zinc-400">{isZh ? "累计请求次数" : "Total requests"}</div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs text-zinc-500">{text.stats.testCompletions}</span>
          </div>
          <div className="text-2xl font-bold">{stats ? formatNumber(stats.testCompletions) : "—"}</div>
          <div className="mt-1 text-xs text-zinc-400">{isZh ? "完成测试人次" : "Completed tests"}</div>
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
          <div className="text-2xl font-bold capitalize">{overview?.ai.currentProvider || "—"}</div>
          <div className="mt-3 space-y-1">
            <div className="text-sm text-emerald-100">{text.overview.model}: {overview?.ai.model || "—"}</div>
            {overview?.ai.source && (
              <div className="text-xs text-emerald-200">{isZh ? "来源" : "Source"}: {overview.ai.source}</div>
            )}
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
                <label className="block text-sm text-zinc-500 mb-1">{isZh ? "渠道" : "Provider"}</label>
                <select
                  value={configDraft.provider}
                  onChange={(e) => {
                    const provider = (overview?.providers || []).find((p) => p.id === e.target.value)
                    setConfigDraft((prev) => ({
                      ...prev,
                      provider: e.target.value,
                      baseUrl: provider?.defaultBaseUrl || prev.baseUrl,
                      model: provider?.defaultModel || prev.model,
                    }))
                    setProviderToTest(e.target.value)
                  }}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                >
                  {(overview?.providers || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-1">{text.overview.model}</label>
                <input
                  value={configDraft.model}
                  onChange={(e) => setConfigDraft((prev) => ({ ...prev, model: e.target.value }))}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  placeholder="gpt-4o-mini"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1">{text.overview.baseUrl}</label>
              <input
                value={configDraft.baseUrl}
                onChange={(e) => setConfigDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono"
                placeholder="https://api.openai.com"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1">API Key</label>
              <input
                type="password"
                value={configDraft.apiKey}
                onChange={(e) => setConfigDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono"
                placeholder={overview?.ai.apiKeySet ? `•••• ${overview.ai.apiKeyMasked}` : "sk-..."}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveConfig}
                disabled={configSaving}
                className="h-10 px-5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50"
              >
                {configSaving ? text.saving : text.saveConfig}
              </button>
              {configMessage && (
                <span className={`text-sm ${configMessage === text.configSaved ? "text-emerald-600" : "text-rose-500"}`}>
                  {configMessage}
                </span>
              )}
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
              {(overview?.providers || []).map((p) => (
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

  // ──────────────────────────────────────────────
  // 渲染：统计
  // ──────────────────────────────────────────────
  const renderStats = () => (
    <div className="space-y-6">
      {/* 6 个指标卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm text-zinc-500">{text.stats.totalCalls}</span>
          </div>
          <div className="text-3xl font-bold">{stats ? formatNumber(stats.totalCalls) : "—"}</div>
          <div className="mt-1 text-xs text-zinc-400">{isZh ? "全部 API 请求" : "All API requests"}</div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-zinc-500">{text.stats.testCompletions}</span>
          </div>
          <div className="text-3xl font-bold">{stats ? formatNumber(stats.testCompletions) : "—"}</div>
          <div className="mt-1 text-xs text-zinc-400">{isZh ? "MBTI 测试完成次数" : "MBTI tests completed"}</div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-zinc-500">{text.stats.tokenUsage}</span>
          </div>
          <div className="text-3xl font-bold">{stats ? formatToken(stats.totalTokens) : "—"}</div>
          <div className="mt-1 text-xs text-zinc-400">
            {text.stats.inputTokens} {stats ? formatToken(stats.tokenUsage.input) : 0} / {text.stats.outputTokens} {stats ? formatToken(stats.tokenUsage.output) : 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${parseFloat(derivedStats.errorRate) > 10 ? "bg-rose-50" : "bg-teal-50"}`}>
              <AlertTriangle className={`w-5 h-5 ${parseFloat(derivedStats.errorRate) > 10 ? "text-rose-600" : "text-teal-600"}`} />
            </div>
            <span className="text-sm text-zinc-500">{text.stats.errorRate}</span>
          </div>
          <div className={`text-3xl font-bold ${parseFloat(derivedStats.errorRate) > 10 ? "text-rose-600" : ""}`}>
            {derivedStats.errorRate}%
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {derivedStats.errorLogs} {isZh ? "条错误" : "errors"} / {logs.length} {isZh ? "条日志" : "logs"}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-sm text-zinc-500">{text.stats.dailyAvg}</span>
          </div>
          <div className="text-3xl font-bold">{formatNumber(derivedStats.dailyAvg)}</div>
          <div className="mt-1 text-xs text-zinc-400">{isZh ? "近 7 天平均" : "7-day average"}</div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sky-50 rounded-lg">
              <Activity className="w-5 h-5 text-sky-600" />
            </div>
            <span className="text-sm text-zinc-500">{text.stats.tokenRatio}</span>
          </div>
          <div className="text-3xl font-bold">{derivedStats.tokenRatio}</div>
          <div className="mt-1 text-xs text-zinc-400">{isZh ? "输出 Token / 输入 Token" : "Output tokens / Input tokens"}</div>
        </div>
      </div>

      {/* 趋势图 + Token 饼图 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{text.stats.dailyTrend}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart data={stats?.daily || []}>
                <defs>
                  <linearGradient id="statsCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="statsTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#statsCalls)" name={isZh ? "API 调用" : "API Calls"} />
                <Area type="monotone" dataKey="tests" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#statsTests)" name={isZh ? "测试完成" : "Tests"} />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{isZh ? "Token 分布" : "Token Split"}</h3>
          {tokenPieData.length > 0 ? (
            <div className="h-56 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie data={tokenPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {tokenPieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatToken(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {tokenPieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    {item.name}: {formatToken(item.value)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-zinc-300 text-sm">
              {isZh ? "暂无数据" : "No data"}
            </div>
          )}
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

      {/* 日志（带级别过滤） */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{text.stats.logsTitle}</h3>
          <button
            onClick={clearLogs}
            className="h-8 px-3 bg-rose-500 text-white text-xs font-medium rounded-lg hover:bg-rose-600 inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            {text.stats.clearLogs}
          </button>
        </div>

        {/* 级别过滤 Tabs */}
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-zinc-400 mr-1" />
          {(["all", "error", "warn", "info", "debug"] as LogLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setLogLevelFilter(level)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                logLevelFilter === level
                  ? level === "error" ? "bg-rose-500 text-white"
                    : level === "warn" ? "bg-amber-500 text-white"
                    : level === "info" ? "bg-sky-500 text-white"
                    : level === "debug" ? "bg-violet-500 text-white"
                    : "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {level === "all" ? text.stats.allLevels : level}
              <span className="ml-1 opacity-70">({logLevelCounts[level]})</span>
            </button>
          ))}
        </div>

        {logsLoading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-300" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">{text.stats.noLogs}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-3 px-2 font-medium text-zinc-500">{isZh ? "时间" : "Time"}</th>
                  <th className="text-left py-3 px-2 font-medium text-zinc-500">{isZh ? "级别" : "Level"}</th>
                  <th className="text-left py-3 px-2 font-medium text-zinc-500">Method</th>
                  <th className="text-left py-3 px-2 font-medium text-zinc-500">Endpoint</th>
                  <th className="text-left py-3 px-2 font-medium text-zinc-500">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-zinc-500">{isZh ? "耗时" : "Duration"}</th>
                  <th className="text-left py-3 px-2 font-medium text-zinc-500">{isZh ? "消息" : "Message"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="py-2 px-2 text-zinc-400 whitespace-nowrap text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.level === "error" ? "bg-rose-100 text-rose-700" :
                        log.level === "warn" ? "bg-amber-100 text-amber-700" :
                        log.level === "debug" ? "bg-violet-100 text-violet-700" :
                        "bg-zinc-100 text-zinc-600"
                      }`}>{log.level}</span>
                    </td>
                    <td className="py-2 px-2 font-mono text-xs text-zinc-600">{log.method}</td>
                    <td className="py-2 px-2 font-mono text-xs text-zinc-500 truncate max-w-[160px]">{log.endpoint}</td>
                    <td className="py-2 px-2 text-xs">
                      {log.statusCode && (
                        <span className={log.statusCode >= 400 ? "text-rose-500" : "text-emerald-500"}>{log.statusCode}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-xs text-zinc-400 whitespace-nowrap">
                      {log.duration != null ? `${log.duration}ms` : "—"}
                    </td>
                    <td className="py-2 px-2 text-xs text-zinc-500 truncate max-w-[200px]">
                      {log.error || log.message || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  // ──────────────────────────────────────────────
  // 渲染：渠道
  // ──────────────────────────────────────────────
  const renderProviders = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(overview?.providers || []).map((provider) => {
          const isActive = provider.id === overview?.ai.currentProvider
          const isSwitching = switchingProvider === provider.id
          return (
            <div
              key={provider.id}
              className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all hover:shadow-md ${
                isActive
                  ? "border-emerald-500 ring-2 ring-emerald-500/10"
                  : "border-zinc-100 hover:border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-base">{provider.id}</div>
                {isActive ? (
                  <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {text.providers.current}
                  </span>
                ) : (
                  <button
                    onClick={() => void handleSwitchProvider(provider.id)}
                    disabled={isSwitching || !!switchingProvider}
                    className="px-3 py-1 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-600 text-xs font-medium rounded-full transition-all disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {isSwitching && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {isSwitching ? text.switching : text.switchProvider}
                  </button>
                )}
              </div>
              <div className="text-sm text-zinc-500 mb-3">{provider.label}</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                  <span className="font-mono text-zinc-400 truncate">{provider.defaultBaseUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                  <span className="text-zinc-500">{provider.defaultModel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-3 h-3 flex-shrink-0" />
                  <span className={provider.requiresApiKey ? "text-amber-600 font-medium" : "text-emerald-600 font-medium"}>
                    {provider.requiresApiKey ? text.providers.requiresKey : text.providers.noKey}
                  </span>
                </div>
                {isActive && overview?.ai.source && (
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 mt-1">
                    <Server className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                    <span className="text-zinc-400">{isZh ? "配置来源" : "Source"}: <span className="font-mono">{overview.ai.source}</span></span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ──────────────────────────────────────────────
  // 渲染：安全
  // ──────────────────────────────────────────────
  const renderSecurity = () => {
    const rssBytes = overview?.runtime.memory.rss || 0
    const rssMB = Math.round(rssBytes / 1024 / 1024)
    const memWarning = rssMB > 512

    const securityItems = [
      {
        icon: Unlock,
        label: text.security.debugLogs,
        desc: text.security.debugLogsDesc,
        envKey: "DEBUG_API_LOGS",
        value: overview?.security.debugApiLogs,
        valueDisplay: overview?.security.debugApiLogs ? "true" : "false",
        statusColor: overview?.security.debugApiLogs
          ? "bg-amber-100 text-amber-700"
          : "bg-zinc-100 text-zinc-500",
      },
      {
        icon: Globe,
        label: text.security.cors,
        desc: text.security.corsDesc,
        envKey: "CORS_ALLOWED_ORIGINS",
        value: !!overview?.security.corsAllowedOrigins,
        valueDisplay: overview?.security.corsAllowedOrigins || "—",
        statusColor: "bg-zinc-100 text-zinc-600",
        mono: true,
      },
      {
        icon: Key,
        label: text.security.apiKey,
        desc: text.security.apiKeyDesc,
        envKey: "API_KEY / OPENAI_API_KEY",
        value: overview?.ai.apiKeySet,
        valueDisplay: overview?.ai.apiKeyMasked || "—",
        statusColor: overview?.ai.apiKeySet
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700",
        mono: true,
      },
      {
        icon: Shield,
        label: text.security.adminToken,
        desc: text.security.adminTokenDesc,
        envKey: "ADMIN_TOKEN",
        value: true,
        valueDisplay: text.security.configured,
        statusColor: "bg-emerald-100 text-emerald-700",
      },
      {
        icon: memWarning ? AlertTriangle : Activity,
        label: text.security.memStatus,
        desc: text.security.memStatusDesc,
        envKey: "RSS Memory",
        value: !memWarning,
        valueDisplay: `${rssMB} MB — ${memWarning ? text.security.warning : text.security.normal}`,
        statusColor: memWarning
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700",
      },
    ]

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h3 className="text-lg font-semibold">{text.security.title}</h3>
            <p className="text-sm text-zinc-400 mt-0.5">{isZh ? "当前环境安全配置一览" : "Current environment security configuration"}</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {securityItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${item.value === false ? "bg-rose-50" : "bg-zinc-100"}`}>
                    <item.icon className={`w-4 h-4 ${item.value === false ? "text-rose-500" : "text-zinc-500"}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                    <div className="text-xs text-zinc-300 font-mono mt-0.5">{item.envKey}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.statusColor} ${item.mono ? "font-mono" : ""} whitespace-nowrap ml-4`}>
                  {item.valueDisplay}
                </span>
              </div>
            ))}
          </div>
        </div>

        {memWarning && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-800">
                {isZh ? "内存使用偏高" : "High memory usage"}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                {isZh
                  ? `当前 RSS 内存为 ${rssMB} MB，超过 512 MB 建议值。请检查是否存在内存泄漏。`
                  : `Current RSS is ${rssMB} MB, exceeding the 512 MB recommendation. Consider checking for memory leaks.`}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview()
      case "stats": return renderStats()
      case "providers": return renderProviders()
      case "security": return renderSecurity()
      default: return null
    }
  }

  const activeNav = navItems.find((n) => n.id === activeTab)

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex h-screen overflow-hidden">
        {/* 侧边栏 — 深色主题 */}
        <aside className="w-64 bg-zinc-950 flex flex-col flex-shrink-0">
          {/* 品牌区域 */}
          <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 flex-shrink-0">
                <img src="/favicon.svg" alt="Aurora" className="w-9 h-9" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-none">Aurora MBTI</div>
                <div className="text-xs text-zinc-500 mt-0.5">{isZh ? "管理后台" : "Admin Console"}</div>
              </div>
            </div>
            {/* 环境 badge + 在线状态 */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                overview?.runtime.nodeEnv === "production"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}>
                {overview?.runtime.nodeEnv === "production"
                  ? (isZh ? "生产" : "PROD")
                  : overview?.runtime.nodeEnv === "development"
                  ? (isZh ? "开发" : "DEV")
                  : (overview?.runtime.nodeEnv?.toUpperCase() || "—")}
              </span>
              {authorized && (
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {overview ? formatUptime(overview.runtime.uptimeSeconds) : "—"}
                </span>
              )}
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
                    }`}
                  >
                    {/* 激活左侧 accent 条 */}
                    {isActive && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full ${item.accent}`} />
                    )}
                    {/* 图标容器 */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? item.accentBg : "bg-white/[0.04] group-hover:bg-white/[0.07]"
                    }`}>
                      <item.icon className={`w-4 h-4 ${isActive ? item.accentText : "text-zinc-500 group-hover:text-zinc-300"}`} />
                    </div>
                    {/* 文字 */}
                    <div className="text-left min-w-0">
                      <div className={`text-sm font-medium leading-none ${isActive ? "text-white" : ""}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-none truncate">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* 底部操作区 */}
          <div className="px-3 pb-4 border-t border-white/[0.06] pt-3 space-y-1 flex-shrink-0">
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-all text-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
              <span>{isZh ? "返回前台" : "Back to site"}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-sm group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-rose-500/15 flex items-center justify-center flex-shrink-0 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span>{text.logout}</span>
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  {activeNav && (
                    <div className={`w-7 h-7 rounded-lg ${activeNav.accentBg} flex items-center justify-center`}>
                      <activeNav.icon className={`w-4 h-4 ${activeNav.accentText}`} />
                    </div>
                  )}
                  <h1 className="text-2xl font-bold">{activeNav?.label || text.title}</h1>
                </div>
                <p className="text-sm text-zinc-400">{overview?.runtime.timestamp || ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { void loadOverview() }}
                  disabled={loading}
                  className="h-10 px-4 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  {text.refresh}
                </button>
              </div>
            </div>

            {!authorized ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <WifiOff className="w-8 h-8 text-zinc-300" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{text.unauthorized}</h2>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800"
                  >
                    {text.goToLogin}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
