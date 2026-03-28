"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

type Toast = {
  id: string
  type: ToastType
  message: string
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timerRef.current.get(id)
    if (timer) { clearTimeout(timer); timerRef.current.delete(id) }
  }, [])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev.slice(-4), { id, type, message }])
    const timer = setTimeout(() => dismiss(id), 3500)
    timerRef.current.set(id, timer)
  }, [dismiss])

  useEffect(() => {
    const timers = timerRef.current
    return () => { timers.forEach(clearTimeout) }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium pointer-events-auto transition-all
              ${t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                t.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" :
                "bg-white border-zinc-200 text-zinc-800"}`}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
            {t.type === "error" && <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 text-zinc-400 hover:text-zinc-600 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx.toast
}
