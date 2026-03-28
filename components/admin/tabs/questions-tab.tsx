"use client"

import React, { useState } from "react"
import { AlertTriangle, Download, Plus, RefreshCw, Search, Upload, X } from "lucide-react"
import { SkeletonTable } from "../shared/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StoredQuestion } from "../shared/types"

const DIMENSIONS = ["EI", "SN", "TF", "JP"]
const AGREE_OPTIONS: Record<string, string[]> = { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] }
const LOCALES = ["zh", "en", "ja"]
const DIM_COLORS: Record<string, string> = {
  EI: "bg-sky-100 text-sky-700",
  SN: "bg-emerald-100 text-emerald-700",
  TF: "bg-violet-100 text-violet-700",
  JP: "bg-amber-100 text-amber-700",
}

export interface QuestionsTabProps {
  questionList: StoredQuestion[]
  qLoading: boolean
  qLocaleFilter: string
  qDimFilter: string
  qSearch: string
  qModalOpen: boolean
  editingQ: StoredQuestion | null
  qForm: { text: string; dimension: string; agree: string; locale: string; contexts: string }
  qSaving: boolean
  qImporting: boolean
  isZh: boolean
  setQLocaleFilter: (value: string) => void
  setQDimFilter: (value: string) => void
  setQSearch: (value: string) => void
  setQModalOpen: (value: boolean) => void
  setEditingQ: (value: StoredQuestion | null) => void
  setQForm: (value: { text: string; dimension: string; agree: string; locale: string; contexts: string } | ((prev: { text: string; dimension: string; agree: string; locale: string; contexts: string }) => { text: string; dimension: string; agree: string; locale: string; contexts: string })) => void
  loadQuestions: () => Promise<void>
  saveQuestion: () => Promise<void>
  deleteQuestion: (id: string) => Promise<void>
  importBuiltin: () => Promise<void>
  exportQuestions: () => void
}

export function QuestionsTab({
  questionList,
  qLoading,
  qLocaleFilter,
  qDimFilter,
  qSearch,
  qModalOpen,
  editingQ,
  qForm,
  qSaving,
  qImporting,
  isZh,
  setQLocaleFilter,
  setQDimFilter,
  setQSearch,
  setQModalOpen,
  setEditingQ,
  setQForm,
  loadQuestions,
  saveQuestion,
  deleteQuestion,
  importBuiltin,
  exportQuestions,
}: QuestionsTabProps) {
  // 导入确认弹窗状态
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importConfirmText, setImportConfirmText] = useState("")

  const dimCounts = React.useMemo(() => {
    const counts: Record<string, number> = { EI: 0, SN: 0, TF: 0, JP: 0 }
    for (const q of questionList) {
      if (q.dimension in counts) counts[q.dimension]++
    }
    return counts
  }, [questionList])

  const filteredQuestions = React.useMemo(() => {
    if (!qSearch.trim()) return questionList
    const kw = qSearch.toLowerCase()
    return questionList.filter((q) => q.text.toLowerCase().includes(kw) || q.id.toLowerCase().includes(kw))
  }, [questionList, qSearch])

  // 执行导入操作
  const handleImport = () => {
    setImportModalOpen(false)
    setImportConfirmText("")
    void importBuiltin()
  }

  return (
    <div className="space-y-5">
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
              onClick={() => setImportModalOpen(true)}
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
      </div>

      {/* 题目表格 */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500">
            {isZh ? `共 ${filteredQuestions.length} 题` : `${filteredQuestions.length} questions`}
          </span>
        </div>
        {qLoading ? (
          <SkeletonTable rows={8} cols={5} />
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
                          className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-medium whitespace-nowrap"
                        >
                          {isZh ? "编辑" : "Edit"}
                        </button>
                        <button
                          onClick={() => void deleteQuestion(q.id)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-medium whitespace-nowrap"
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
              <button onClick={() => { setQModalOpen(false) }} className="text-zinc-400 hover:text-zinc-700">
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
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => void saveQuestion()}
                disabled={qSaving || !qForm.text.trim()}
                className="flex-1 h-10 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50"
              >
                {qSaving ? (isZh ? "保存中..." : "Saving...") : (isZh ? "保存" : "Save")}
              </button>
              <button
                onClick={() => { setQModalOpen(false) }}
                className="h-10 px-5 bg-zinc-100 text-zinc-600 text-sm font-medium rounded-lg hover:bg-zinc-200"
              >
                {isZh ? "取消" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入确认弹窗 */}
      <AlertDialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-lg">
                {isZh ? "确认导入？" : "Confirm Import?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-zinc-600 pt-2">
              {isZh 
                ? "导入将覆盖当前所有自定义题目，此操作不可撤销。" 
                : "Importing will overwrite all current custom questions. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="block text-sm text-zinc-500">
              {isZh ? "请输入 CONFIRM 以继续：" : "Type CONFIRM to continue:"}
            </label>
            <input
              type="text"
              value={importConfirmText}
              onChange={(e) => setImportConfirmText(e.target.value)}
              placeholder="CONFIRM"
              className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => { setImportModalOpen(false); setImportConfirmText(""); }}
              className="mt-0"
            >
              {isZh ? "取消" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              disabled={importConfirmText !== "CONFIRM"}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed mt-0"
            >
              {isZh ? "确认导入" : "Confirm Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}