"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/routing"
import { 
  Activity, BarChart3, Brain, 
  BookOpen, CheckCircle, ChevronLeft, ChevronRight, ClipboardList, Clock, Cpu, Database,
  Gauge, Globe, Key, Layers, 
  LogOut, Network, PieChart as PieChartIcon, Plus, RefreshCw, Search, Server, 
  Shield, Trash2, Upload, Download, Wifi, WifiOff,
  AlertTriangle, TrendingUp, X, Zap, Filter
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
  security: Record<string, never>
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

type TabType = "overview" | "stats" | "providers" | "security" | "questions" | "records" | "analytics"
type LogLevel = "all" | "error" | "warn" | "info" | "debug"

type StoredQuestion = {
  id: string
  locale: string
  text: string
  dimension: string
  agree: string
  contexts?: string[]
}

type DimensionScore = { winner: string; percent: number }

type AnonymousResult = {
  id: string
  timestamp: string
  mbtiType: string
  locale: string
  scores: {
    EI: DimensionScore
    SN: DimensionScore
    TF: DimensionScore
    JP: DimensionScore
  }
  ageGroup?: string
  gender?: string
}

type AnalyticsData = {
  typeDistribution: { type: string; count: number }[]
  dimensionAverages: { dimension: string; firstLetter: string; secondLetter: string; firstPercent: number }[]
  ageGroupDistribution: { ageGroup: string; count: number }[]
  genderDistribution: { gender: string; count: number }[]
  dailyTrend: { date: string; count: number }[]
  total: number
}

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

  // 题目管理状态
  const [questionList, setQuestionList] = useState<StoredQuestion[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [qLocaleFilter, setQLocaleFilter] = useState<string>("zh")
  const [qDimFilter, setQDimFilter] = useState<string>("")
  const [qSearch, setQSearch] = useState("")
  const [qModalOpen, setQModalOpen] = useState(false)
  const [editingQ, setEditingQ] = useState<StoredQuestion | null>(null)
  const [qForm, setQForm] = useState({ text: "", dimension: "EI", agree: "E", locale: "zh", contexts: "" })
  const [qSaving, setQSaving] = useState(false)
  const [qImporting, setQImporting] = useState(false)
  const [qMessage, setQMessage] = useState("")

  // 测试记录状态
  const [recordList, setRecordList] = useState<AnonymousResult[]>([])
  const [recordTotal, setRecordTotal] = useState(0)
  const [recordPage, setRecordPage] = useState(1)
  const [recordTotalPages, setRecordTotalPages] = useState(1)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordTypeFilter, setRecordTypeFilter] = useState("")
  const [recordLocaleFilter, setRecordLocaleFilter] = useState("")
  const [recordFrom, setRecordFrom] = useState("")
  const [recordTo, setRecordTo] = useState("")

  // 数据分析状态
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

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
        questions: isZh ? "题库" : "Questions",
        records: isZh ? "测试记录" : "Records",
        analytics: isZh ? "数据分析" : "Analytics",
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
        levelError: isZh ? "错误" : "error",
        levelWarn: isZh ? "警告" : "warn",
        levelInfo: isZh ? "信息" : "info",
        levelDebug: isZh ? "调试" : "debug",
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
        apiKey: isZh ? "AI API Key" : "AI API Key",
        apiKeyDesc: isZh ? "当前配置的 AI 服务密钥（在面板中设置）" : "AI service key (configured in panel)",
        adminCreds: isZh ? "管理员账号" : "Admin Account",
        adminCredsDesc: isZh ? "用户名和密码已在环境变量中配置" : "Username and password configured via env",
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

  type NavItem = {
    id: TabType
    label: string
    desc: string
    icon: React.ElementType
    accent: string
    accentText: string
    accentBg: string
  }
  type NavGroup = { label: string; items: NavItem[] }

  const navGroups: NavGroup[] = [
    {
      label: isZh ? "系统" : "System",
      items: [
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
      ],
    },
    {
      label: isZh ? "内容" : "Content",
      items: [
        {
          id: "questions" as TabType,
          label: text.tabs.questions,
          desc: isZh ? "MBTI 题库管理" : "Manage questions",
          icon: BookOpen,
          accent: "bg-orange-500",
          accentText: "text-orange-400",
          accentBg: "bg-orange-500/15",
        },
      ],
    },
    {
      label: isZh ? "数据" : "Data",
      items: [
        {
          id: "records" as TabType,
          label: text.tabs.records,
          desc: isZh ? "匿名测试记录" : "Anonymous records",
          icon: ClipboardList,
          accent: "bg-violet-500",
          accentText: "text-violet-400",
          accentBg: "bg-violet-500/15",
        },
        {
          id: "analytics" as TabType,
          label: text.tabs.analytics,
          desc: isZh ? "结果统计分析" : "Result analytics",
          icon: PieChartIcon,
          accent: "bg-pink-500",
          accentText: "text-pink-400",
          accentBg: "bg-pink-500/15",
        },
      ],
    },
    {
      label: isZh ? "配置" : "Config",
      items: [
        {
          id: "providers" as TabType,
          label: text.tabs.providers,
          desc: isZh ? "AI 渠道管理" : "AI providers",
          icon: Network,
          accent: "bg-indigo-500",
          accentText: "text-indigo-400",
          accentBg: "bg-indigo-500/15",
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
      ],
    },
  ]

  // 扁平化用于 activeNav 查找
  const navItems = navGroups.flatMap((g) => g.items)

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

  // 题目管理：加载列表
  const loadQuestions = async () => {
    setQLoading(true)
    setQMessage("")
    try {
      const params = new URLSearchParams({ locale: qLocaleFilter })
      if (qDimFilter) params.set("dimension", qDimFilter)
      const res = await fetch(`/api/admin/questions?${params.toString()}`, { credentials: "include" })
      const data = await res.json()
      if (res.ok) setQuestionList(data.questions as StoredQuestion[])
    } catch (err) {
      console.error("Failed to load questions:", err)
    } finally {
      setQLoading(false)
    }
  }

  // 题目管理：保存（新增/编辑）
  const saveQuestion = async () => {
    setQSaving(true)
    setQMessage("")
    try {
      const body = {
        text: qForm.text,
        dimension: qForm.dimension,
        agree: qForm.agree,
        locale: qForm.locale,
        contexts: qForm.contexts ? qForm.contexts.split(",").map((s) => s.trim()).filter(Boolean) : [],
      }
      const url = editingQ ? `/api/admin/questions/${editingQ.id}` : "/api/admin/questions"
      const method = editingQ ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setQModalOpen(false)
        setEditingQ(null)
        await loadQuestions()
      } else {
        const data = await res.json()
        setQMessage(readErrorMessage(data, isZh ? "保存失败" : "Save failed"))
      }
    } finally {
      setQSaving(false)
    }
  }

  // 题目管理：删除
  const deleteQuestion = async (id: string) => {
    if (!confirm(isZh ? "确认删除该题目？" : "Delete this question?")) return
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE", credentials: "include" })
    await loadQuestions()
  }

  // 题目管理：从内置导入
  const importBuiltin = async () => {
    setQImporting(true)
    setQMessage("")
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fromBuiltin: true, locale: qLocaleFilter }),
      })
      const data = await res.json()
      if (res.ok) {
        setQMessage(isZh ? `已导入 ${data.imported} 题` : `Imported ${data.imported} questions`)
        await loadQuestions()
      } else {
        setQMessage(readErrorMessage(data, isZh ? "导入失败" : "Import failed"))
      }
    } finally {
      setQImporting(false)
    }
  }

  // 题目管理：导出 JSON
  const exportQuestions = () => {
    const blob = new Blob([JSON.stringify(questionList, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `questions-${qLocaleFilter}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 测试记录：加载列表
  const loadRecords = async (page = 1) => {
    setRecordLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" })
      if (recordTypeFilter) params.set("type", recordTypeFilter)
      if (recordLocaleFilter) params.set("locale", recordLocaleFilter)
      if (recordFrom) params.set("from", recordFrom)
      if (recordTo) params.set("to", recordTo)
      const res = await fetch(`/api/admin/results?${params.toString()}`, { credentials: "include" })
      const data = await res.json()
      if (res.ok) {
        setRecordList(data.results as AnonymousResult[])
        setRecordTotal(data.total as number)
        setRecordPage(data.page as number)
        setRecordTotalPages(data.totalPages as number)
      }
    } catch (err) {
      console.error("Failed to load records:", err)
    } finally {
      setRecordLoading(false)
    }
  }

  // 数据分析：加载
  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch("/api/admin/analytics", { credentials: "include" })
      const data = await res.json()
      if (res.ok) setAnalyticsData(data as AnalyticsData)
    } catch (err) {
      console.error("Failed to load analytics:", err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadOverview(controller.signal)
    // 组件卸载时取消飞行中的请求，防止在已卸载组件上 setState
    return () => controller.abort()
  }, [])

  // Tab 切换时懒加载对应数据
  useEffect(() => {
    if (!authorized) return
    if (activeTab === "questions") void loadQuestions()
    if (activeTab === "records") void loadRecords(1)
    if (activeTab === "analytics") void loadAnalytics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authorized])

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
              {level === "all" ? text.stats.allLevels
                : level === "error" ? text.stats.levelError
                : level === "warn" ? text.stats.levelWarn
                : level === "info" ? text.stats.levelInfo
                : text.stats.levelDebug}
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
        icon: Key,
        label: text.security.apiKey,
        desc: text.security.apiKeyDesc,
        envKey: isZh ? "管理面板 → AI 配置" : "Admin Panel → AI Config",
        value: overview?.ai.apiKeySet,
        valueDisplay: overview?.ai.apiKeyMasked || "—",
        statusColor: overview?.ai.apiKeySet
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700",
        mono: true,
      },
      {
        icon: Shield,
        label: text.security.adminCreds,
        desc: text.security.adminCredsDesc,
        envKey: "ADMIN_USERNAME / ADMIN_PASSWORD",
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

  // ──────────────────────────────────────────────
  // 渲染：题目管理
  // ──────────────────────────────────────────────
  const DIMENSIONS = ["EI", "SN", "TF", "JP"]
  const AGREE_OPTIONS: Record<string, string[]> = { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] }
  const LOCALES = ["zh", "en", "ja"]
  const DIM_COLORS: Record<string, string> = {
    EI: "bg-sky-100 text-sky-700",
    SN: "bg-emerald-100 text-emerald-700",
    TF: "bg-violet-100 text-violet-700",
    JP: "bg-amber-100 text-amber-700",
  }

  const filteredQuestions = useMemo(() => {
    if (!qSearch.trim()) return questionList
    const kw = qSearch.toLowerCase()
    return questionList.filter((q) => q.text.toLowerCase().includes(kw) || q.id.toLowerCase().includes(kw))
  }, [questionList, qSearch])

  const renderQuestions = () => (
    <div className="space-y-5">
      {/* 工具栏 */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm space-y-4">
        {/* 语言 Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-zinc-100 rounded-lg p-1 gap-1">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => { setQLocaleFilter(loc); setQSearch("") }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  qLocaleFilter === loc ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {loc === "zh" ? "中文" : loc === "en" ? "English" : "日本語"}
              </button>
            ))}
          </div>
          {/* 维度筛选 */}
          <select
            value={qDimFilter}
            onChange={(e) => setQDimFilter(e.target.value)}
            className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
          >
            <option value="">{isZh ? "全部维度" : "All Dimensions"}</option>
            {DIMENSIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {/* 搜索 */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder={isZh ? "搜索题目文本..." : "Search questions..."}
              className="w-full h-9 pl-9 pr-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => { setEditingQ(null); setQForm({ text: "", dimension: "EI", agree: "E", locale: qLocaleFilter, contexts: "" }); setQModalOpen(true) }}
              className="h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />{isZh ? "新增" : "Add"}
            </button>
            <button
              onClick={importBuiltin}
              disabled={qImporting}
              className="h-9 px-4 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />{qImporting ? (isZh ? "导入中..." : "Importing...") : (isZh ? "从内置导入" : "Import Builtin")}
            </button>
            <button
              onClick={exportQuestions}
              disabled={questionList.length === 0}
              className="h-9 px-4 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />{isZh ? "导出" : "Export"}
            </button>
            <button
              onClick={loadQuestions}
              className="h-9 px-3 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 inline-flex items-center"
            >
              <RefreshCw className={`w-4 h-4 ${qLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {qMessage && (
          <div className={`text-sm px-3 py-2 rounded-lg ${qMessage.includes("失败") || qMessage.includes("failed") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
            {qMessage}
          </div>
        )}
      </div>

      {/* 题目表格 */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500">
            {isZh ? `共 ${filteredQuestions.length} 题` : `${filteredQuestions.length} questions`}
          </span>
        </div>
        {qLoading ? (
          <div className="py-20 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-zinc-300" /></div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 text-sm">
            {isZh ? "暂无题目，点击「从内置导入」初始化" : "No questions. Click 'Import Builtin' to initialize."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="text-left py-3 px-4 font-medium text-zinc-500 w-16">#</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{isZh ? "题目文本" : "Text"}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500 w-20">{isZh ? "维度" : "Dim"}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500 w-16">{isZh ? "倾向" : "Agree"}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500 w-24">{isZh ? "操作" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredQuestions.map((q, i) => (
                  <tr key={q.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="truncate text-zinc-700">{q.text}</div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">{q.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${DIM_COLORS[q.dimension] || "bg-zinc-100 text-zinc-600"}`}>
                        {q.dimension}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs font-mono font-semibold">
                        {q.agree}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingQ(q)
                            setQForm({
                              text: q.text,
                              dimension: q.dimension,
                              agree: q.agree,
                              locale: q.locale,
                              contexts: (q.contexts || []).join(", "),
                            })
                            setQModalOpen(true)
                          }}
                          className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-medium"
                        >
                          {isZh ? "编辑" : "Edit"}
                        </button>
                        <button
                          onClick={() => void deleteQuestion(q.id)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-medium"
                        >
                          {isZh ? "删除" : "Del"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 编辑弹层 */}
      {qModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingQ ? (isZh ? "编辑题目" : "Edit Question") : (isZh ? "新增题目" : "Add Question")}
              </h3>
              <button onClick={() => { setQModalOpen(false); setQMessage("") }} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "题目文本" : "Question Text"}</label>
                <textarea
                  value={qForm.text}
                  onChange={(e) => setQForm((p) => ({ ...p, text: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "维度" : "Dimension"}</label>
                  <select
                    value={qForm.dimension}
                    onChange={(e) => {
                      const dim = e.target.value
                      setQForm((p) => ({ ...p, dimension: dim, agree: AGREE_OPTIONS[dim]?.[0] || p.agree }))
                    }}
                    className="w-full h-9 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  >
                    {DIMENSIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "倾向" : "Agree"}</label>
                  <select
                    value={qForm.agree}
                    onChange={(e) => setQForm((p) => ({ ...p, agree: e.target.value }))}
                    className="w-full h-9 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  >
                    {(AGREE_OPTIONS[qForm.dimension] || []).map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "语言" : "Locale"}</label>
                  <select
                    value={qForm.locale}
                    onChange={(e) => setQForm((p) => ({ ...p, locale: e.target.value }))}
                    className="w-full h-9 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  >
                    {LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "场景标签（逗号分隔）" : "Contexts (comma separated)"}</label>
                <input
                  value={qForm.contexts}
                  onChange={(e) => setQForm((p) => ({ ...p, contexts: e.target.value }))}
                  placeholder="social, work, personal"
                  className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                />
              </div>
            </div>
            {qMessage && (
              <div className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">{qMessage}</div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => void saveQuestion()}
                disabled={qSaving || !qForm.text.trim()}
                className="flex-1 h-10 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50"
              >
                {qSaving ? (isZh ? "保存中..." : "Saving...") : (isZh ? "保存" : "Save")}
              </button>
              <button
                onClick={() => { setQModalOpen(false); setQMessage("") }}
                className="h-10 px-5 bg-zinc-100 text-zinc-600 text-sm font-medium rounded-lg hover:bg-zinc-200"
              >
                {isZh ? "取消" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ──────────────────────────────────────────────
  // 渲染：测试记录
  // ──────────────────────────────────────────────
  const MBTI_TYPES = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"]
  const TYPE_GROUP_COLORS: Record<string, string> = {
    NT: "bg-indigo-100 text-indigo-700",
    NF: "bg-emerald-100 text-emerald-700",
    ST: "bg-amber-100 text-amber-700",
    SF: "bg-rose-100 text-rose-700",
  }
  function getMbtiColor(type: string): string {
    const key = type[1] + type[2]
    return TYPE_GROUP_COLORS[key] || "bg-zinc-100 text-zinc-600"
  }

  const renderRecords = () => (
    <div className="space-y-5">
      {/* 筛选栏 */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{isZh ? "开始日期" : "From"}</label>
            <input type="date" value={recordFrom} onChange={(e) => setRecordFrom(e.target.value)}
              className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{isZh ? "结束日期" : "To"}</label>
            <input type="date" value={recordTo} onChange={(e) => setRecordTo(e.target.value)}
              className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{isZh ? "MBTI 类型" : "Type"}</label>
            <select value={recordTypeFilter} onChange={(e) => setRecordTypeFilter(e.target.value)}
              className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm">
              <option value="">{isZh ? "全部" : "All"}</option>
              {MBTI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{isZh ? "语言" : "Locale"}</label>
            <select value={recordLocaleFilter} onChange={(e) => setRecordLocaleFilter(e.target.value)}
              className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm">
              <option value="">{isZh ? "全部" : "All"}</option>
              <option value="zh">zh</option>
              <option value="en">en</option>
              <option value="ja">ja</option>
            </select>
          </div>
          <button
            onClick={() => void loadRecords(1)}
            className="h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4" />{isZh ? "查询" : "Search"}
          </button>
          <button
            onClick={() => { setRecordTypeFilter(""); setRecordLocaleFilter(""); setRecordFrom(""); setRecordTo(""); }}
            className="h-9 px-4 bg-zinc-100 text-zinc-600 text-sm font-medium rounded-lg hover:bg-zinc-200"
          >
            {isZh ? "重置" : "Reset"}
          </button>
        </div>
      </div>

      {/* 记录表格 */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            {isZh ? `共 ${recordTotal} 条记录` : `${recordTotal} records total`}
          </span>
          <button onClick={() => void loadRecords(recordPage)} className="text-zinc-400 hover:text-zinc-700">
            <RefreshCw className={`w-4 h-4 ${recordLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {recordLoading ? (
          <div className="py-20 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-zinc-300" /></div>
        ) : recordList.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 text-sm">
            {isZh ? "暂无测试记录" : "No records yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{isZh ? "时间" : "Time"}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{isZh ? "类型" : "Type"}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">EI%</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">SN%</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">TF%</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">JP%</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{isZh ? "年龄段" : "Age"}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{isZh ? "性别" : "Gender"}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{isZh ? "语言" : "Locale"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {recordList.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 text-zinc-400 text-xs whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMbtiColor(r.mbtiType)}`}>
                        {r.mbtiType}
                      </span>
                    </td>
                    {(["EI","SN","TF","JP"] as const).map((dim) => (
                      <td key={dim} className="py-3 px-4 text-xs text-zinc-600 whitespace-nowrap">
                        <span className="font-mono">{r.scores[dim].winner}</span>
                        <span className="text-zinc-400 ml-1">{r.scores[dim].percent}%</span>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-xs text-zinc-500">{r.ageGroup || "—"}</td>
                    <td className="py-3 px-4 text-xs text-zinc-500">{r.gender || "—"}</td>
                    <td className="py-3 px-4 text-xs text-zinc-400">{r.locale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* 分页 */}
        {recordTotalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between">
            <button
              onClick={() => void loadRecords(recordPage - 1)}
              disabled={recordPage <= 1 || recordLoading}
              className="h-8 px-3 bg-zinc-100 text-zinc-600 text-xs rounded-lg hover:bg-zinc-200 disabled:opacity-40 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />{isZh ? "上页" : "Prev"}
            </button>
            <span className="text-sm text-zinc-500">
              {recordPage} / {recordTotalPages}
            </span>
            <button
              onClick={() => void loadRecords(recordPage + 1)}
              disabled={recordPage >= recordTotalPages || recordLoading}
              className="h-8 px-3 bg-zinc-100 text-zinc-600 text-xs rounded-lg hover:bg-zinc-200 disabled:opacity-40 inline-flex items-center gap-1"
            >
              {isZh ? "下页" : "Next"}<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ──────────────────────────────────────────────
  // 渲染：数据分析
  // ──────────────────────────────────────────────
  const ANALYSIS_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16",
    "#f97316","#14b8a6","#a855f7","#eab308","#22c55e","#3b82f6","#f43f5e","#64748b"]

  const renderAnalytics = () => {
    if (analyticsLoading) {
      return (
        <div className="py-32 flex justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-zinc-300" />
        </div>
      )
    }

    if (!analyticsData || analyticsData.total === 0) {
      return (
        <div className="py-32 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PieChartIcon className="w-8 h-8 text-zinc-300" />
          </div>
          <div className="text-zinc-400 text-sm">{isZh ? "暂无分析数据，完成测试后自动采集" : "No data yet. Records will be collected after tests are completed."}</div>
          <button onClick={loadAnalytics} className="mt-4 h-9 px-4 bg-zinc-100 text-zinc-600 text-sm rounded-lg hover:bg-zinc-200 inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />{isZh ? "刷新" : "Refresh"}
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* 顶部汇总 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
            <div className="text-xs text-zinc-400 mb-1">{isZh ? "总记录数" : "Total Records"}</div>
            <div className="text-3xl font-bold">{formatNumber(analyticsData.total)}</div>
          </div>
          {analyticsData.typeDistribution.slice(0, 3).map((t, i) => (
            <div key={t.type} className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
              <div className="text-xs text-zinc-400 mb-1">#{i + 1} {isZh ? "最多类型" : "Top Type"}</div>
              <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mb-2 ${getMbtiColor(t.type)}`}>{t.type}</div>
              <div className="text-2xl font-bold">{t.count}</div>
              <div className="text-xs text-zinc-400">{analyticsData.total > 0 ? `${((t.count / analyticsData.total) * 100).toFixed(1)}%` : "—"}</div>
            </div>
          ))}
        </div>

        {/* 类型分布图 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-5">{isZh ? "MBTI 类型分布" : "MBTI Type Distribution"}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.typeDistribution} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 12, fontWeight: 600 }} width={48} />
                <Tooltip />
                <Bar dataKey="count" name={isZh ? "人数" : "Count"} radius={[0, 4, 4, 0]}>
                  {analyticsData.typeDistribution.map((_, i) => (
                    <Cell key={i} fill={ANALYSIS_COLORS[i % ANALYSIS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 维度偏向 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-5">{isZh ? "群体维度偏向" : "Population Dimension Bias"}</h3>
          <div className="space-y-5">
            {analyticsData.dimensionAverages.map((d) => (
              <div key={d.dimension} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-zinc-700">{d.dimension}</span>
                  <span className="text-xs text-zinc-400">
                    {d.firstLetter} {d.firstPercent}% — {d.secondLetter} {100 - d.firstPercent}%
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-indigo-400 transition-all duration-700 rounded-l-full" style={{ width: `${d.firstPercent}%` }} />
                  <div className="h-full bg-emerald-400 transition-all duration-700 flex-1" />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>{d.firstLetter}</span>
                  <span>{d.secondLetter}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 人口画像：年龄段 + 性别饼图 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
            <h3 className="text-base font-semibold mb-4">{isZh ? "年龄段分布" : "Age Group Distribution"}</h3>
            {analyticsData.ageGroupDistribution.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.ageGroupDistribution} dataKey="count" nameKey="ageGroup"
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {analyticsData.ageGroupDistribution.map((_, i) => (
                          <Cell key={i} fill={ANALYSIS_COLORS[i % ANALYSIS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => v} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {analyticsData.ageGroupDistribution.map((item, i) => (
                    <div key={item.ageGroup} className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ANALYSIS_COLORS[i % ANALYSIS_COLORS.length] }} />
                      {item.ageGroup}: {item.count}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-zinc-300 text-sm">{isZh ? "暂无数据" : "No data"}</div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
            <h3 className="text-base font-semibold mb-4">{isZh ? "性别分布" : "Gender Distribution"}</h3>
            {analyticsData.genderDistribution.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.genderDistribution} dataKey="count" nameKey="gender"
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {analyticsData.genderDistribution.map((_, i) => (
                          <Cell key={i} fill={["#6366f1","#ec4899","#64748b"][i % 3]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2 justify-center">
                  {analyticsData.genderDistribution.map((item, i) => (
                    <div key={item.gender} className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#6366f1","#ec4899","#64748b"][i % 3] }} />
                      {item.gender}: {item.count}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-zinc-300 text-sm">{isZh ? "暂无数据" : "No data"}</div>
            )}
          </div>
        </div>

        {/* 每日趋势 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">{isZh ? "每日测试趋势（近 30 天）" : "Daily Test Trend (Last 30 Days)"}</h3>
            <button onClick={loadAnalytics} className="text-zinc-400 hover:text-zinc-700">
              <RefreshCw className={`w-4 h-4 ${analyticsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart data={analyticsData.dailyTrend}>
                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2}
                  fillOpacity={1} fill="url(#analyticsGrad)" name={isZh ? "测试次数" : "Tests"} />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview()
      case "stats": return renderStats()
      case "providers": return renderProviders()
      case "security": return renderSecurity()
      case "questions": return renderQuestions()
      case "records": return renderRecords()
      case "analytics": return renderAnalytics()
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

          {/* 导航菜单（分组） */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-4">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
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
                          {isActive && (
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full ${item.accent}`} />
                          )}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isActive ? item.accentBg : "bg-white/[0.04] group-hover:bg-white/[0.07]"
                          }`}>
                            <item.icon className={`w-4 h-4 ${isActive ? item.accentText : "text-zinc-500 group-hover:text-zinc-300"}`} />
                          </div>
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
                </div>
              ))}
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
