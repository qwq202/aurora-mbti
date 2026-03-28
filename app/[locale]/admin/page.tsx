"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/routing"
import { RefreshCw, ChevronRight, LogOut, X } from "lucide-react"

import { OverviewTab } from "@/components/admin/tabs/overview-tab"
import { StatsTab } from "@/components/admin/tabs/stats-tab"
import { ProvidersTab } from "@/components/admin/tabs/providers-tab"
import { QuestionsTab } from "@/components/admin/tabs/questions-tab"
import { RecordsTab } from "@/components/admin/tabs/records-tab"
import { AnalyticsTab } from "@/components/admin/tabs/analytics-tab"
import { SystemTab } from "@/components/admin/tabs/system-tab"
import { TestModesTab } from "@/components/admin/tabs/test-modes-tab"
import { getNavGroups } from "@/components/admin/shared/nav-config"
import type { TabType, LogLevel, OverviewData, StatsData, LogEntry, ProviderConfig, StoredQuestion, AnonymousResult, AnalyticsData, TestModeConfig, TestModeSettings } from "@/components/admin/shared/types"
import { formatUptime, readErrorMessage } from "@/components/admin/shared/utils"
import { ToastProvider, useToast } from "@/components/admin/shared/toast"

type SystemSettings = {
  siteName: string
  defaultLanguage: 'zh' | 'en' | 'ja'
  theme: 'light' | 'dark' | 'system'
  allowAnonymousTest: boolean
  updatedAt?: string
}

