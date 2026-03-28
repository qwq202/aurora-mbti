"use client"

import React from "react"
import { Search, Network, CheckCircle, X, RefreshCw, ChevronUp, ChevronDown, Plus, Minus, ArrowDownUp } from "lucide-react"
import {
  OpenAI, Anthropic, Gemini, DeepSeek, Ollama, Groq,
  Volcengine, Bailian, NewAPI, SiliconCloud, OpenRouter
} from "@lobehub/icons"
import type { OverviewData, ProviderInfo, ProviderConfig } from "../shared/types"

type ProviderIconProps = {
  size?: number
  className?: string
}

const PROVIDER_ICON_MAP: Record<string, React.ComponentType<ProviderIconProps>> = {
  openai: OpenAI,
  anthropic: Anthropic,
  gemini: Gemini,
  deepseek: DeepSeek,
  ollama: Ollama,
  groq: Groq,
  volcengine: Volcengine,
  bailian: Bailian,
  newapi: NewAPI,
  siliconflow: SiliconCloud,
  openrouter: OpenRouter,
}

function getProviderIcon(providerId: string): React.ComponentType<ProviderIconProps> | null {
  return PROVIDER_ICON_MAP[providerId] || null
}

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

type ProvidersText = {
  title: string
  current: string
  defaultUrl: string
  defaultModel: string
  requiresKey: string
  noKey: string
  config: string
  source: string
  leaveEmpty: string
}

type FailoverText = {
  title: string
  description: string
  add: string
  remove: string
  moveUp: string
  moveDown: string
  noProviders: string
  saving: string
  save: string
  activeOnly: string
}

type TestResult = {
  success: boolean
  duration?: string
  error?: string
}

interface ProvidersTabProps {
  overview: OverviewData | null
  providerConfigs: Record<string, { baseUrl: string; model: string; apiKey: string }>
  providerMessages: Record<string, string>
  testResults: Record<string, TestResult>
  providerSearch: string
  editingProvider: string | null
  savingProvider: string | null
  testingProvider: string | null
  providerModalOpen: boolean
  switchingProvider: string
  text: ProvidersText
  isZh: boolean
  providers: Record<string, ProviderConfig>
  failoverProviders: string[]
  failoverSaving: boolean
  failoverText: FailoverText
  onActivateProvider: (providerId: string) => Promise<void>
  onSaveProviderConfig: (providerId: string) => Promise<void>
  onTestProvider: (providerId: string) => Promise<void>
  onProviderSearchChange: (value: string) => void
  onEditingProviderChange: (value: string | null) => void
  onProviderModalOpenChange: (value: boolean) => void
  onProviderConfigsChange: (value: Record<string, { baseUrl: string; model: string; apiKey: string }>) => void
  onTestResultsChange: (value: Record<string, TestResult>) => void
  onProviderMessagesChange: (value: Record<string, string>) => void
  onAddFailoverProvider: (providerId: string) => void
  onRemoveFailoverProvider: (providerId: string) => void
  onMoveFailoverProvider: (providerId: string, direction: 'up' | 'down') => void
  onSaveFailoverProviders: () => Promise<void>
}

