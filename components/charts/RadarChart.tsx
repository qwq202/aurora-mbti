import React from "react"

// Lightweight SVG radar chart to avoid external deps
// Expect percentages 0-100 for each dimension's "first" side (E/S/T/J)

type DimKey = "EI" | "SN" | "TF" | "JP"

type DimScore = { percentFirst: number; percentSecond: number }

export type RadarScores = Record<DimKey, DimScore>

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

export function RadarChart({
  scores,
  size = 260,
  stroke = "#ec4899", // fuchsia-500
  fill = "rgba(236, 72, 153, 0.15)",
  gridColor = "#e5e7eb", // gray-200
  labelColor = "#6b7280", // gray-500
  compareScores,
  compareStroke = "#10b981", // emerald-500
  compareFill = "rgba(16, 185, 129, 0.12)",
}: {
  scores: RadarScores
  size?: number
  stroke?: string
  fill?: string
  gridColor?: string
  labelColor?: string
  compareScores?: RadarScores
  compareStroke?: string
  compareFill?: string
}) {
  const dims: DimKey[] = ["EI", "SN", "TF", "JP"]
  const padding = 24
  const r = (size - padding * 2) / 2
  const cx = size / 2
  const cy = size / 2

  // angles in radians (start at -90deg and go clockwise)
  const angles = dims.map((_, i) => (-Math.PI / 2) + (i * (2 * Math.PI / dims.length)))

  const values = dims.map((k) => clamp(scores[k]?.percentFirst ?? 0))
  const compareValues = compareScores ? dims.map((k) => clamp(compareScores[k]?.percentFirst ?? 0)) : null

  const points = values.map((v, i) => {
    const ratio = v / 100
    const x = cx + Math.cos(angles[i]) * r * ratio
    const y = cy + Math.sin(angles[i]) * r * ratio
    return `${x},${y}`
  })
  const comparePoints = compareValues?.map((v, i) => {
    const ratio = v / 100
    const x = cx + Math.cos(angles[i]) * r * ratio
    const y = cy + Math.sin(angles[i]) * r * ratio
    return `${x},${y}`
  })

  const axisEnds = angles.map((a) => ({
    x: cx + Math.cos(a) * r,
    y: cy + Math.sin(a) * r,
  }))

  const gridSteps = 4

  return (
    <svg width={size} height={size} role="img" aria-label="MBTI Radar Chart">
      {/* concentric grid */}
      {[...Array(gridSteps)].map((_, i) => {
        const rr = r * ((i + 1) / gridSteps)
        return <circle key={`g-${i}`} cx={cx} cy={cy} r={rr} fill="none" stroke={gridColor} strokeWidth={1} />
      })}

      {/* axes */}
      {axisEnds.map((p, i) => (
        <line
          key={`a-${i}`}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke={gridColor}
          strokeWidth={1}
        />
      ))}

      {/* polygon */}
      <polygon
        points={points.join(" ")}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />

      {/* compare polygon (optional) */}
      {comparePoints && (
        <polygon
          points={comparePoints.join(" ")}
          fill={compareFill}
          stroke={compareStroke}
          strokeWidth={2}
        />
      )}

      {/* axis labels */}
      {dims.map((k, i) => {
        const p = axisEnds[i]
        const label = k === "EI" ? "E/I" : k === "SN" ? "S/N" : k === "TF" ? "T/F" : "J/P"
        const dx = p.x < cx ? -8 : p.x > cx ? 8 : 0
        const dy = p.y < cy ? -6 : p.y > cy ? 14 : 0
        return (
          <text key={`l-${k}`} x={p.x + dx} y={p.y + dy} fontSize={12} textAnchor={dx < 0 ? "end" : dx > 0 ? "start" : "middle"} fill={labelColor}>
            {label}
          </text>
        )
      })}

      {/* center dot */}
      <circle cx={cx} cy={cy} r={2} fill={gridColor} />
    </svg>
  )
}

export default RadarChart
