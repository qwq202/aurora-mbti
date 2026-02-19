import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json')

export type QuestionLocale = 'zh' | 'en' | 'ja'
export type QuestionDimension = 'EI' | 'SN' | 'TF' | 'JP'
export type QuestionAgree = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'

export interface StoredQuestion {
  id: string
  locale: QuestionLocale
  text: string
  dimension: QuestionDimension
  agree: QuestionAgree
  contexts?: string[]
  ageGroups?: string[]
}

interface QuestionsFile {
  version: number
  updatedAt: string
  questions: StoredQuestion[]
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readFile(): QuestionsFile {
  ensureDataDir()
  try {
    if (fs.existsSync(QUESTIONS_FILE)) {
      const raw = fs.readFileSync(QUESTIONS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as QuestionsFile
      if (parsed && Array.isArray(parsed.questions)) return parsed
    }
  } catch {
    // 文件损坏时返回空库
  }
  return { version: 1, updatedAt: new Date().toISOString(), questions: [] }
}

function writeFile(file: QuestionsFile) {
  ensureDataDir()
  file.updatedAt = new Date().toISOString()
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(file, null, 2))
}

export function readQuestions(locale?: QuestionLocale, dimension?: QuestionDimension): StoredQuestion[] {
  const file = readFile()
  let list = file.questions
  if (locale) list = list.filter((q) => q.locale === locale)
  if (dimension) list = list.filter((q) => q.dimension === dimension)
  return list
}

export function getTotalCount(): number {
  return readFile().questions.length
}

export function addQuestion(q: Omit<StoredQuestion, 'id'>): StoredQuestion {
  const file = readFile()
  const existing = file.questions.filter((x) => x.locale === q.locale && x.dimension === q.dimension)
  const newId = `${q.locale}-${q.dimension.toLowerCase()}-${existing.length + 1}`
  const newQ: StoredQuestion = { ...q, id: newId }
  file.questions.push(newQ)
  writeFile(file)
  return newQ
}

export function updateQuestion(id: string, updates: Partial<Omit<StoredQuestion, 'id'>>): StoredQuestion | null {
  const file = readFile()
  const idx = file.questions.findIndex((q) => q.id === id)
  if (idx === -1) return null
  file.questions[idx] = { ...file.questions[idx], ...updates }
  writeFile(file)
  return file.questions[idx]
}

export function deleteQuestion(id: string): boolean {
  const file = readFile()
  const before = file.questions.length
  file.questions = file.questions.filter((q) => q.id !== id)
  if (file.questions.length === before) return false
  writeFile(file)
  return true
}

export function importQuestions(questions: StoredQuestion[]): number {
  const file = readFile()
  // 按 id 去重：已存在的覆盖，新的追加
  const map = new Map(file.questions.map((q) => [q.id, q]))
  for (const q of questions) {
    map.set(q.id, q)
  }
  file.questions = Array.from(map.values())
  writeFile(file)
  return questions.length
}

export function importFromBuiltin(locale: QuestionLocale): number {
  // 动态 require 内置题库（避免循环依赖）
  let builtinQuestions: { id: string; text: string; dimension: string; agree: string; contexts?: string[]; ageGroups?: string[] }[] = []

  if (locale === 'zh') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./mbti-questions') as { QUESTIONS: typeof builtinQuestions }
    builtinQuestions = mod.QUESTIONS
  } else if (locale === 'en') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./mbti-questions.en') as { QUESTIONS: typeof builtinQuestions }
    builtinQuestions = mod.QUESTIONS
  } else if (locale === 'ja') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./mbti-questions.ja') as { QUESTIONS: typeof builtinQuestions }
    builtinQuestions = mod.QUESTIONS
  }

  const toImport: StoredQuestion[] = builtinQuestions.map((q) => ({
    id: `${locale}-${q.id}`,
    locale,
    text: q.text,
    dimension: q.dimension as QuestionDimension,
    agree: q.agree as QuestionAgree,
    contexts: q.contexts,
    ageGroups: q.ageGroups,
  }))

  return importQuestions(toImport)
}