function AdminPageContent() {
  const router = useRouter()
  const locale = useLocale()
  const isZh = locale.startsWith("zh")

  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState("")
  const [providerToTest, setProviderToTest] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState("")
  const [logsLoading, setLogsLoading] = useState(false)
  const [switchingProvider, setSwitchingProvider] = useState("")
  const [logLevelFilter, setLogLevelFilter] = useState<LogLevel>("all")
  const [logFrom, setLogFrom] = useState("")
  const [logTo, setLogTo] = useState("")
  const [logSearch, setLogSearch] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(false)

  // 版本检查状态
  const [versionInfo, setVersionInfo] = useState<{
    current: string
    latest: string | null
    hasUpdate: boolean
    releaseUrl: string | null
  } | null>(null)
  const [versionChecking, setVersionChecking] = useState(false)
  const [versionBannerDismissed, setVersionBannerDismissed] = useState(false)

  // AI渠道管理状态
  const [providerConfigs, setProviderConfigs] = useState<Record<string, { baseUrl: string; model: string; apiKey: string }>>({})
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [providerModalOpen, setProviderModalOpen] = useState(false)
  const [savingProvider, setSavingProvider] = useState<string | null>(null)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; duration?: string; error?: string }>>({})
  const [providerMessages, setProviderMessages] = useState<Record<string, string>>({})
  const [providerSearch, setProviderSearch] = useState("")
  const [failoverProviders, setFailoverProviders] = useState<string[]>([])
  const [failoverSaving, setFailoverSaving] = useState(false)

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

  // 测试记录状态
  const [recordList, setRecordList] = useState<AnonymousResult[]>([])
  const [recordTotal, setRecordTotal] = useState(0)
  const [recordPage, setRecordPage] = useState(1)
  const [recordTotalPages, setRecordTotalPages] = useState(1)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordExportLoading, setRecordExportLoading] = useState(false)
  const [recordTypeFilter, setRecordTypeFilter] = useState("")
  const [recordLocaleFilter, setRecordLocaleFilter] = useState("")
  const [recordFrom, setRecordFrom] = useState("")
  const [recordTo, setRecordTo] = useState("")

  // 数据分析状态
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // 系统管理状态
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Aurora MBTI',
    defaultLanguage: 'zh',
    theme: 'system',
    allowAnonymousTest: true,
  })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)

  // 测试模式管理状态
  const [testModesSettings, setTestModesSettings] = useState<TestModeSettings>({
    modes: [
      { id: 'standard', enabled: true, title: { zh: '标准模式', en: 'Standard Mode', ja: 'スタンダード' }, description: { zh: '使用预设题库，题目固定不变，适合快速测试', en: 'Use built-in questions, fixed set, great for quick testing', ja: '内蔵問題を使用、固定セット、手軽なテストに' }, questionCount: 60, estimatedTime: { zh: '约 10 分钟', en: '~10 min', ja: '約10分' }, icon: 'book', isAI: false },
      { id: 'ai30', enabled: true, title: { zh: 'AI 轻量版', en: 'AI Lite', ja: 'AIライト' }, description: { zh: 'AI 根据你的档案生成个性化题目，探索更深入', en: 'AI generates personalized questions based on your profile', ja: 'AIがプロフィールに基づいてカスタマイズ' }, questionCount: 30, estimatedTime: { zh: '约 5 分钟', en: '~5 min', ja: '約5分' }, icon: 'zap', isAI: true },
      { id: 'ai60', enabled: true, title: { zh: 'AI 标准版', en: 'AI Standard', ja: 'AIスタンダード' }, description: { zh: 'AI 根据你的档案生成 60 道个性化题目，平衡体验', en: 'AI generates 60 personalized questions for a balanced experience', ja: 'AIが60問のカスタマイズ問題を生成' }, questionCount: 60, estimatedTime: { zh: '约 10 分钟', en: '~10 min', ja: '約10分' }, icon: 'brain', isAI: true },
      { id: 'ai120', enabled: true, title: { zh: 'AI 深度版', en: 'AI Deep', ja: 'AIディープ' }, description: { zh: 'AI 根据你的档案生成 120 道深度题目，全面探索', en: 'AI generates 120 deep questions for comprehensive analysis', ja: 'AIが120問の詳細な問題を生成' }, questionCount: 120, estimatedTime: { zh: '约 20 分钟', en: '~20 min', ja: '約20分' }, icon: 'sparkles', isAI: true },
    ],
    defaultMode: 'ai60',
    allowCustomCount: false,
    customCountMin: 10,
    customCountMax: 200,
  })
  const [testModesLoading, setTestModesLoading] = useState(false)
  const [modeModalOpen, setModeModalOpen] = useState(false)
  const [editingModeData, setEditingModeData] = useState<TestModeConfig | null>(null)

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

  const toast = useToast()

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
        from: isZh ? "开始日期" : "From",
        to: isZh ? "结束日期" : "To",
        filter: isZh ? "筛选" : "Filter",
        reset: isZh ? "重置" : "Reset",
      },
      overview: {
        runtime: isZh ? "运行状态" : "Runtime",
        uptime: isZh ? "运行时间" : "Uptime",
        model: isZh ? "模型" : "Model",
        memory: isZh ? "内存" : "Memory",
        heapTotal: isZh ? "堆总量" : "Heap Total",
        rss: isZh ? "物理内存" : "RSS",
        external: isZh ? "外部" : "External",
        baseUrl: isZh ? "地址" : "URL",
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

    }),
    [isZh]
  )

  const navGroups = useMemo(() => getNavGroups(isZh, text.tabs), [isZh, text.tabs])
  const navItems = navGroups.flatMap((g) => g.items)

  const loadStats = async (signal?: AbortSignal) => {
    try {
      const statsRes = await fetch("/api/admin/stats?days=7", { credentials: "include", signal })
      const statsData = await statsRes.json()
      if (statsRes.ok) setStats(statsData.stats)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Failed to load stats:", err)
    }
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams({ limit: "200" })
      if (logFrom) params.set("from", logFrom)
      if (logTo) params.set("to", logTo)
      const res = await fetch(`/api/admin/logs?${params.toString()}`, { credentials: "include" })
      const data = await res.json()
      if (res.ok) setLogs(data.logs)
    } catch (err) {
      console.error("Failed to load logs:", err)
    } finally {
      setLogsLoading(false)
    }
  }

  const loadOverview = async (signal?: AbortSignal) => {
    setLoading(true)
    setError("")
    try {
      const [overviewRes, aiConfigRes] = await Promise.all([
        fetch("/api/admin/overview", { credentials: "include", signal }),
        fetch("/api/admin/ai-config", { credentials: "include", signal })
      ])
      const overviewData = await overviewRes.json()
      const aiConfigData = await aiConfigRes.json()
      
      if (!overviewRes.ok) {
        setAuthorized(false)
        setOverview(null)
        setError(readErrorMessage(overviewData, text.loadFailed))
        setAuthChecked(true)
        router.replace(`/${locale}/login`)
        return
      }
      setAuthorized(true)
      setAuthChecked(true)
      
      const mergedOverview: OverviewData = {
        ...overviewData.overview,
        ai: aiConfigData.activeProvider ? {
          activeProvider: aiConfigData.activeProvider,
          failoverProviders: aiConfigData.failoverProviders || [],
          activeConfig: aiConfigData.activeConfig || { baseUrl: "", model: "", hasKey: false }
        } : overviewData.overview?.ai,
        providers: aiConfigData.providers || {},
        specs: aiConfigData.specs || []
      }
      setOverview(mergedOverview)
      
      if (aiConfigData.providers) {
        const configs: Record<string, { baseUrl: string; model: string; apiKey: string }> = {}
        for (const [id, config] of Object.entries(aiConfigData.providers as Record<string, ProviderConfig>)) {
          configs[id] = {
            baseUrl: config.baseUrl || "",
            model: config.model || "",
            apiKey: ""
          }
        }
        setProviderConfigs(configs)
      }
      
      // 设置 failover 渠道列表
      setFailoverProviders(aiConfigData.failoverProviders || [])
      
      setProviderToTest((prev) => prev || aiConfigData.activeProvider || "openai")
      setLogsLoading(true)
      void loadStats(signal)
      void loadLogs()
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(text.loadFailed)
      setAuthChecked(true)
      router.replace(`/${locale}/login`)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs", { method: "DELETE", credentials: "include" })
      if (res.ok) {
        setLogs([])
        toast(isZh ? "日志已清空" : "Logs cleared", "success")
      } else {
        toast(isZh ? "清空失败" : "Clear failed", "error")
      }
    } catch (err) {
      console.error("Failed to clear logs:", err)
      toast(isZh ? "清空失败" : "Clear failed", "error")
    }
  }

  const checkVersion = async (force = false) => {
    setVersionChecking(true)
    try {
      const url = force ? "/api/admin/version?force=true" : "/api/admin/version"
      const res = await fetch(url, { credentials: "include" })
      const data = await res.json()
      console.log('Version check result:', data)
      if (res.ok) {
        setVersionInfo({
          current: data.current,
          latest: data.latest,
          hasUpdate: data.hasUpdate,
          releaseUrl: data.releaseUrl,
        })
      }
    } catch (err) {
      console.error("Failed to check version:", err)
    } finally {
      setVersionChecking(false)
    }
  }

  const loadQuestions = async () => {
    setQLoading(true)
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

  const saveQuestion = async () => {
    setQSaving(true)
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
        toast(isZh ? "已保存" : "Saved", "success")
        await loadQuestions()
      } else {
        const data = await res.json()
        toast(readErrorMessage(data, isZh ? "保存失败" : "Save failed"), "error")
      }
    } finally {
      setQSaving(false)
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm(isZh ? "确认删除该题目？" : "Delete this question?")) return
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        toast(isZh ? "已删除" : "Deleted", "success")
        await loadQuestions()
      } else {
        const data = await res.json()
        toast(readErrorMessage(data, isZh ? "删除失败" : "Delete failed"), "error")
      }
    } catch {
      toast(isZh ? "删除失败" : "Delete failed", "error")
    }
  }

  const importBuiltin = async () => {
    setQImporting(true)
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fromBuiltin: true, locale: qLocaleFilter }),
      })
      const data = await res.json()
      if (res.ok) {
        toast(isZh ? `已导入 ${data.imported} 题` : `Imported ${data.imported} questions`, "success")
        await loadQuestions()
      } else {
        toast(readErrorMessage(data, isZh ? "导入失败" : "Import failed"), "error")
      }
    } finally {
      setQImporting(false)
    }
  }

  const exportQuestions = () => {
    const blob = new Blob([JSON.stringify(questionList, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `questions-${qLocaleFilter}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast(isZh ? "已导出" : "Exported", "success")
  }

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

  const exportRecords = async (format: 'json' | 'csv') => {
    setRecordExportLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '10000' })
      if (recordTypeFilter) params.set("type", recordTypeFilter)
      if (recordLocaleFilter) params.set("locale", recordLocaleFilter)
      if (recordFrom) params.set("from", recordFrom)
      if (recordTo) params.set("to", recordTo)
      const res = await fetch(`/api/admin/results?${params.toString()}`, { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Export failed')
      
      const records = data.results as AnonymousResult[]
      const timestamp = new Date().toISOString().slice(0, 10)
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mbti-records-${timestamp}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const headers = ['id', 'timestamp', 'mbtiType', 'locale', 'EI_winner', 'EI_percent', 'SN_winner', 'SN_percent', 'TF_winner', 'TF_percent', 'JP_winner', 'JP_percent', 'ageGroup', 'gender']
        const rows = records.map(r => [
          r.id,
          r.timestamp,
          r.mbtiType,
          r.locale,
          r.scores.EI.winner,
          r.scores.EI.percent,
          r.scores.SN.winner,
          r.scores.SN.percent,
          r.scores.TF.winner,
          r.scores.TF.percent,
          r.scores.JP.winner,
          r.scores.JP.percent,
          r.ageGroup || '',
          r.gender || ''
        ])
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mbti-records-${timestamp}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Failed to export records:", err)
    } finally {
      setRecordExportLoading(false)
    }
  }

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

  const loadSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch("/api/admin/settings", { credentials: "include" })
      const data = await res.json()
      if (res.ok && data.settings) {
        setSettings(data.settings)
        if (data.settings.testModes && data.settings.testModes.modes && data.settings.testModes.modes.length > 0) {
          setTestModesSettings(data.settings.testModes)
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err)
    } finally {
      setSettingsLoading(false)
    }
  }
  
  const loadTestModesDefaults = () => {
    const defaults: TestModeConfig[] = [
      { id: 'standard', enabled: true, title: { zh: '标准模式', en: 'Standard Mode', ja: 'スタンダード' }, description: { zh: '使用预设题库，题目固定不变，适合快速测试', en: 'Use built-in questions, fixed set, great for quick testing', ja: '内蔵問題を使用、固定セット、手軽なテストに' }, questionCount: 60, estimatedTime: { zh: '约 10 分钟', en: '~10 min', ja: '約10分' }, icon: 'book', isAI: false },
      { id: 'ai30', enabled: true, title: { zh: 'AI 轻量版', en: 'AI Lite', ja: 'AIライト' }, description: { zh: 'AI 根据你的档案生成个性化题目，探索更深入', en: 'AI generates personalized questions based on your profile', ja: 'AIがプロフィールに基づいてカスタマイズ' }, questionCount: 30, estimatedTime: { zh: '约 5 分钟', en: '~5 min', ja: '約5分' }, icon: 'zap', isAI: true },
      { id: 'ai60', enabled: true, title: { zh: 'AI 标准版', en: 'AI Standard', ja: 'AIスタンダード' }, description: { zh: 'AI 根据你的档案生成 60 道个性化题目，平衡体验', en: 'AI generates 60 personalized questions for a balanced experience', ja: 'AIが60問のカスタマイズ問題を生成' }, questionCount: 60, estimatedTime: { zh: '约 10 分钟', en: '~10 min', ja: '約10分' }, icon: 'brain', isAI: true },
      { id: 'ai120', enabled: true, title: { zh: 'AI 深度版', en: 'AI Deep', ja: 'AIディープ' }, description: { zh: 'AI 根据你的档案生成 120 道深度题目，全面探索', en: 'AI generates 120 deep questions for comprehensive analysis', ja: 'AIが120問の詳細な問題を生成' }, questionCount: 120, estimatedTime: { zh: '约 20 分钟', en: '~20 min', ja: '約20分' }, icon: 'sparkles', isAI: true },
    ]
    setTestModesSettings(prev => ({
      ...prev,
      modes: defaults,
      defaultMode: 'ai60',
    }))
    toast(isZh ? "已恢复默认配置" : "Defaults restored", "success")
  }
  
  const saveTestModesSettings = async () => {
    setTestModesLoading(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings: { testModes: testModesSettings } }),
      })
      if (res.ok) {
        toast(isZh ? "测试模式配置已保存" : "Test modes settings saved", "success")
      } else {
        toast(isZh ? "保存失败" : "Save failed", "error")
      }
    } catch {
      toast(isZh ? "保存失败" : "Save failed", "error")
    } finally {
      setTestModesLoading(false)
    }
  }

  const saveSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        toast(isZh ? "设置已保存" : "Settings saved", "success")
      } else {
        toast(isZh ? "保存失败" : "Save failed", "error")
      }
    } catch {
      toast(isZh ? "保存失败" : "Save failed", "error")
    } finally {
      setSettingsLoading(false)
    }
  }

  const exportBackup = async () => {
    setBackupLoading(true)
    try {
      const res = await fetch("/api/admin/backup", { credentials: "include" })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `aurora-backup-${new Date().toISOString().split("T")[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast(isZh ? "导出成功" : "Export successful", "success")
      } else {
        toast(isZh ? "导出失败" : "Export failed", "error")
      }
    } catch {
      toast(isZh ? "导出失败" : "Export failed", "error")
    } finally {
      setBackupLoading(false)
    }
  }

  const importBackup = async (file: File) => {
    setBackupLoading(true)
    try {
      const fileText = await file.text()
      const data = JSON.parse(fileText)
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast(isZh ? "导入成功，正在刷新..." : "Import successful, refreshing...", "success")
        setTimeout(() => {
          void loadOverview()
          void loadQuestions()
          void loadRecords(1)
        }, 1000)
      } else {
        const errData = await res.json()
        toast(readErrorMessage(errData, isZh ? "导入失败" : "Import failed"), "error")
      }
    } catch {
      toast(isZh ? "导入失败：无效的备份文件" : "Import failed: Invalid backup file", "error")
    } finally {
      setBackupLoading(false)
    }
  }

  useEffect(() => {
    if (!authorized || !autoRefresh) return
    const interval = setInterval(() => {
      if (activeTab === "overview" || activeTab === "stats") {
        void loadStats()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [authorized, autoRefresh, activeTab])

  useEffect(() => {
    const controller = new AbortController()
    void loadOverview(controller.signal)
    void checkVersion()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!authorized) return
    if (activeTab === "questions") void loadQuestions()
    if (activeTab === "records") void loadRecords(1)
    if (activeTab === "analytics") void loadAnalytics()
    if (activeTab === "system" || activeTab === "testModes") void loadSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authorized])

  useEffect(() => {
    if (!authorized || activeTab !== "questions") return
    void loadQuestions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocaleFilter, qDimFilter])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
    setAuthorized(false)
    setAuthChecked(true)
    setOverview(null)
    setTestResult("")
    setStats(null)
    setLogs([])
    router.replace(`/${locale}/login`)
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

  const handleSaveProviderConfig = async (providerId: string) => {
    const config = providerConfigs[providerId]
    if (!config) return
    
    setSavingProvider(providerId)
    setProviderMessages((prev) => ({ ...prev, [providerId]: "" }))
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "save",
          provider: providerId,
          config: {
            baseUrl: config.baseUrl,
            model: config.model,
            apiKey: config.apiKey || undefined,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setProviderMessages((prev) => ({ ...prev, [providerId]: readErrorMessage(data, isZh ? "保存失败" : "Save failed") }))
        return
      }
      setProviderMessages((prev) => ({ ...prev, [providerId]: text.configSaved }))
      setTimeout(() => setProviderMessages((prev) => ({ ...prev, [providerId]: "" })), 3000)
      setProviderConfigs((prev) => ({ ...prev, [providerId]: { ...prev[providerId], apiKey: "" } }))
      await loadOverview()
    } catch {
      setProviderMessages((prev) => ({ ...prev, [providerId]: isZh ? "保存失败" : "Save failed" }))
    } finally {
      setSavingProvider(null)
    }
  }

  const handleActivateProvider = async (providerId: string) => {
    setSwitchingProvider(providerId)
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "activate", provider: providerId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast(text.switchSuccess, "success")
        await loadOverview()
      } else {
        toast(readErrorMessage(data, isZh ? "切换失败" : "Switch failed"), "error")
      }
    } catch {
      toast(isZh ? "切换失败" : "Switch failed", "error")
    } finally {
      setSwitchingProvider("")
    }
  }

  const handleTestProvider = async (providerId: string) => {
    const config = providerConfigs[providerId]
    if (!config) return
    
    setTestingProvider(providerId)
    const startTime = Date.now()
    try {
      const res = await fetch("/api/admin/provider-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          config: {
            provider: providerId,
            baseUrl: config.baseUrl || undefined,
            model: config.model || undefined,
            apiKey: config.apiKey || undefined,
          },
        }),
      })
      const duration = Date.now() - startTime
      const data = await res.json()
      if (!res.ok) {
        setTestResults((prev) => ({
          ...prev, [providerId]: { success: false, duration: `${duration}ms`, error: readErrorMessage(data, "Unknown error") },
        }))
      } else {
        setTestResults((prev) => ({
          ...prev,
          [providerId]: { success: true, duration: `${duration}ms` },
        }))
      }
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { success: false, error: isZh ? "网络错误" : "Network error" },
      }))
    } finally {
      setTestingProvider(null)
    }
  }

  // Failover 渠道管理函数
  const handleAddFailoverProvider = (providerId: string) => {
    setFailoverProviders((prev) => {
      if (prev.includes(providerId)) return prev
      return [...prev, providerId]
    })
  }

  const handleRemoveFailoverProvider = (providerId: string) => {
    setFailoverProviders((prev) => prev.filter((id) => id !== providerId))
  }

  const handleMoveFailoverProvider = (providerId: string, direction: 'up' | 'down') => {
    setFailoverProviders((prev) => {
      const index = prev.indexOf(providerId)
      if (index === -1) return prev
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev
      const newList = [...prev]
      newList.splice(index, 1)
      newList.splice(newIndex, 0, providerId)
      return newList
    })
  }

  const handleSaveFailoverProviders = async () => {
    setFailoverSaving(true)
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "setFailover",
          failoverProviders: failoverProviders,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast(isZh ? "Failover 配置已保存" : "Failover settings saved", "success")
      } else {
        toast(readErrorMessage(data, isZh ? "保存失败" : "Save failed"), "error")
      }
    } catch {
      toast(isZh ? "保存失败" : "Save failed", "error")
    } finally {
      setFailoverSaving(false)
    }
  }

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

  const logLevelCounts = useMemo(() => ({
    all: logs.length,
    error: logs.filter((l) => l.level === "error").length,
    warn: logs.filter((l) => l.level === "warn").length,
    info: logs.filter((l) => l.level === "info").length,
    debug: logs.filter((l) => l.level === "debug").length,
  }), [logs])

  const navBadges = useMemo((): Partial<Record<TabType, number | "dot">> => {
    return {
      stats: derivedStats.errorLogs > 0 ? "dot" : undefined,
      questions: questionList.length > 0 ? questionList.length : undefined,
    }
  }, [derivedStats.errorLogs, questionList.length])

  const activeNav = navItems.find((n) => n.id === activeTab)

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-600" />
      </div>
    )
  }

  if (!authorized) return null

  const statsTabText = {
    logsTitle: text.stats.logsTitle,
    clearLogs: text.stats.clearLogs,
    noLogs: text.stats.noLogs,
    allLevels: text.stats.allLevels,
    levelError: text.stats.levelError,
    levelWarn: text.stats.levelWarn,
    levelInfo: text.stats.levelInfo,
    levelDebug: text.stats.levelDebug,
    dailyTrend: text.stats.dailyTrend,
    from: text.stats.from,
    to: text.stats.to,
    filter: text.stats.filter,
    reset: text.stats.reset,
  }

  const overviewTabText = {
    stats: {
      totalCalls: text.stats.totalCalls,
      testCompletions: text.stats.testCompletions,
      tokenUsage: text.stats.tokenUsage,
      dailyTrend: text.stats.dailyTrend,
      byEndpoint: text.stats.byEndpoint,
      successRate: text.stats.successRate,
    },
    overview: text.overview,
    providerConfig: text.providerConfig,
    providerTest: text.providerTest,
    testing: text.testing,
    runTest: text.runTest,
    autoRefresh: isZh ? "自动刷新" : "Auto Refresh",
    autoRefreshHint: isZh ? "每 30 秒" : "Every 30s",
  }

  const providersTabText = {
    title: text.providers.title,
    current: text.providers.current,
    defaultUrl: text.providers.defaultUrl,
    defaultModel: text.providers.defaultModel,
    requiresKey: text.providers.requiresKey,
    noKey: text.providers.noKey,
    config: text.providers.config,
    source: text.providers.source,
    leaveEmpty: text.providers.leaveEmpty,
  }

  const failoverTabText = {
    title: isZh ? "Failover 渠道" : "Failover Providers",
    description: isZh ? "当主渠道不可用时，系统将按优先级依次尝试以下备用渠道。" : "When the primary provider is unavailable, the system will try fallback providers in order.",
    add: isZh ? "添加" : "Add",
    remove: isZh ? "移除" : "Remove",
    moveUp: isZh ? "上移" : "Move Up",
    moveDown: isZh ? "下移" : "Move Down",
    noProviders: isZh ? "尚未配置 Failover 渠道" : "No failover providers configured",
    saving: isZh ? "保存中..." : "Saving...",
    save: isZh ? "保存 Failover 配置" : "Save Failover",
    activeOnly: isZh ? "仅已配置的渠道可作为 Failover" : "Only configured providers can be used as failover",
  }

  const recordsTabText = {
    from: isZh ? "开始日期" : "From",
    to: isZh ? "结束日期" : "To",
    type: isZh ? "MBTI 类型" : "Type",
    locale: isZh ? "语言" : "Locale",
    all: isZh ? "全部" : "All",
    search: isZh ? "查询" : "Search",
    reset: isZh ? "重置" : "Reset",
    recordsTotal: isZh ? "共 {count} 条记录" : "{count} records total",
    noRecords: isZh ? "暂无测试记录" : "No records yet",
    time: isZh ? "时间" : "Time",
    age: isZh ? "年龄段" : "Age",
    gender: isZh ? "性别" : "Gender",
    prev: isZh ? "上页" : "Prev",
    next: isZh ? "下页" : "Next",
    exportJson: isZh ? "导出 JSON" : "Export JSON",
    exportCsv: isZh ? "导出 CSV" : "Export CSV",
    exporting: isZh ? "导出中..." : "Exporting...",
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex h-screen overflow-hidden">
        {/* 侧边栏 */}
        <aside className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-zinc-950 flex flex-col flex-shrink-0 transition-all duration-200`}>
          <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? "" : "mb-4"}`}>
              <div className="w-9 h-9 flex-shrink-0">
                <img src="/favicon.svg" alt="Aurora" className="w-9 h-9" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-white leading-none">Aurora MBTI</div>
                    <span className="text-[11px] text-zinc-500">v{versionInfo?.current || '1.0.0'}</span>
                    <button
                      onClick={() => void checkVersion(true)}
                      disabled={versionChecking}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                      title={isZh ? "检查更新" : "Check for updates"}
                    >
                      <RefreshCw className={`w-3 h-3 ${versionChecking ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{isZh ? "管理后台" : "Admin Console"}</div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && versionInfo?.hasUpdate && versionInfo.releaseUrl && (
              <a
                href={versionInfo.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isZh ? "有新版本可用，点击查看" : "New version available"}</span>
              </a>
            )}
            {!sidebarCollapsed && (
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
            )}
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3"} py-2.5 rounded-xl text-sm transition-all duration-150 group relative ${
                            isActive
                              ? "bg-white/[0.08] text-white"
                              : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
                          }`}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          {isActive && (
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full ${item.accent}`} />
                          )}
                          <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isActive ? item.accentBg : "bg-white/[0.04] group-hover:bg-white/[0.07]"
                          }`}>
                            <item.icon className={`w-4 h-4 ${isActive ? item.accentText : "text-zinc-500 group-hover:text-zinc-300"}`} />
                            {sidebarCollapsed && navBadges[item.id] === "dot" && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                            )}
                          </div>
                          {!sidebarCollapsed && (
                            <>
                              <div className="text-left min-w-0 flex-1">
                                <div className={`text-sm font-medium leading-none ${isActive ? "text-white" : ""}`}>
                                  {item.label}
                                </div>
                                <div className="text-[11px] text-zinc-600 mt-0.5 leading-none truncate">
                                  {item.desc}
                                </div>
                              </div>
                              {navBadges[item.id] !== undefined && (
                                <div className="ml-auto flex-shrink-0">
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
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="px-3 pb-4 border-t border-white/[0.06] pt-3 space-y-1 flex-shrink-0">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-all text-sm"
              title={sidebarCollapsed ? (isZh ? "展开侧边栏" : "Expand sidebar") : (isZh ? "折叠侧边栏" : "Collapse sidebar")}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-0" : "rotate-180"}`} />
              </div>
              {!sidebarCollapsed && <span>{isZh ? "折叠" : "Collapse"}</span>}
            </button>
            <Link
              href="/"
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3"} py-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-all text-sm`}
              title={sidebarCollapsed ? (isZh ? "返回前台" : "Back to site") : undefined}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
              {!sidebarCollapsed && <span>{isZh ? "返回前台" : "Back to site"}</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3"} py-2.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-sm group`}
              title={sidebarCollapsed ? (isZh ? "退出" : "Logout") : undefined}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-rose-500/15 flex items-center justify-center flex-shrink-0 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && <span>{text.logout}</span>}
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto p-8">
          {versionInfo?.hasUpdate && versionInfo.releaseUrl && !versionBannerDismissed && (
            <div className="px-8 pt-8 pb-0">
              <a
                href={versionInfo.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 hover:bg-amber-100 transition-colors mb-0"
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
                  className="p-1 text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </a>
            </div>
          )}
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

            {activeTab === "overview" && (
              <OverviewTab
                overview={overview}
                stats={stats}
                text={overviewTabText}
                isZh={isZh}
                error={error}
                derivedStats={derivedStats}
                providerToTest={providerToTest}
                testing={testing}
                testResult={testResult}
                autoRefresh={autoRefresh}
                onAutoRefreshChange={setAutoRefresh}
                handleProviderTest={handleProviderTest}
                setProviderToTest={setProviderToTest}
              />
            )}

            {activeTab === "stats" && (
              <StatsTab
                logs={logs}
                logLevelFilter={logLevelFilter}
                setLogLevelFilter={setLogLevelFilter}
                logFrom={logFrom}
                setLogFrom={setLogFrom}
                logTo={logTo}
                setLogTo={setLogTo}
                logSearch={logSearch}
                setLogSearch={setLogSearch}
                text={statsTabText}
                isZh={isZh}
                logLevelCounts={logLevelCounts}
                filteredLogs={filteredLogs}
                logsLoading={logsLoading}
                clearLogs={clearLogs}
                onLogFilter={() => void loadLogs()}
                onLogReset={() => { setLogFrom(""); setLogTo(""); setLogSearch(""); void loadLogs() }}
              />
            )}

            {activeTab === "providers" && (
              <ProvidersTab
                overview={overview}
                providerConfigs={providerConfigs}
                providerMessages={providerMessages}
                testResults={testResults}
                providerSearch={providerSearch}
                editingProvider={editingProvider}
                savingProvider={savingProvider}
                testingProvider={testingProvider}
                providerModalOpen={providerModalOpen}
                switchingProvider={switchingProvider}
                text={providersTabText}
                isZh={isZh}
                providers={overview?.providers || {}}
                failoverProviders={failoverProviders}
                failoverSaving={failoverSaving}
                failoverText={failoverTabText}
                onActivateProvider={handleActivateProvider}
                onSaveProviderConfig={handleSaveProviderConfig}
                onTestProvider={handleTestProvider}
                onProviderSearchChange={setProviderSearch}
                onEditingProviderChange={setEditingProvider}
                onProviderModalOpenChange={setProviderModalOpen}
                onProviderConfigsChange={setProviderConfigs}
                onTestResultsChange={setTestResults}
                onProviderMessagesChange={setProviderMessages}
                onAddFailoverProvider={handleAddFailoverProvider}
                onRemoveFailoverProvider={handleRemoveFailoverProvider}
                onMoveFailoverProvider={handleMoveFailoverProvider}
                onSaveFailoverProviders={handleSaveFailoverProviders}
              />
            )}

            {activeTab === "questions" && (
              <QuestionsTab
                questionList={questionList}
                qLoading={qLoading}
                qLocaleFilter={qLocaleFilter}
                qDimFilter={qDimFilter}
                qSearch={qSearch}
                qModalOpen={qModalOpen}
                editingQ={editingQ}
                qForm={qForm}
                qSaving={qSaving}
                qImporting={qImporting}
                isZh={isZh}
                setQLocaleFilter={setQLocaleFilter}
                setQDimFilter={setQDimFilter}
                setQSearch={setQSearch}
                setQModalOpen={setQModalOpen}
                setEditingQ={setEditingQ}
                setQForm={setQForm}
                loadQuestions={loadQuestions}
                saveQuestion={saveQuestion}
                deleteQuestion={deleteQuestion}
                importBuiltin={importBuiltin}
                exportQuestions={exportQuestions}
              />
            )}

            {activeTab === "records" && (
              <RecordsTab
                recordList={recordList}
                recordTotal={recordTotal}
                recordPage={recordPage}
                recordTotalPages={recordTotalPages}
                recordLoading={recordLoading}
                recordTypeFilter={recordTypeFilter}
                recordLocaleFilter={recordLocaleFilter}
                recordFrom={recordFrom}
                recordTo={recordTo}
                exportLoading={recordExportLoading}
                text={recordsTabText}
                isZh={isZh}
                onSearch={() => void loadRecords(1)}
                onReset={() => { setRecordTypeFilter(""); setRecordLocaleFilter(""); setRecordFrom(""); setRecordTo(""); void loadRecords(1) }}
                onPrevPage={() => void loadRecords(recordPage - 1)}
                onNextPage={() => void loadRecords(recordPage + 1)}
                onRefresh={() => void loadRecords(recordPage)}
                onTypeFilterChange={setRecordTypeFilter}
                onLocaleFilterChange={setRecordLocaleFilter}
                onFromChange={setRecordFrom}
                onToChange={setRecordTo}
                onExportJson={() => void exportRecords('json')}
                onExportCsv={() => void exportRecords('csv')}
              />
            )}

            {activeTab === "analytics" && (
              <AnalyticsTab
                analyticsData={analyticsData}
                analyticsLoading={analyticsLoading}
                loadAnalytics={loadAnalytics}
                isZh={isZh}
              />
            )}

            {activeTab === "system" && (
              <SystemTab
                settings={settings}
                setSettings={setSettings}
                settingsLoading={settingsLoading}
                isZh={isZh}
                saveSettings={saveSettings}
                backupLoading={backupLoading}
                exportBackup={exportBackup}
                importBackup={importBackup}
              />
            )}

            {activeTab === "testModes" && (
              <TestModesTab
                testModesSettings={testModesSettings}
                setTestModesSettings={setTestModesSettings}
                testModesLoading={testModesLoading}
                editingModeData={editingModeData}
                setEditingModeData={setEditingModeData}
                modeModalOpen={modeModalOpen}
                setModeModalOpen={setModeModalOpen}
                isZh={isZh}
                saveTestModesSettings={saveTestModesSettings}
                loadTestModesDefaults={loadTestModesDefaults}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminPageContent />
    </ToastProvider>
  )
}