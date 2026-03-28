"use client"

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  hint?: string
  size?: "sm" | "md"
}

export function Toggle({ checked, onChange, label, hint, size = "md" }: ToggleProps) {
  const trackW = size === "sm" ? "w-8" : "w-10"
  const trackH = size === "sm" ? "h-4" : "h-5"
  const thumbSz = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"
  const thumbOn = size === "sm" ? "translate-x-4" : "translate-x-5"

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex ${trackW} ${trackH} rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
          ${checked ? "bg-emerald-500" : "bg-zinc-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 ${thumbSz} bg-white rounded-full shadow transition-transform duration-200
            ${checked ? thumbOn : "translate-x-0"}`}
        />
      </button>
      {label && <span className="text-sm text-zinc-500">{label}</span>}
      {hint && <span className="text-xs text-zinc-400">({hint})</span>}
    </label>
  )
}
