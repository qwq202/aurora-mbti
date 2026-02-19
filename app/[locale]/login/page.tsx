"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { LogIn, User, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const isZh = locale.startsWith("zh")
  const isJa = locale.startsWith("ja")
  const t = (zh: string, en: string, ja: string) => (isZh ? zh : isJa ? ja : en)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const readErrorMessage = (body: unknown, fallback: string) => {
    if (!body || typeof body !== "object") return fallback
    const record = body as Record<string, unknown>
    if (record.error && typeof record.error === "object") {
      const nested = (record.error as Record<string, unknown>).message
      if (typeof nested === "string" && nested.trim()) return nested
    }
    if (typeof record.error === "string" && record.error.trim()) return record.error
    return fallback
  }

  const handleLogin = async () => {
    if (!username.trim()) {
      setError(t("请输入用户名", "Please enter username", "ユーザー名を入力してください"))
      return
    }
    if (!password.trim()) {
      setError(t("请输入密码", "Please enter password", "パスワードを入力してください"))
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(readErrorMessage(data, t("用户名或密码错误", "Invalid username or password", "ユーザー名またはパスワードが正しくありません")))
        return
      }

      router.push(`/${locale}/admin`)
    } catch {
      setError(t("网络异常，请稍后重试", "Network error, please try again", "ネットワークエラーです。しばらくして再試行してください"))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void handleLogin()
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 品牌 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
            <Image src="/favicon.svg" alt="Aurora" width={48} height={48} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Aurora Admin</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {t("管理员登录", "Admin Login", "管理者ログイン")}
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="space-y-4">
            {/* 用户名 */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                {t("用户名", "Username", "ユーザー名")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="username"
                  autoFocus
                  className="w-full h-11 pl-9 pr-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                  placeholder={t("输入管理员用户名", "Enter username", "ユーザー名を入力")}
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                {t("密码", "Password", "パスワード")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  className="w-full h-11 pl-9 pr-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                  placeholder={t("输入密码", "Enter password", "パスワードを入力")}
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              onClick={() => void handleLogin()}
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                t("登录中...", "Signing in...", "ログイン中...")
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {t("登录", "Sign In", "ログイン")}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {t("返回首页", "Back to Home", "ホームに戻る")}
          </Link>
        </div>
      </div>
    </div>
  )
}
