'use client'

import { useEffect } from 'react'
import { PERFORMANCE_METRICS_KEY } from '@/lib/constants'

interface PerformanceMetrics {
  fcp?: number  // First Contentful Paint
  lcp?: number  // Largest Contentful Paint
  fid?: number  // First Input Delay
  cls?: number  // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

type StoredPerformanceMetric = PerformanceMetrics & { timestamp: number }

type LayoutShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean }

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
            const firstInputEntry = entry as PerformanceEventTiming
            if (typeof firstInputEntry.processingStart === 'number') {
              metrics.fid = firstInputEntry.processingStart - entry.startTime
            }
            break
          case 'layout-shift':
            const layoutShiftEntry = entry as LayoutShiftEntry
            if (!layoutShiftEntry.hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + layoutShiftEntry.value
            }
            break
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming
            metrics.ttfb = navEntry.responseStart - navEntry.requestStart
            break
        }
      }

      // 
      if (Object.keys(metrics).length > 0) {
        console.log('Performance Metrics:', metrics)
        
        //  localStorage 
        try {
          const stored = JSON.parse(localStorage.getItem(PERFORMANCE_METRICS_KEY) || '[]') as StoredPerformanceMetric[]
          stored.push({ timestamp: Date.now(), ...metrics })
          // 50
          if (stored.length > 50) stored.splice(0, stored.length - 50)
          localStorage.setItem(PERFORMANCE_METRICS_KEY, JSON.stringify(stored))
        } catch (error) {
          console.warn(':', error)
        }
      }
    })

    // 
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] })
    } catch (e) {
      console.warn('Performance Observer not supported:', e)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return null // 
}

// Web Vitals 
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // 
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const metrics = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (metrics) {
          console.log('Page Performance Summary:', {
            domContentLoaded: metrics.domContentLoadedEventEnd - metrics.domContentLoadedEventStart,
            loadComplete: metrics.loadEventEnd - metrics.loadEventStart,
            totalTime: metrics.loadEventEnd - metrics.fetchStart,
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}
