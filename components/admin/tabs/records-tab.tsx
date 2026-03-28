"use client"

import React from "react"
import { Search, RefreshCw, ChevronLeft, ChevronRight, Download, ChevronDown } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { AnonymousResult } from "../shared/types"
import { getMbtiColor, MBTI_TYPES } from "../shared/utils"
import { SkeletonTable } from "../shared/skeleton"

export interface RecordsTabProps {
  recordList: AnonymousResult[]
  recordTotal: number
  recordPage: number
  recordTotalPages: number
  recordLoading: boolean
  recordTypeFilter: string
  recordLocaleFilter: string
  recordFrom: string
  recordTo: string
  exportLoading: boolean
  text: {
    from: string
    to: string
    type: string
    locale: string
    all: string
    search: string
    reset: string
    recordsTotal: string
    noRecords: string
    time: string
    age: string
    gender: string
    prev: string
    next: string
    exportJson: string
    exportCsv: string
    exporting: string
  }
  isZh: boolean
  onSearch: () => void
  onReset: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onRefresh: () => void
  onTypeFilterChange: (value: string) => void
  onLocaleFilterChange: (value: string) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onExportJson: () => void
  onExportCsv: () => void
}

export function RecordsTab({
  recordList,
  recordTotal,
  recordPage,
  recordTotalPages,
  recordLoading,
  recordTypeFilter,
  recordLocaleFilter,
  recordFrom,
  recordTo,
  exportLoading,
  text,
  isZh,
  onSearch,
  onReset,
  onPrevPage,
  onNextPage,
  onRefresh,
  onTypeFilterChange,
  onLocaleFilterChange,
  onFromChange,
  onToChange,
  onExportJson,
  onExportCsv,
}: RecordsTabProps) {
  const [expandedRecordId, setExpandedRecordId] = React.useState<string | null>(null)

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

  const MBTI_FILL_MAP: Record<string, string> = {
    "bg-violet-100 text-violet-700": "#8b5cf6",
    "bg-emerald-100 text-emerald-700": "#10b981",
    "bg-amber-100 text-amber-700": "#f59e0b",
    "bg-sky-100 text-sky-700": "#0ea5e9",
    "bg-zinc-100 text-zinc-600": "#71717a",
  }

  return (
    <div className="space-y-5">
      {/* 筛选栏 */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{text.from}</label>
            <input type="date" value={recordFrom} onChange={(e) => onFromChange(e.target.value)}
              className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{text.to}</label>
            <input type="date" value={recordTo} onChange={(e) => onToChange(e.target.value)}
              className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{text.type}</label>
            <select value={recordTypeFilter} onChange={(e) => onTypeFilterChange(e.target.value)}
              className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm">
              <option value="">{text.all}</option>
              {MBTI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{text.locale}</label>
            <select value={recordLocaleFilter} onChange={(e) => onLocaleFilterChange(e.target.value)}
              className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm">
              <option value="">{text.all}</option>
              <option value="zh">zh</option>
              <option value="en">en</option>
              <option value="ja">ja</option>
            </select>
          </div>
          <button
            onClick={() => void onSearch()}
            className="h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4" />{text.search}
          </button>
          <button
            onClick={() => { onTypeFilterChange(""); onLocaleFilterChange(""); onFromChange(""); onToChange(""); void onReset() }}
            className="h-9 px-4 bg-zinc-100 text-zinc-600 text-sm font-medium rounded-lg hover:bg-zinc-200"
          >
            {text.reset}
          </button>
        </div>
      </div>

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
                    const fill = MBTI_FILL_MAP[getMbtiColor(entry.type)] || "#71717a"
                    return <Cell key={entry.type} fill={fill} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 记录表格 */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            {isZh ? `共 ${recordTotal} 条记录` : `${recordTotal} records total`}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={onExportJson}
                disabled={exportLoading || recordTotal === 0}
                className="h-8 px-3 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                {exportLoading ? text.exporting : text.exportJson}
              </button>
              <button
                onClick={onExportCsv}
                disabled={exportLoading || recordTotal === 0}
                className="h-8 px-3 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg hover:bg-emerald-100 disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                {exportLoading ? text.exporting : text.exportCsv}
              </button>
            </div>
            <button onClick={() => void onRefresh()} className="text-zinc-400 hover:text-zinc-700">
              <RefreshCw className={`w-4 h-4 ${recordLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {recordLoading ? (
          <SkeletonTable rows={6} cols={9} />
        ) : recordList.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 text-sm">
            {text.noRecords}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{text.time}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{text.type}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">EI%</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">SN%</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">TF%</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">JP%</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{text.age}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{text.gender}</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">{text.locale}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {recordList.map((r) => {
                  const isExpanded = expandedRecordId === r.id
                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        className="hover:bg-zinc-50 transition-colors cursor-pointer"
                        onClick={() => setExpandedRecordId(isExpanded ? null : r.id)}
                      >
                        <td className="py-3 px-4 text-zinc-400 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <ChevronDown className={`w-3 h-3 text-zinc-300 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            {new Date(r.timestamp).toLocaleString()}
                          </div>
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
                      {isExpanded && (
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-4 gap-4 mb-3">
                              {(["EI", "SN", "TF", "JP"] as const).map((dim) => (
                                <div key={dim} className="text-center">
                                  <div className="text-xs font-semibold text-zinc-500 mb-1">{dim}</div>
                                  <div className="text-sm font-bold text-zinc-800">{r.scores[dim].winner}</div>
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
                            <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
                              <span>ID: <span className="font-mono text-zinc-500">{r.id}</span></span>
                              {r.ageGroup && <span>{isZh ? "年龄段" : "Age"}: {r.ageGroup}</span>}
                              {r.gender && <span>{isZh ? "性别" : "Gender"}: {r.gender}</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* 分页 */}
        {recordTotalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between">
            <button
              onClick={() => void onPrevPage()}
              disabled={recordPage <= 1 || recordLoading}
              className="h-8 px-3 bg-zinc-100 text-zinc-600 text-xs rounded-lg hover:bg-zinc-200 disabled:opacity-40 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />{text.prev}
            </button>
            <span className="text-sm text-zinc-500">
              {recordPage} / {recordTotalPages}
            </span>
            <button
              onClick={() => void onNextPage()}
              disabled={recordPage >= recordTotalPages || recordLoading}
              className="h-8 px-3 bg-zinc-100 text-zinc-600 text-xs rounded-lg hover:bg-zinc-200 disabled:opacity-40 inline-flex items-center gap-1"
            >
              {text.next}<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}