import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

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

export type SystemSettings = {
  siteName: string
  defaultLanguage: 'zh' | 'en' | 'ja'
  theme: 'light' | 'dark' | 'system'
  allowAnonymousTest: boolean
  testModes: TestModeSettings
  updatedAt?: string
}

const DEFAULT_TEST_MODES: TestModeConfig[] = [
  {
    id: 'standard',
    enabled: true,
    title: { zh: '标准模式', en: 'Standard Mode', ja: 'スタンダード' },
    description: { zh: '使用预设题库，题目固定不变，适合快速测试', en: 'Use built-in questions, fixed set, great for quick testing', ja: '内蔵問題を使用、固定セット、手軽なテストに' },
    questionCount: 60,
    estimatedTime: { zh: '约 10 分钟', en: '~10 min', ja: '約10分' },
    icon: 'book',
    isAI: false,
  },
  {
    id: 'ai30',
    enabled: true,
    title: { zh: 'AI 轻量版', en: 'AI Lite', ja: 'AIライト' },
    description: { zh: 'AI 根据你的档案生成个性化题目，探索更深入', en: 'AI generates personalized questions based on your profile', ja: 'AIがプロフィールに基づいてカスタマイズ' },
    questionCount: 30,
    estimatedTime: { zh: '约 5 分钟', en: '~5 min', ja: '約5分' },
    icon: 'zap',
    isAI: true,
  },
  {
    id: 'ai60',
    enabled: true,
    title: { zh: 'AI 标准版', en: 'AI Standard', ja: 'AIスタンダード' },
    description: { zh: 'AI 根据你的档案生成 60 道个性化题目，平衡体验', en: 'AI generates 60 personalized questions for a balanced experience', ja: 'AIが60問のカスタマイズ問題を生成' },
    questionCount: 60,
    estimatedTime: { zh: '约 10 分钟', en: '~10 min', ja: '約10分' },
    icon: 'brain',
    isAI: true,
  },
  {
    id: 'ai120',
    enabled: true,
    title: { zh: 'AI 深度版', en: 'AI Deep', ja: 'AIディープ' },
    description: { zh: 'AI 根据你的档案生成 120 道深度题目，全面探索', en: 'AI generates 120 deep questions for comprehensive analysis', ja: 'AIが120問の詳細な問題を生成' },
    questionCount: 120,
    estimatedTime: { zh: '约 20 分钟', en: '~20 min', ja: '約20分' },
    icon: 'sparkles',
    isAI: true,
  },
]

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'Aurora MBTI',
  defaultLanguage: 'zh',
  theme: 'system',
  allowAnonymousTest: true,
  testModes: {
    modes: DEFAULT_TEST_MODES,
    defaultMode: 'ai60',
    allowCustomCount: false,
    customCountMin: 10,
    customCountMax: 200,
  },
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readSettings(): SystemSettings {
  try {
    ensureDataDir()
    if (!fs.existsSync(SETTINGS_FILE)) {
      const defaultWithTestModes: SystemSettings = {
        ...DEFAULT_SETTINGS,
        testModes: {
          modes: DEFAULT_TEST_MODES,
          defaultMode: 'ai60',
          allowCustomCount: false,
          customCountMin: 10,
          customCountMax: 200,
        },
      }
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultWithTestModes, null, 2), 'utf-8')
      return defaultWithTestModes
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<SystemSettings>
    const merged: SystemSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      testModes: parsed.testModes && parsed.testModes.modes && parsed.testModes.modes.length > 0
        ? parsed.testModes
        : DEFAULT_SETTINGS.testModes,
    }
    return merged
  } catch {
    return { 
      ...DEFAULT_SETTINGS,
      testModes: DEFAULT_SETTINGS.testModes,
    }
  }
}

export function writeSettings(settings: Partial<SystemSettings>): SystemSettings {
  ensureDataDir()
  const current = readSettings()
  const updated: SystemSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}