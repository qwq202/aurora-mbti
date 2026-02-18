"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { KeyRound, LogIn } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const isZh = locale.startsWith("zh")
  const isJa = locale.startsWith("ja")
  const text = (zh: string, en: string, ja: string) => (isZh ? zh : isJa ? ja : en)

  const [token, setToken] = useState("")
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
    if (!token.trim()) {
      setError(text("请输入管理员令牌", "Please enter admin token", "管理者トークンを入力してください"))
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(readErrorMessage(data, text("登录失败", "Login failed", "ログインに失敗しました")))
        return
      }

      router.push(`/${locale}/admin`)
    } catch {
      setError(text("网络异常，请稍后重试", "Network error, please try again later", "ネットワークエラーです。しばらくして再試行してください"))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Aurora Admin
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {text("管理员登录", "Admin Login", "管理者ログイン")}
          </p>
        </div>

        <div className="border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">
                {text("管理员令牌", "Admin Token", "管理者トークン")}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  className="w-full h-11 pl-10 pr-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
                  placeholder={text("输入管理员令牌", "Enter admin token", "管理者トークンを入力")}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !token.trim()}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                text("登录中...", "Signing in...", "ログイン中...")
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {text("登录", "Sign In", "ログイン")}
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
            {text("返回首页", "Back to Home", "ホームに戻る")}
          </Link>
        </div>
      </div>
    </div>
  )
}
