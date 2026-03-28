"use client"

import React, { useState } from "react"
import { Brain, ChevronLeft, ChevronRight, Eye, EyeOff, Plus, RefreshCw, RotateCcw, X, Play, Zap, Sparkles, BookOpen, Clock, Database } from "lucide-react"
import type { TestModeConfig, TestModeSettings } from "../shared/types"

const MODE_ICONS: Record<string, React.ElementType> = {
  zap: Zap,
  brain: Brain,
  sparkles: Sparkles,
  book: BookOpen,
  clock: Clock,
}

function getEmptyMode(): TestModeConfig {
  return {
    id: `custom_${Date.now()}`,
    enabled: true,
    title: { zh: "", en: "", ja: "" },
    description: { zh: "", en: "", ja: "" },
    questionCount: 60,
    estimatedTime: { zh: "", en: "", ja: "" },
    icon: "brain",
    isAI: true,
    customPrompt: "",
  }
}

export type TestModesTabProps = {
  testModesSettings: TestModeSettings
  setTestModesSettings: React.Dispatch<React.SetStateAction<TestModeSettings>>
  testModesLoading: boolean
  editingModeData: TestModeConfig | null
  setEditingModeData: React.Dispatch<React.SetStateAction<TestModeConfig | null>>
  modeModalOpen: boolean
  setModeModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  isZh: boolean
  saveTestModesSettings: () => Promise<void>
  loadTestModesDefaults: () => void
}

type PreviewQuestion = {
  id: string
  text: string
  dimension: string
  agree: string
}

