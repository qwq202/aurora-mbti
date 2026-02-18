import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const LOGS_FILE = path.join(DATA_DIR, 'logs.json')

const MAX_LOGS = 1000

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  endpoint: string
  method: string
  statusCode?: number
  duration?: number
  message?: string
  error?: string
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readLogs(): LogEntry[] {
  ensureDataDir()
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading logs:', error)
  }
  return []
}

function writeLogs(logs: LogEntry[]) {
  ensureDataDir()
  try {
    const data = JSON.stringify(logs, null, 2)
    fs.writeFileSync(LOGS_FILE, data)
  } catch (error) {
    console.error('Error writing logs:', error)
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
  const logs = readLogs()
  
  const newEntry: LogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  }
  
  logs.unshift(newEntry)
  
  if (logs.length > MAX_LOGS) {
    logs.length = MAX_LOGS
  }
  
  writeLogs(logs)
}

export function getLogs(options?: {
  level?: LogLevel
  endpoint?: string
  limit?: number
  offset?: number
}): LogEntry[] {
  let logs = readLogs()
  
  if (options?.level) {
    logs = logs.filter(log => log.level === options.level)
  }
  
  if (options?.endpoint) {
    logs = logs.filter(log => log.endpoint.includes(options.endpoint!))
  }
  
  const offset = options?.offset || 0
  const limit = options?.limit || 100
  
  return logs.slice(offset, offset + limit)
}

export function getLogById(id: string): LogEntry | undefined {
  const logs = readLogs()
  return logs.find(log => log.id === id)
}

export function clearLogs() {
  writeLogs([])
}

export function getLogStats(): { total: number; byLevel: Record<LogLevel, number>; byEndpoint: Record<string, number> } {
  const logs = readLogs()
  
  const byLevel: Record<LogLevel, number> = {
    info: 0,
    warn: 0,
    error: 0,
    debug: 0,
  }
  
  const byEndpoint: Record<string, number> = {}
  
  logs.forEach(log => {
    byLevel[log.level]++
    byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] || 0) + 1
  })
  
  return {
    total: logs.length,
    byLevel,
    byEndpoint,
  }
}
