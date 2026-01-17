"use client"

import { useState, useEffect } from "react"

export function ProjectIterationDays() {
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const startDate = new Date("2025-11-17T00:00:00+08:00")
    
    const calculateTime = () => {
      const now = new Date()
      const diff = now.getTime() - startDate.getTime()
      
      const totalSeconds = Math.floor(diff / 1000)
      const totalMinutes = Math.floor(totalSeconds / 60)
      const totalHours = Math.floor(totalMinutes / 60)
      const totalDays = Math.floor(totalHours / 24)
      
      setDays(totalDays)
      setHours(totalHours % 24)
      setMinutes(totalMinutes % 60)
      setSeconds(totalSeconds % 60)
    }
    
    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-xs font-bold uppercase tracking-widest text-zinc-300">
      <div>项目已迭代</div>
      <div className="text-zinc-200 mt-1">
        {days}天 {hours}时 {minutes}分 {seconds}秒
      </div>
    </div>
  )
}
