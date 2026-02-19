import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const RESULTS_FILE = path.join(DATA_DIR, 'results.json')

/** 最多保留条数 */
const MAX_RESULTS = 10_000

export type MbtiTypeStr =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'

export interface DimensionScore {
  winner: string
  percent: number
}

export interface AnonymousResult {
  id: string
  timestamp: string
  mbtiType: MbtiTypeStr
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

interface ResultsFile {
  results: AnonymousResult[]
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readFile(): ResultsFile {
  ensureDataDir()
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      const raw = fs.readFileSync(RESULTS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as ResultsFile
      if (parsed && Array.isArray(parsed.results)) return parsed
    }
  } catch {
    // 文件损坏时返回空
  }
  return { results: [] }
}

function writeFile(file: ResultsFile) {
  ensureDataDir()
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(file, null, 2))
}

export function appendResult(r: Omit<AnonymousResult, 'id'>): AnonymousResult {
  const file = readFile()
  const newResult: AnonymousResult = {
    ...r,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }
  file.results.push(newResult)
  // 超限时删最旧（FIFO）
  if (file.results.length > MAX_RESULTS) {
    file.results = file.results.slice(file.results.length - MAX_RESULTS)
  }
  writeFile(file)
  return newResult
}

export interface GetResultsOptions {
  page?: number
  limit?: number
  type?: string
  locale?: string
  from?: string
  to?: string
}

export interface PagedResults {
  total: number
  page: number
  limit: number
  totalPages: number
  results: AnonymousResult[]
}

export function getResults(options: GetResultsOptions = {}): PagedResults {
  const { page = 1, limit = 50, type, locale, from, to } = options
  const file = readFile()
  let list = file.results.slice().reverse() // 最新的在前

  if (type) list = list.filter((r) => r.mbtiType === type)
  if (locale) list = list.filter((r) => r.locale === locale)
  if (from) {
    const fromTime = new Date(from).getTime()
    list = list.filter((r) => new Date(r.timestamp).getTime() >= fromTime)
  }
  if (to) {
    const toTime = new Date(to).getTime() + 86400_000 // 包含当天
    list = list.filter((r) => new Date(r.timestamp).getTime() <= toTime)
  }

  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit
  const results = list.slice(start, start + limit)

  return { total, page: safePage, limit, totalPages, results }
}

export interface AnalyticsData {
  /** 16 种类型的分布 */
  typeDistribution: { type: string; count: number }[]
  /** 4 个维度的群体均值百分比（第一字母的百分比，e.g. E% in EI）*/
  dimensionAverages: { dimension: string; firstLetter: string; secondLetter: string; firstPercent: number }[]
  /** 年龄段分布 */
  ageGroupDistribution: { ageGroup: string; count: number }[]
  /** 性别分布 */
  genderDistribution: { gender: string; count: number }[]
  /** 每日测试趋势（近 30 天） */
  dailyTrend: { date: string; count: number }[]
  /** 总记录数 */
  total: number
}

const ALL_TYPES: MbtiTypeStr[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]

export function getAnalytics(): AnalyticsData {
  const file = readFile()
  const results = file.results
  const total = results.length

  // 类型分布
  const typeCount = new Map<string, number>()
  for (const t of ALL_TYPES) typeCount.set(t, 0)
  for (const r of results) {
    typeCount.set(r.mbtiType, (typeCount.get(r.mbtiType) ?? 0) + 1)
  }
  const typeDistribution = ALL_TYPES.map((t) => ({ type: t, count: typeCount.get(t) ?? 0 }))
    .sort((a, b) => b.count - a.count)

  // 维度均值
  const dims = [
    { dimension: 'EI', firstLetter: 'E', secondLetter: 'I' },
    { dimension: 'SN', firstLetter: 'S', secondLetter: 'N' },
    { dimension: 'TF', firstLetter: 'T', secondLetter: 'F' },
    { dimension: 'JP', firstLetter: 'J', secondLetter: 'P' },
  ]
  const dimensionAverages = dims.map(({ dimension, firstLetter, secondLetter }) => {
    if (results.length === 0) return { dimension, firstLetter, secondLetter, firstPercent: 50 }
    const key = dimension as keyof AnonymousResult['scores']
    let totalPercent = 0
    for (const r of results) {
      const score = r.scores[key]
      // percent 是 winner 的占比，需要换算成 firstLetter 的占比
      const isFirst = score.winner === firstLetter
      totalPercent += isFirst ? score.percent : 100 - score.percent
    }
    return {
      dimension,
      firstLetter,
      secondLetter,
      firstPercent: Math.round(totalPercent / results.length),
    }
  })

  // 年龄段分布
  const ageCount = new Map<string, number>()
  for (const r of results) {
    if (r.ageGroup) {
      ageCount.set(r.ageGroup, (ageCount.get(r.ageGroup) ?? 0) + 1)
    }
  }
  const ageGroupDistribution = Array.from(ageCount.entries())
    .map(([ageGroup, count]) => ({ ageGroup, count }))
    .sort((a, b) => b.count - a.count)

  // 性别分布
  const genderCount = new Map<string, number>()
  for (const r of results) {
    if (r.gender) {
      genderCount.set(r.gender, (genderCount.get(r.gender) ?? 0) + 1)
    }
  }
  const genderDistribution = Array.from(genderCount.entries())
    .map(([gender, count]) => ({ gender, count }))
    .sort((a, b) => b.count - a.count)

  // 每日趋势（近 30 天）
  const today = new Date()
  const dailyCount = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyCount.set(key, 0)
  }
  for (const r of results) {
    const day = r.timestamp.slice(0, 10)
    if (dailyCount.has(day)) {
      dailyCount.set(day, (dailyCount.get(day) ?? 0) + 1)
    }
  }
  const dailyTrend = Array.from(dailyCount.entries()).map(([date, count]) => ({ date, count }))

  return {
    typeDistribution,
    dimensionAverages,
    ageGroupDistribution,
    genderDistribution,
    dailyTrend,
    total,
  }
}
