"use client"

import { Download, Upload } from "lucide-react"

export type SystemSettings = {
  siteName: string
  defaultLanguage: 'zh' | 'en' | 'ja'
  theme: 'light' | 'dark' | 'system'
  allowAnonymousTest: boolean
  updatedAt?: string
}

export type SystemTabProps = {
  settings: SystemSettings
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>
  settingsLoading: boolean
  isZh: boolean
  saveSettings: () => Promise<void>
  backupLoading: boolean
  exportBackup: () => Promise<void>
  importBackup: (file: File) => Promise<void>
}

export function SystemTab({
  settings,
  setSettings,
  settingsLoading,
  isZh,
  saveSettings,
  backupLoading,
  exportBackup,
  importBackup,
}: SystemTabProps) {
  return (
    <div className="space-y-6">
      {/* 系统设置 */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{isZh ? "系统设置" : "System Settings"}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "站点名称" : "Site Name"}</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))}
              className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
              placeholder="Aurora MBTI"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "默认语言" : "Default Language"}</label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings((s) => ({ ...s, defaultLanguage: e.target.value as 'zh' | 'en' | 'ja' }))}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1.5">{isZh ? "主题" : "Theme"}</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value as 'light' | 'dark' | 'system' }))}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
              >
                <option value="system">{isZh ? "跟随系统" : "System"}</option>
                <option value="light">{isZh ? "浅色" : "Light"}</option>
                <option value="dark">{isZh ? "深色" : "Dark"}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowAnonymousTest"
              checked={settings.allowAnonymousTest}
              onChange={(e) => setSettings((s) => ({ ...s, allowAnonymousTest: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300"
            />
            <label htmlFor="allowAnonymousTest" className="text-sm text-zinc-700">
              {isZh ? "允许匿名用户进行测试" : "Allow anonymous users to take tests"}
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveSettings}
              disabled={settingsLoading}
              className="h-10 px-5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            >
              {settingsLoading ? (isZh ? "保存中..." : "Saving...") : (isZh ? "保存设置" : "Save Settings")}
            </button>
          </div>
        </div>
      </div>

      {/* 数据备份 */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{isZh ? "数据备份" : "Data Backup"}</h3>
        <p className="text-sm text-zinc-500 mb-4">
          {isZh ? "系统日志已移至「统计」页面，支持按级别和时间筛选。" : "System logs have been moved to the Stats tab with level and time filtering."}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportBackup}
            disabled={backupLoading}
            className="h-10 px-5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isZh ? "导出备份" : "Export Backup"}
          </button>
          <label className="h-10 px-5 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-200 cursor-pointer inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {isZh ? "导入备份" : "Import Backup"}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void importBackup(file)
                e.target.value = ""
              }}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          {isZh ? "导入备份将覆盖现有数据（题库、测试记录、AI配置、系统设置）" : "Importing backup will overwrite existing data (questions, results, AI config, settings)"}
        </p>
      </div>
    </div>
  )
}