export function TestModesTab({
  testModesSettings,
  setTestModesSettings,
  testModesLoading,
  editingModeData,
  setEditingModeData,
  modeModalOpen,
  setModeModalOpen,
  isZh,
  saveTestModesSettings,
  loadTestModesDefaults,
}: TestModesTabProps) {
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewResult, setPreviewResult] = useState<{ success: boolean; questions: PreviewQuestion[]; raw?: string } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const handlePreview = async () => {
    if (!editingModeData?.isAI) return
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewResult(null)
    try {
      const res = await fetch('/api/admin/preview-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customPrompt: editingModeData.customPrompt || '',
          questionCount: 5,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Preview failed')
      }
      setPreviewResult(data)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setPreviewLoading(false)
    }
  }

  const openEditModal = (mode?: TestModeConfig) => {
    setEditingModeData(mode ? { ...mode } : getEmptyMode())
    setModeModalOpen(true)
    setPreviewResult(null)
    setPreviewError(null)
  }

  const saveMode = () => {
    if (!editingModeData) return
    const existingIndex = testModesSettings.modes.findIndex((m) => m.id === editingModeData.id)
    if (existingIndex >= 0) {
      setTestModesSettings((prev) => {
        const newModes = [...prev.modes]
        newModes[existingIndex] = editingModeData
        return { ...prev, modes: newModes }
      })
    } else {
      setTestModesSettings((prev) => ({ ...prev, modes: [...prev.modes, editingModeData] }))
    }
    setModeModalOpen(false)
  }

  const toggleMode = (index: number) => {
    setTestModesSettings((prev) => {
      const newModes = [...prev.modes]
      newModes[index] = { ...newModes[index], enabled: !newModes[index].enabled }
      return { ...prev, modes: newModes }
    })
  }

  const moveMode = (from: number, to: number) => {
    if (to < 0 || to >= testModesSettings.modes.length) return
    const newModes = [...testModesSettings.modes]
    const [moved] = newModes.splice(from, 1)
    newModes.splice(to, 0, moved)
    setTestModesSettings((prev) => ({ ...prev, modes: newModes }))
  }

  const deleteMode = (index: number) => {
    if (!confirm(isZh ? "确认删除该模式？" : "Delete this mode?")) return
    setTestModesSettings((prev) => ({ ...prev, modes: prev.modes.filter((_, i) => i !== index) }))
  }

  return (
    <div className="space-y-6">
      {/* 全局设置 */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{isZh ? "全局设置" : "Global Settings"}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "默认选中模式" : "Default Mode"}</label>
            <select
              value={testModesSettings.defaultMode}
              onChange={(e) => setTestModesSettings((prev) => ({ ...prev, defaultMode: e.target.value }))}
              className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
            >
              {testModesSettings.modes
                .filter((m) => m.enabled)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title.zh} ({m.id})
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowCustomCount"
              checked={testModesSettings.allowCustomCount}
              onChange={(e) => setTestModesSettings((prev) => ({ ...prev, allowCustomCount: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300"
            />
            <label htmlFor="allowCustomCount" className="text-sm text-zinc-700">
              {isZh ? "允许用户自定义题目数量" : "Allow custom question count"}
            </label>
          </div>
          {testModesSettings.allowCustomCount && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "最小题目数" : "Min Questions"}</label>
                <input
                  type="number"
                  value={testModesSettings.customCountMin}
                  onChange={(e) =>
                    setTestModesSettings((prev) => ({
                      ...prev,
                      customCountMin: Math.max(5, parseInt(e.target.value) || 5),
                    }))
                  }
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  min={5}
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "最大题目数" : "Max Questions"}</label>
                <input
                  type="number"
                  value={testModesSettings.customCountMax}
                  onChange={(e) =>
                    setTestModesSettings((prev) => ({
                      ...prev,
                      customCountMax: Math.min(500, parseInt(e.target.value) || 200),
                    }))
                  }
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  min={testModesSettings.customCountMin}
                  max={500}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模式列表 */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{isZh ? "测试模式列表" : "Test Mode List"}</h3>
          <div className="flex gap-2">
            <button
              onClick={loadTestModesDefaults}
              className="h-9 px-4 bg-zinc-100 text-zinc-600 text-sm font-medium rounded-lg hover:bg-zinc-200 inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {isZh ? "恢复默认" : "Reset Defaults"}
            </button>
            <button
              onClick={() => openEditModal()}
              className="h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isZh ? "添加模式" : "Add Mode"}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {testModesSettings.modes.map((mode, index) => {
            const Icon = MODE_ICONS[mode.icon] || Brain
            return (
              <div
                key={mode.id}
                className={`border rounded-xl p-4 transition-all ${mode.enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50 opacity-60"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveMode(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveMode(index, index + 1)}
                      disabled={index === testModesSettings.modes.length - 1}
                      className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mode.enabled ? "bg-purple-100" : "bg-zinc-100"}`}>
                    <Icon className={`w-5 h-5 ${mode.enabled ? "text-purple-600" : "text-zinc-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mode.title.zh || mode.id}</span>
                      <span className="text-xs text-zinc-400">{mode.id}</span>
                      {mode.isAI && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">AI</span>
                      )}
                      {testModesSettings.defaultMode === mode.id && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                          {isZh ? "默认" : "Default"}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500 truncate">{mode.description.zh}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {mode.questionCount} {isZh ? "题" : "questions"} · {mode.estimatedTime.zh}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMode(index)}
                      className={`p-2 rounded-lg ${mode.enabled ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}
                    >
                      {mode.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(mode)}
                      className="p-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200"
                    >
                      <Database className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMode(index)}
                      className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={saveTestModesSettings}
          disabled={testModesLoading}
          className="h-10 px-6 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {testModesLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
          {testModesLoading ? (isZh ? "保存中..." : "Saving...") : isZh ? "保存配置" : "Save Settings"}
        </button>
      </div>

      {/* 编辑弹窗 */}
      {modeModalOpen && editingModeData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {testModesSettings.modes.find((m) => m.id === editingModeData.id)
                  ? isZh
                    ? "编辑模式"
                    : "Edit Mode"
                  : isZh
                    ? "添加模式"
                    : "Add Mode"}
              </h3>
              <button onClick={() => setModeModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "模式 ID" : "Mode ID"}</label>
                <input
                  value={editingModeData.id}
                  onChange={(e) =>
                    setEditingModeData((prev) => (prev ? { ...prev, id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") } : null))
                  }
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono"
                  placeholder="ai-custom"
                />
                <p className="text-xs text-zinc-400 mt-1">{isZh ? "唯一标识符" : "Unique identifier"}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "中文名称" : "Chinese"}</label>
                  <input
                    value={editingModeData.title.zh}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, title: { ...prev.title, zh: e.target.value } } : null))
                    }
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "英文名称" : "English"}</label>
                  <input
                    value={editingModeData.title.en}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, title: { ...prev.title, en: e.target.value } } : null))
                    }
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "日文名称" : "Japanese"}</label>
                  <input
                    value={editingModeData.title.ja}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, title: { ...prev.title, ja: e.target.value } } : null))
                    }
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "题目数量" : "Question Count"}</label>
                  <input
                    type="number"
                    value={editingModeData.questionCount}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, questionCount: Math.max(1, parseInt(e.target.value) || 60) } : null))
                    }
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                    min={1}
                    max={500}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "图标" : "Icon"}</label>
                  <select
                    value={editingModeData.icon}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, icon: e.target.value as TestModeConfig["icon"] } : null))
                    }
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                  >
                    <option value="zap">Zap</option>
                    <option value="brain">Brain</option>
                    <option value="sparkles">Sparkles</option>
                    <option value="book">Book</option>
                    <option value="clock">Clock</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-zinc-500 mb-1">{isZh ? "中文描述" : "Chinese Desc"}</label>
                  <textarea
                    value={editingModeData.description.zh}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, description: { ...prev.description, zh: e.target.value } } : null))
                    }
                    className="w-full h-20 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1">{isZh ? "英文描述" : "English Desc"}</label>
                  <textarea
                    value={editingModeData.description.en}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, description: { ...prev.description, en: e.target.value } } : null))
                    }
                    className="w-full h-20 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1">{isZh ? "日文描述" : "Japanese Desc"}</label>
                  <textarea
                    value={editingModeData.description.ja}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, description: { ...prev.description, ja: e.target.value } } : null))
                    }
                    className="w-full h-20 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "预估时间（中文）" : "Time (Zh)"}</label>
                  <input
                    value={editingModeData.estimatedTime.zh}
                    onChange={(e) =>
                      setEditingModeData((prev) =>
                        prev ? { ...prev, estimatedTime: { ...prev.estimatedTime, zh: e.target.value } } : null
                      )
                    }
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                    placeholder="约 10 分钟"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "预估时间（英文）" : "Time (En)"}</label>
                  <input
                    value={editingModeData.estimatedTime.en}
                    onChange={(e) =>
                      setEditingModeData((prev) =>
                        prev ? { ...prev, estimatedTime: { ...prev.estimatedTime, en: e.target.value } } : null
                      )
                    }
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                    placeholder="~10 min"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "预估时间（日文）" : "Time (Ja)"}</label>
                  <input
                    value={editingModeData.estimatedTime.ja}
                    onChange={(e) =>
                      setEditingModeData((prev) =>
                        prev ? { ...prev, estimatedTime: { ...prev.estimatedTime, ja: e.target.value } } : null
                      )
                    }
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                    placeholder="約10分"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingModeData.isAI}
                    onChange={(e) => setEditingModeData((prev) => (prev ? { ...prev, isAI: e.target.checked } : null))}
                    className="w-4 h-4 rounded border-zinc-300"
                  />
                  <span className="text-sm text-zinc-700">{isZh ? "AI 生成题目" : "AI Generated"}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingModeData.enabled}
                    onChange={(e) => setEditingModeData((prev) => (prev ? { ...prev, enabled: e.target.checked } : null))}
                    className="w-4 h-4 rounded border-zinc-300"
                  />
                  <span className="text-sm text-zinc-700">{isZh ? "启用" : "Enabled"}</span>
                </label>
              </div>
              {editingModeData.isAI && (
                <div>
                  <label className="block text-sm text-zinc-500 mb-1.5">
                    {isZh ? "自定义 Prompt（可选）" : "Custom Prompt (optional)"}
                  </label>
                  <textarea
                    value={editingModeData.customPrompt || ""}
                    onChange={(e) =>
                      setEditingModeData((prev) => (prev ? { ...prev, customPrompt: e.target.value } : null))
                    }
                    className="w-full h-24 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm resize-none font-mono"
                    placeholder={isZh ? "留空使用默认 prompt。可用变量：{profile}（用户档案）、{count}（题目数量）" : "Leave empty for default prompt. Variables: {profile}, {count}"}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={previewLoading}
                      className="h-8 px-3 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {previewLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {previewLoading ? (isZh ? "生成中..." : "Generating...") : (isZh ? "预览效果" : "Preview")}
                    </button>
                    <span className="text-xs text-zinc-400">{isZh ? "生成 5 道样题" : "Generate 5 sample questions"}</span>
                  </div>
                  {previewError && (
                    <div className="mt-2 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                      {previewError}
                    </div>
                  )}
                  {previewResult && previewResult.questions && previewResult.questions.length > 0 && (
                    <div className="mt-3 border border-zinc-200 rounded-lg overflow-hidden">
                      <div className="bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500">
                        {isZh ? "预览题目" : "Preview Questions"}
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {previewResult.questions.map((q, i) => (
                          <div key={i} className="px-3 py-2 border-b border-zinc-100 last:border-b-0">
                            <div className="text-sm">{q.text || `(empty)`}</div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {q.dimension} - {q.agree}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 flex gap-3">
              <button
                onClick={saveMode}
                className="h-10 px-6 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
              >
                {isZh ? "保存" : "Save"}
              </button>
              <button
                onClick={() => setModeModalOpen(false)}
                className="h-10 px-6 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-200"
              >
                {isZh ? "取消" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}