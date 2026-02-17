"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/routing"
import { Activity, Gauge, LogOut, PlugZap, ShieldCheck, Server } from "lucide-react"

type ProviderInfo = {
  id: string
  label: string
  defaultBaseUrl: string
  defaultModel: string
  requiresApiKey: boolean
}

type OverviewData = {
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
    currentProvider: string
    baseUrl: string
    model: string
    apiKeySet: boolean
    apiKeyMasked: string
  }
  security: {
    debugApiLogs: boolean
    corsAllowedOrigins: string
  }
  providers: ProviderInfo[]
}

function formatMB(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}

export default function AdminPage() {
  const locale = useLocale()
  const isZh = locale.startsWith("zh")

  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [error, setError] = useState("")
  const [providerToTest, setProviderToTest] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState("")

  const text = useMemo(
    () => ({
      title: isZh ? "Aurora Admin Console" : "Aurora Admin Console",
      subtitle: isZh ? "基于 AdminLTE 信息架构风格的后台控制面板" : "Backoffice panel inspired by AdminLTE information architecture",
      loginTitle: isZh ? "管理员登录" : "Admin Login",
      tokenPlaceholder: isZh ? "输入 ADMIN_TOKEN" : "Enter ADMIN_TOKEN",
      loginBtn: isZh ? "登录后台" : "Sign In",
      loadFailed: isZh ? "加载后台数据失败" : "Failed to load admin overview",
      logout: isZh ? "退出登录" : "Logout",
      refresh: isZh ? "刷新" : "Refresh",
      providerTest: isZh ? "渠道连通测试" : "Provider Connectivity Test",
      runTest: isZh ? "执行测试" : "Run Test",
      testing: isZh ? "测试中..." : "Testing...",
      unauthorized: isZh ? "未授权，请先登录。" : "Unauthorized, please sign in first.",
    }),
    [isZh]
  )

  const loadOverview = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/overview", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) {
        setAuthorized(false)
        setOverview(null)
        setError(data?.error || text.loadFailed)
        return
      }
      setAuthorized(true)
      setOverview(data.overview as OverviewData)
      setProviderToTest((prev) => prev || data.overview.ai.currentProvider)
    } catch {
      setError(text.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOverview()
  }, [])

  const handleLogin = async () => {
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
        setError(data?.error || text.unauthorized)
        return
      }
      setToken("")
      await loadOverview()
    } catch {
      setError(text.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" })
    setAuthorized(false)
    setOverview(null)
    setTestResult("")
  }

  const handleProviderTest = async () => {
    setTesting(true)
    setTestResult("")
    try {
      const res = await fetch("/api/admin/provider-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ config: { provider: providerToTest } }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTestResult(`${isZh ? "失败" : "Failed"}: ${data?.error || "Unknown error"}`)
      } else {
        setTestResult(`${isZh ? "成功" : "Success"}: ${data?.preview || "OK"}`)
      }
    } catch {
      setTestResult(isZh ? "失败：网络异常" : "Failed: network error")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="bg-slate-900 text-slate-200 px-6 py-8">
          <div className="mb-10">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Aurora</div>
            <h1 className="mt-2 text-2xl font-black">Admin</h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">{text.subtitle}</p>
          </div>
          <nav className="space-y-3 text-sm">
            <div className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2"><Gauge className="h-4 w-4" />Overview</div>
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-400"><PlugZap className="h-4 w-4" />Providers</div>
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-400"><ShieldCheck className="h-4 w-4" />Security</div>
          </nav>
          <div className="mt-10 border-t border-slate-800 pt-6">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
              {isZh ? "返回前台" : "Back to site"}
            </Link>
          </div>
        </aside>

        <main className="p-6 lg:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight">{text.title}</h2>
              <p className="text-sm text-slate-500 mt-2">{overview?.runtime.timestamp || ""}</p>
            </div>
            {authorized ? (
              <div className="flex items-center gap-3">
                <button onClick={() => void loadOverview()} className="h-10 px-4 rounded-md bg-white border border-slate-200 text-sm font-semibold">
                  {text.refresh}
                </button>
                <button onClick={handleLogout} className="h-10 px-4 rounded-md bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  {text.logout}
                </button>
              </div>
            ) : null}
          </div>

          {!authorized ? (
            <section className="max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold">{text.loginTitle}</h3>
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder={text.tokenPlaceholder}
                className="mt-4 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
              />
              <button
                onClick={handleLogin}
                disabled={loading || !token.trim()}
                className="mt-4 h-11 w-full rounded-md bg-slate-900 text-white text-sm font-bold disabled:opacity-60"
              >
                {loading ? (isZh ? "登录中..." : "Signing in...") : text.loginBtn}
              </button>
              {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
            </section>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Runtime</div>
                  <div className="mt-3 text-2xl font-black">{overview?.runtime.nodeEnv || "unknown"}</div>
                  <div className="mt-2 text-sm text-slate-500 inline-flex items-center gap-2"><Server className="h-4 w-4" />Uptime {overview?.runtime.uptimeSeconds || 0}s</div>
                </article>
                <article className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Provider</div>
                  <div className="mt-3 text-2xl font-black">{overview?.ai.currentProvider || "-"}</div>
                  <div className="mt-2 text-sm text-slate-500">{overview?.ai.model || "-"}</div>
                </article>
                <article className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Memory</div>
                  <div className="mt-3 text-2xl font-black">{overview ? formatMB(overview.runtime.memory.heapUsed) : "-"}</div>
                  <div className="mt-2 text-sm text-slate-500 inline-flex items-center gap-2"><Activity className="h-4 w-4" />Heap Used</div>
                </article>
              </section>

              <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold">{text.providerTest}</h3>
                <p className="mt-1 text-sm text-slate-500">{overview?.ai.baseUrl || "-"}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    value={providerToTest}
                    onChange={(event) => setProviderToTest(event.target.value)}
                    className="h-11 rounded-md border border-slate-200 px-3 text-sm bg-white"
                  >
                    {(overview?.providers || []).map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.id} - {provider.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleProviderTest}
                    disabled={testing || !providerToTest}
                    className="h-11 px-4 rounded-md bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    <PlugZap className="h-4 w-4" />
                    {testing ? text.testing : text.runTest}
                  </button>
                </div>
                {testResult ? (
                  <pre className="mt-4 rounded-md bg-slate-900 text-emerald-300 p-4 text-xs overflow-auto">{testResult}</pre>
                ) : null}
              </section>

              <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold">{isZh ? "安全配置" : "Security Configuration"}</h3>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <div>ADMIN_TOKEN: {isZh ? "已配置" : "configured"}</div>
                  <div>DEBUG_API_LOGS: {overview?.security.debugApiLogs ? "true" : "false"}</div>
                  <div>CORS_ALLOWED_ORIGINS: {overview?.security.corsAllowedOrigins || "-"}</div>
                  <div>API KEY MASK: {overview?.ai.apiKeyMasked || "-"}</div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
