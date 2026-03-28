"use client"

import { Key, Shield, Activity, AlertTriangle } from "lucide-react"

// 概览数据类型
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
    activeProvider: string
    activeConfig: {
      baseUrl: string
      model: string
      hasKey: boolean
      keyMasked?: string
    }
  }
  security: Record<string, never>
  providers: Record<string, ProviderConfig>
  specs: ProviderInfo[]
}

type ProviderConfig = {
  baseUrl?: string
  model?: string
  hasKey: boolean
  updatedAt?: string
}

type ProviderInfo = {
  id: string
  label: string
  defaultBaseUrl: string
  defaultModel: string
  requiresApiKey: boolean
}

// 文本翻译类型
type SecurityText = {
  title: string
  apiKey: string
  apiKeyDesc: string
  adminCreds: string
  adminCredsDesc: string
  memStatus: string
  memStatusDesc: string
  configured: string
  notConfigured: string
  normal: string
  warning: string
}

interface SecurityTabProps {
  overview: OverviewData | null
  text: SecurityText
  isZh: boolean
}

export function SecurityTab({ overview, text, isZh }: SecurityTabProps) {
  const rssBytes = overview?.runtime.memory.rss || 0
  const rssMB = Math.round(rssBytes / 1024 / 1024)
  const memWarning = rssMB > 512

  const securityItems = [
    {
      icon: Key,
      label: text.apiKey,
      desc: text.apiKeyDesc,
      envKey: isZh ? "管理面板 → AI 配置" : "Admin Panel → AI Config",
      value: overview?.ai.activeConfig?.hasKey,
      valueDisplay: overview?.ai.activeConfig?.keyMasked || (overview?.ai.activeConfig?.hasKey ? "••••••••" : "—"),
      statusColor: overview?.ai.activeConfig?.hasKey
        ? "bg-emerald-100 text-emerald-700"
        : "bg-rose-100 text-rose-700",
      mono: true,
    },
    {
      icon: Shield,
      label: text.adminCreds,
      desc: text.adminCredsDesc,
      envKey: "ADMIN_USERNAME / ADMIN_PASSWORD",
      value: true,
      valueDisplay: text.configured,
      statusColor: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: memWarning ? AlertTriangle : Activity,
      label: text.memStatus,
      desc: text.memStatusDesc,
      envKey: "RSS Memory",
      value: !memWarning,
      valueDisplay: `${rssMB} MB — ${memWarning ? text.warning : text.normal}`,
      statusColor: memWarning
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h3 className="text-lg font-semibold">{text.title}</h3>
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