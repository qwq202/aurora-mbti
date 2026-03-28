import { LucideIcon } from "lucide-react"

export type TabType = "overview" | "stats" | "providers" | "questions" | "records" | "analytics" | "system" | "testModes"

export type LogLevel = "all" | "error" | "warn" | "info" | "debug"

export type ProviderInfo = {
  id: string
  label: string
  defaultBaseUrl: string
  defaultModel: string
  requiresApiKey: boolean
}

export type ProviderConfig = {
  baseUrl?: string
  model?: string
  hasKey: boolean
  updatedAt?: string
}

export type OverviewData = {
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
    failoverProviders?: string[]
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

export type StatsData = {
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

export type LogEntry = {
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

export type StoredQuestion = {
  id: string
  locale: string
  text: string
  dimension: string
  agree: string
  contexts?: string[]
}

export type DimensionScore = { winner: string; percent: number }

export type AnonymousResult = {
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

export type AnalyticsData = {
  typeDistribution: { type: string; count: number }[]
  dimensionAverages: { dimension: string; firstLetter: string; secondLetter: string; firstPercent: number }[]
  ageGroupDistribution: { ageGroup: string; count: number }[]
  genderDistribution: { gender: string; count: number }[]
  dailyTrend: { date: string; count: number }[]
  total: number
}

export type TestModeConfig = {
  id: string
  enabled: boolean
  title: { zh: string; en: string; ja: string }
  description: { zh: string; en: string; ja: string }
  questionCount: number
  estimatedTime: { zh: string; en: string; ja: string }
  icon: 'zap' | 'brain' | 'sparkles' | 'book' | 'clock'
  isAI: boolean
  customPrompt?: string
}

export type TestModeSettings = {
  modes: TestModeConfig[]
  defaultMode: string
  allowCustomCount: boolean
  customCountMin: number
  customCountMax: number
}

export type NavItem = {
  id: TabType
  label: string
  desc: string
  icon: LucideIcon
  accent: string
  accentText: string
  accentBg: string
  badge?: number | "dot"
}

export type NavGroup = {
  label: string
  items: NavItem[]
}