export function ProvidersTab({
  overview,
  providerConfigs,
  providerMessages,
  testResults,
  providerSearch,
  editingProvider,
  savingProvider,
  testingProvider,
  providerModalOpen,
  switchingProvider,
  text,
  isZh,
  providers,
  failoverProviders,
  failoverSaving,
  failoverText,
  onActivateProvider,
  onSaveProviderConfig,
  onTestProvider,
  onProviderSearchChange,
  onEditingProviderChange,
  onProviderModalOpenChange,
  onProviderConfigsChange,
  onTestResultsChange,
  onProviderMessagesChange,
  onAddFailoverProvider,
  onRemoveFailoverProvider,
  onMoveFailoverProvider,
  onSaveFailoverProviders,
}: ProvidersTabProps) {
  const specs = overview?.specs || []
  const providersData = overview?.providers || {}

  const search = providerSearch.toLowerCase()
  const filteredSpecs = specs.filter((spec) =>
    spec.id.toLowerCase().includes(search) || spec.label.toLowerCase().includes(search)
  )

  const editingSpec = specs.find((s) => s.id === editingProvider)
  const editingConfig = editingProvider
    ? (providerConfigs[editingProvider] || {
        baseUrl: editingSpec?.defaultBaseUrl || "",
        model: editingSpec?.defaultModel || "",
        apiKey: "",
      })
    : null

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={providerSearch}
          onChange={(e) => onProviderSearchChange(e.target.value)}
          placeholder={isZh ? "搜索渠道..." : "Search providers..."}
          className="w-full h-10 pl-10 pr-4 bg-white border border-zinc-200 rounded-lg text-sm"
        />
      </div>

      <div className="space-y-3">
        {filteredSpecs.map((spec) => {
          const isActive = spec.id === overview?.ai.activeProvider
          const providerConfig = providersData[spec.id] || {}
          const isSaving = savingProvider === spec.id
          const isTesting = testingProvider === spec.id
          const ProviderIcon = getProviderIcon(spec.id)
          const testResult = testResults[spec.id]
          const status: "active" | "ok" | "error" | "idle" =
            isActive ? "active"
            : testResult?.success === true ? "ok"
            : testResult?.success === false ? "error"
            : "idle"

          return (
            <div
              key={spec.id}
              className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${
                isActive ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-zinc-100 hover:border-zinc-200"
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-emerald-100" : "bg-zinc-100"}`}>
                      {ProviderIcon ? (
                        <ProviderIcon size={28} className={isActive ? "text-emerald-600" : "text-zinc-600"} />
                      ) : (
                        <Network className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-zinc-500"}`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusDot status={status} />
                        <div className="font-semibold text-lg">{spec.id}</div>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-full inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {text.current}
                          </span>
                        )}
                        {providerConfig.hasKey && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                            {isZh ? "已配置" : "Configured"}
                          </span>
                        )}
                        {spec.requiresApiKey && !providerConfig.hasKey && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            {isZh ? "需要 Key" : "Key Required"}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-500">{spec.label}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        onEditingProviderChange(spec.id)
                        onProviderModalOpenChange(true)
                        onProviderMessagesChange({ ...providerMessages, [spec.id]: "" })
                        const newTestResults = { ...testResults }
                        delete newTestResults[spec.id]
                        onTestResultsChange(newTestResults)
                      }}
                      className="h-9 px-4 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-200"
                    >
                      {isZh ? "配置" : "Config"}
                    </button>
                    {!isActive && (
                      <button
                        onClick={() => void onActivateProvider(spec.id)}
                        disabled={!!switchingProvider}
                        className="h-9 px-4 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {switchingProvider === spec.id && <RefreshCw className="w-4 h-4 animate-spin" />}
                        {isZh ? "设为当前" : "Set Active"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 配置弹窗 */}
      {providerModalOpen && editingSpec && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{editingSpec.id}</h3>
                <p className="text-sm text-zinc-500">{editingSpec.label}</p>
              </div>
              <button
                onClick={() => {
                  onProviderModalOpenChange(false)
                  onEditingProviderChange(null)
                }}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "API 地址" : "Base URL"}</label>
                <input
                  type="text"
                  value={editingConfig?.baseUrl || ""}
                  onChange={(e) =>
                    onProviderConfigsChange({
                      ...providerConfigs,
                      [editingSpec.id]: {
                        ...(providerConfigs[editingSpec.id] || {}),
                        baseUrl: e.target.value,
                      },
                    })
                  }
                  placeholder={editingSpec.defaultBaseUrl}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "模型" : "Model"}</label>
                <input
                  type="text"
                  value={editingConfig?.model || ""}
                  onChange={(e) =>
                    onProviderConfigsChange({
                      ...providerConfigs,
                      [editingSpec.id]: {
                        ...(providerConfigs[editingSpec.id] || {}),
                        model: e.target.value,
                      },
                    })
                  }
                  placeholder={editingSpec.defaultModel}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                />
              </div>

              {editingSpec.requiresApiKey && (
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={editingConfig?.apiKey || ""}
                    onChange={(e) =>
                      onProviderConfigsChange({
                        ...providerConfigs,
                        [editingSpec.id]: {
                          ...(providerConfigs[editingSpec.id] || {}),
                          apiKey: e.target.value,
                        },
                      })
                    }
                    placeholder={providers[editingSpec.id]?.hasKey ? "••••••••••••" : "sk-..."}
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono"
                  />
                  {providers[editingSpec.id]?.hasKey && !editingConfig?.apiKey && (
                    <p className="text-xs text-zinc-400 mt-1">{isZh ? "留空保持现有密钥不变" : "Leave empty to keep existing key"}</p>
                  )}
                </div>
              )}
            </div>

            {/* 测试结果 */}
            {testResults[editingSpec.id] && (
              <div className={`p-3 rounded-lg text-sm ${testResults[editingSpec.id].success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                {testResults[editingSpec.id].success ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {isZh ? "连接成功" : "Connection successful"} ({testResults[editingSpec.id].duration})
                  </span>
                ) : (
                  <span>{isZh ? "连接失败" : "Connection failed"}: {testResults[editingSpec.id].error}</span>
                )}
              </div>
            )}

            {providerMessages[editingSpec.id] && (
              <div className={`text-sm px-3 py-2 rounded-lg ${providerMessages[editingSpec.id].includes("失败") || providerMessages[editingSpec.id].includes("failed") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                {providerMessages[editingSpec.id]}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => void onSaveProviderConfig(editingSpec.id)}
                disabled={savingProvider === editingSpec.id}
                className="h-10 px-5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {savingProvider === editingSpec.id && <RefreshCw className="w-4 h-4 animate-spin" />}
                {savingProvider === editingSpec.id ? (isZh ? "保存中..." : "Saving...") : (isZh ? "保存配置" : "Save")}
              </button>

              <button
                onClick={() => void onTestProvider(editingSpec.id)}
                disabled={testingProvider === editingSpec.id}
                className="h-10 px-5 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-200 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {testingProvider === editingSpec.id && <RefreshCw className="w-4 h-4 animate-spin" />}
                {testingProvider === editingSpec.id ? (isZh ? "测试中..." : "Testing...") : (isZh ? "测试连接" : "Test")}
              </button>

              <button
                onClick={() => {
                  onProviderModalOpenChange(false)
                  onEditingProviderChange(null)
                }}
                className="h-10 px-5 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-200"
              >
                {isZh ? "关闭" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failover 渠道配置区域 */}
      <div className="mt-8 pt-6 border-t border-zinc-200">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDownUp className="w-5 h-5 text-zinc-500" />
          <h3 className="text-lg font-semibold">{failoverText.title}</h3>
        </div>
        <p className="text-sm text-zinc-500 mb-4">{failoverText.description}</p>

        {/* Failover 列表 */}
        {failoverProviders.length > 0 ? (
          <div className="space-y-2 mb-4">
            {failoverProviders.map((providerId, index) => {
              const spec = specs.find((s) => s.id === providerId)
              const ProviderIcon = getProviderIcon(providerId)
              const isActive = providerId === overview?.ai.activeProvider

              return (
                <div
                  key={providerId}
                  className="bg-white rounded-xl border border-zinc-200 p-3 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      {ProviderIcon ? (
                        <ProviderIcon size={24} className={isActive ? "text-emerald-600" : "text-zinc-600"} />
                      ) : (
                        <Network className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-zinc-500"}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{providerId}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                            {text.current}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-zinc-500">{spec?.label || providerId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* 上下移动按钮 */}
                    <button
                      onClick={() => onMoveFailoverProvider(providerId, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={failoverText.moveUp}
                    >
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    </button>
                    <button
                      onClick={() => onMoveFailoverProvider(providerId, 'down')}
                      disabled={index === failoverProviders.length - 1}
                      className="p-1.5 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={failoverText.moveDown}
                    >
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    </button>
                    {/* 移除按钮 */}
                    <button
                      onClick={() => onRemoveFailoverProvider(providerId)}
                      className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 ml-1"
                      title={failoverText.remove}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-300 p-6 text-center mb-4">
            <p className="text-sm text-zinc-400">{failoverText.noProviders}</p>
          </div>
        )}

        {/* 添加渠道到 Failover */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-500 mb-2">{isZh ? "添加渠道到 Failover 列表" : "Add Provider to Failover"}</label>
          <div className="flex flex-wrap gap-2">
            {specs.filter((s) => !failoverProviders.includes(s.id) && providers[s.id]?.hasKey).map((spec) => {
              const ProviderIcon = getProviderIcon(spec.id)
              return (
                <button
                  key={spec.id}
                  onClick={() => onAddFailoverProvider(spec.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm transition-colors"
                >
                  {ProviderIcon ? (
                    <ProviderIcon size={16} className="text-zinc-600" />
                  ) : (
                    <Network className="w-4 h-4 text-zinc-500" />
                  )}
                  <span>{spec.id}</span>
                  <Plus className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              )
            })}
          </div>
          {specs.filter((s) => !failoverProviders.includes(s.id) && providers[s.id]?.hasKey).length === 0 && (
            <p className="text-sm text-zinc-400">{isZh ? "所有已配置渠道已在 Failover 列表中" : "All configured providers are already in failover list"}</p>
          )}
          {specs.filter((s) => !providers[s.id]?.hasKey).length > 0 && (
            <p className="text-xs text-zinc-400 mt-2">{isZh ? "提示：仅显示已配置 API Key 的渠道" : "Note: Only providers with API Key configured are shown"}</p>
          )}
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => void onSaveFailoverProviders()}
            disabled={failoverSaving}
            className="h-10 px-5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {failoverSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {failoverSaving ? failoverText.saving : failoverText.save}
          </button>
          {isZh && (
            <p className="text-xs text-zinc-400">{failoverText.activeOnly}</p>
          )}
        </div>
      </div>
    </div>
  )
}