'use client'

import { useEffect } from 'react'

interface PerformanceMetrics {
  fcp?: number  // First Contentful Paint
  lcp?: number  // Largest Contentful Paint
  fid?: number  // First Input Delay
  cls?: number  // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return
    }

    const observer = new PerformanceObserver((list) => {
      const metrics: PerformanceMetrics = {}
      
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime
            }
            break
          case 'largest-contentful-paint':
            metrics.lcp = entry.startTime
            break
          case 'first-input':
            metrics.fid = entry.processingStart - entry.startTime
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + (entry as any).value
            }
            break
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming
            metrics.ttfb = navEntry.responseStart - navEntry.requestStart
            break
        }
      }

      // 发送性能指标（这里只是记录到控制台，实际应用中可发送到分析服务）
      if (Object.keys(metrics).length > 0) {
        console.log('Performance Metrics:', metrics)
        
        // 存储到 localStorage 用于调试
        try {
          const stored = JSON.parse(localStorage.getItem('performance-metrics') || '[]')
          stored.push({ timestamp: Date.now(), ...metrics })
          // 只保留最近50条记录
          if (stored.length > 50) stored.splice(0, stored.length - 50)
          localStorage.setItem('performance-metrics', JSON.stringify(stored))
        } catch {}
      }
    })

    // 观察各种性能指标
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] })
    } catch (e) {
      console.warn('Performance Observer not supported:', e)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return null // 这个组件不渲染任何内容
}

// Web Vitals 监控钩子
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // 监控页面卸载时间
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const metrics = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (metrics) {
          console.log('Page Performance Summary:', {
            domContentLoaded: metrics.domContentLoadedEventEnd - metrics.domContentLoadedEventStart,
            loadComplete: metrics.loadEventEnd - metrics.loadEventStart,
            totalTime: metrics.loadEventEnd - metrics.navigationStart,
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}