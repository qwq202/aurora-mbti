import { TEST_MODE_META_KEY } from '@/lib/constants'

export type StoredTestModeMeta = {
  id: string
  isAI: boolean
  questionCount: number
}

// js-cache-storage: module-level cache avoids repeated localStorage parsing
let _cachedMeta: StoredTestModeMeta | null = null
let _cacheInitialized = false

export function readStoredTestModeMeta(): StoredTestModeMeta | null {
  if (typeof window === 'undefined') return null
  if (_cacheInitialized) return _cachedMeta
  _cacheInitialized = true
  try {
    const raw = window.localStorage.getItem(TEST_MODE_META_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredTestModeMeta>
    if (typeof parsed.id !== 'string') return null
    _cachedMeta = {
      id: parsed.id,
      isAI: parsed.isAI === true,
      questionCount: typeof parsed.questionCount === 'number' ? parsed.questionCount : 60,
    }
    return _cachedMeta
  } catch {
    return null
  }
}

export function invalidateTestModeMetaCache() {
  _cacheInitialized = false
  _cachedMeta = null
}

export function writeStoredTestModeMeta(meta: StoredTestModeMeta) {
  if (typeof window === 'undefined') return
  _cachedMeta = meta
  _cacheInitialized = true
  try {
    window.localStorage.setItem(TEST_MODE_META_KEY, JSON.stringify(meta))
  } catch {
    // 忽略存储异常
  }
}

export function isStoredModeAI(modeId: string, meta?: StoredTestModeMeta | null) {
  if (meta?.id === modeId) return meta.isAI
  return modeId.startsWith('ai')
}

export function getStoredModeQuestionCount(modeId: string, meta?: StoredTestModeMeta | null) {
  if (meta?.id === modeId) return meta.questionCount
  if (modeId === 'ai30') return 30
  if (modeId === 'ai120') return 120
  return 60
}
