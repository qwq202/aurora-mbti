"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="space-y-6">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">
            
          </div>
          <h1 className="text-4xl font-bold tracking-tight"></h1>
          <p className="text-zinc-600 leading-relaxed">
            {error.message || ""}
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-400">{error.digest}</p>
          )}
          <div className="flex gap-4">
            <button
              onClick={() => reset()}
              className="h-12 px-6 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded-md hover:bg-black transition-all"
            >
              
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="h-12 px-6 border border-zinc-200 text-zinc-600 font-bold text-xs uppercase tracking-widest rounded-md hover:text-zinc-900 transition-all"
            >
              
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
