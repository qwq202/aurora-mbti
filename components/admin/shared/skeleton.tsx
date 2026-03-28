export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-100 rounded-md ${className}`} />
  )
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm space-y-3">
      <SkeletonLine className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  )
}

export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="animate-pulse bg-zinc-100 rounded h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody className="divide-y divide-zinc-50">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
