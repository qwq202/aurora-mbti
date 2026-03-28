import {
  Gauge, BarChart3, BookOpen, ClipboardList, PieChart as PieChartIcon,
  Network, Database, Settings2,
} from "lucide-react"
import type { NavGroup, TabType } from "./types"

type TabText = {
  overview: string
  stats: string
  providers: string
  questions: string
  records: string
  analytics: string
}

export function getNavGroups(isZh: boolean, text: TabText): NavGroup[] {
  return [
    {
      label: isZh ? "系统" : "System",
      items: [
        {
          id: "overview" as TabType,
          label: text.overview,
          desc: isZh ? "系统状态一览" : "System status",
          icon: Gauge,
          accent: "bg-sky-500",
          accentText: "text-sky-400",
          accentBg: "bg-sky-500/15",
        },
        {
          id: "stats" as TabType,
          label: text.stats,
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
          id: "testModes" as TabType,
          label: isZh ? "测试模式" : "Test Modes",
          desc: isZh ? "测试模式配置" : "Test mode settings",
          icon: Settings2,
          accent: "bg-purple-500",
          accentText: "text-purple-400",
          accentBg: "bg-purple-500/15",
        },
        {
          id: "questions" as TabType,
          label: text.questions,
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
          label: text.records,
          desc: isZh ? "匿名测试记录" : "Anonymous records",
          icon: ClipboardList,
          accent: "bg-violet-500",
          accentText: "text-violet-400",
          accentBg: "bg-violet-500/15",
        },
        {
          id: "analytics" as TabType,
          label: text.analytics,
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
          label: text.providers,
          desc: isZh ? "AI 渠道管理" : "AI providers",
          icon: Network,
          accent: "bg-indigo-500",
          accentText: "text-indigo-400",
          accentBg: "bg-indigo-500/15",
        },
        {
          id: "system" as TabType,
          label: isZh ? "系统管理" : "System",
          desc: isZh ? "设置、日志、备份、安全" : "Settings, logs, backup, security",
          icon: Database,
          accent: "bg-cyan-500",
          accentText: "text-cyan-400",
          accentBg: "bg-cyan-500/15",
        },
      ],
    },
  ]
}