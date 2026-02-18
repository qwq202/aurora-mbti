import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const STATS_FILE = path.join(DATA_DIR, 'stats.json')

export interface StatsData {
  apiCalls: Record<string, number>
  tokenUsage: {
    input: number
    output: number
  }
  testCompletions: number
  daily: Record<string, { calls: number; tests: number }>
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readStats(): StatsData {
  ensureDataDir()
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading stats:', error)
  }
  return {
    apiCalls: {},
    tokenUsage: { input: 0, output: 0 },
    testCompletions: 0,
    daily: {},
  }
}

// daily 记录最多保留 90 天，防止文件与内存无限增长
const DAILY_RETENTION_DAYS = 90

function pruneOldDailyStats(stats: StatsData): void {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DAILY_RETENTION_DAYS)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  for (const date of Object.keys(stats.daily)) {
    if (date < cutoffStr) {
      delete stats.daily[date]
    }
  }
}

function writeStats(stats: StatsData) {
  ensureDataDir()
  try {
    pruneOldDailyStats(stats)
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2))
  } catch (error) {
    console.error('Error writing stats:', error)
  }
}

export function recordApiCall(endpoint: string) {
  const stats = readStats()
  
  stats.apiCalls[endpoint] = (stats.apiCalls[endpoint] || 0) + 1
  
  const today = new Date().toISOString().split('T')[0]
  if (!stats.daily[today]) {
    stats.daily[today] = { calls: 0, tests: 0 }
  }
  stats.daily[today].calls++
  
  writeStats(stats)
}

export function recordTokenUsage(inputTokens: number, outputTokens: number) {
  const stats = readStats()
  stats.tokenUsage.input += inputTokens
  stats.tokenUsage.output += outputTokens
  writeStats(stats)
}

export function recordTestCompletion() {
  const stats = readStats()
  stats.testCompletions++
  
  const today = new Date().toISOString().split('T')[0]
  if (!stats.daily[today]) {
    stats.daily[today] = { calls: 0, tests: 0 }
  }
  stats.daily[today].tests++
  
  writeStats(stats)
}

export function getStats(): StatsData {
  return readStats()
}

export function getDailyStats(days: number = 7): { date: string; calls: number; tests: number }[] {
  const stats = readStats()
  const result: { date: string; calls: number; tests: number }[] = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      calls: stats.daily[dateStr]?.calls || 0,
      tests: stats.daily[dateStr]?.tests || 0,
    })
  }
  
  return result
}
