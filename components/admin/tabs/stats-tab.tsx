"use client"

import React from "react"
import { RefreshCw, Trash2, Filter, Search, ChevronDown } from "lucide-react"
import { LogEntry, LogLevel } from "../shared/types"
import { SkeletonTable } from "../shared/skeleton"

export interface StatsTabProps {
  logs: LogEntry[]
  logLevelFilter: LogLevel
  setLogLevelFilter: (level: LogLevel) => void
  logSearch: string
  setLogSearch: (v: string) => void
  logFrom: string
  setLogFrom: (from: string) => void
  logTo: string
  setLogTo: (to: string) => void
  text: {
    logsTitle: string
    clearLogs: string
    noLogs: string
    allLevels: string
    levelError: string
    levelWarn: string
    levelInfo: string
    levelDebug: string
    dailyTrend: string
    from: string
    to: string
    filter: string
    reset: string
  }
  isZh: boolean
  logLevelCounts: {
    all: number
    error: number
    warn: number
    info: number
    debug: number
  }
  filteredLogs: LogEntry[]
  logsLoading: boolean
  clearLogs: () => void
  onLogFilter: () => void
  onLogReset: () => void
}

export function StatsTab({
  logLevelFilter,
  setLogLevelFilter,
  logSearch,
  setLogSearch,
  logFrom,
  setLogFrom,
  logTo,
  setLogTo,
  text,
  isZh,
  logLevelCounts,
  filteredLogs,
  logsLoading,
  clearLogs,
  onLogFilter,
  onLogReset,
}: StatsTabProps) {
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null)
  return (
    <div className="space-y-6">
      {/* 说明提示 */}
      <div className="text-sm text-zinc-500 px-1">
        {isZh ? "快速统计指标请查看「概览」页面，此处专注于请求日志分析" : "See Overview for quick stats. This page focuses on request logs."}
      </div>

      {/* 日志（带级别过滤） */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{text.logsTitle}</h3>
          <button
            onClick={clearLogs}
            className="h-8 px-3 bg-rose-500 text-white text-xs font-medium rounded-lg hover:bg-rose-600 inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            {text.clearLogs}
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
              {level === "all" ? text.allLevels
                : level === "error" ? text.levelError
                : level === "warn" ? text.levelWarn
                : level === "info" ? text.levelInfo
                : text.levelDebug}
              <span className="ml-1 opacity-70">({logLevelCounts[level]})</span>
            </button>
          ))}
        </div>

        {/* 文本搜索 */}
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

        {/* 时间范围过滤 */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{text.from}</label>
            <input
              type="date"
              value={logFrom}
              onChange={(e) => setLogFrom(e.target.value)}
              className="h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{text.to}</label>
            <input
              type="date"
              value={logTo}
              onChange={(e) => setLogTo(e.target.value)}
              className="h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={onLogFilter}
            className="h-8 px-3 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800"
          >
            {text.filter}
          </button>
          <button
            onClick={onLogReset}
            className="h-8 px-3 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-lg hover:bg-zinc-200"
          >
            {text.reset}
          </button>
        </div>

        {logsLoading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">{text.noLogs}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="w-6 py-3 px-2" />
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
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  const hasDetail = !!(log.error || (log.message && log.message.length > 60))
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`border-b border-zinc-50 hover:bg-zinc-50 ${hasDetail ? "cursor-pointer" : ""}`}
                        onClick={() => hasDetail && setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <td className="py-2 px-2 w-6">
                          {hasDetail && (
                            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          )}
                        </td>
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}