"use client"

import { PieChart as PieChartIcon, RefreshCw } from "lucide-react"
import {
  AreaChart,
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
import { AnalyticsData } from "../shared/types"
import { formatNumber, getMbtiColor } from "../shared/utils"

export type AnalyticsTabProps = {
  analyticsData: AnalyticsData | null
  analyticsLoading: boolean
  loadAnalytics: () => void
  isZh: boolean
}

const ANALYSIS_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
  "#f97316", "#14b8a6", "#a855f7", "#eab308", "#22c55e", "#3b82f6", "#f43f5e", "#64748b",
]

export function AnalyticsTab({ analyticsData, analyticsLoading, loadAnalytics, isZh }: AnalyticsTabProps) {
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
        <div className="text-zinc-400 text-sm">
          {isZh ? "暂无分析数据，完成测试后自动采集" : "No data yet. Records will be collected after tests are completed."}
        </div>
        <button
          onClick={loadAnalytics}
          className="mt-4 h-9 px-4 bg-zinc-100 text-zinc-600 text-sm rounded-lg hover:bg-zinc-200 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {isZh ? "刷新" : "Refresh"}
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
            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mb-2 ${getMbtiColor(t.type)}`}>
              {t.type}
            </div>
            <div className="text-2xl font-bold">{t.count}</div>
            <div className="text-xs text-zinc-400">
              {analyticsData.total > 0 ? `${((t.count / analyticsData.total) * 100).toFixed(1)}%` : "—"}
            </div>
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
                    <Pie
                      data={analyticsData.ageGroupDistribution}
                      dataKey="count"
                      nameKey="ageGroup"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
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
            <div className="h-52 flex items-center justify-center text-zinc-300 text-sm">
              {isZh ? "暂无数据" : "No data"}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-4">{isZh ? "性别分布" : "Gender Distribution"}</h3>
          {analyticsData.genderDistribution.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.genderDistribution}
                      dataKey="count"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {analyticsData.genderDistribution.map((_, i) => (
                        <Cell key={i} fill={["#6366f1", "#ec4899", "#64748b"][i % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 justify-center">
                {analyticsData.genderDistribution.map((item, i) => (
                  <div key={item.gender} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#6366f1", "#ec4899", "#64748b"][i % 3] }} />
                    {item.gender}: {item.count}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-zinc-300 text-sm">
              {isZh ? "暂无数据" : "No data"}
            </div>
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
            <AreaChart data={analyticsData.dailyTrend}>
              <defs>
                <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#analyticsGrad)"
                name={isZh ? "测试次数" : "Tests"}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}