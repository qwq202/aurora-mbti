'use client'

import { useState, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SwipeGestureProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function SwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  children,
  className,
  disabled = false
}: SwipeGestureProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled) return
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchEnd = () => {
    if (disabled || !touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > threshold
    const isRightSwipe = distanceX < -threshold
    const isUpSwipe = distanceY > threshold
    const isDownSwipe = distanceY < -threshold

    // 
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // 
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft()
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight()
      }
    } else {
      // 
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp()
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown()
      }
    }
  }

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}

interface MobileOptimizedLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  bottomNavContent?: ReactNode
}

export function MobileOptimizedLayout({ 
  children, 
  showBottomNav = false, 
  bottomNavContent 
}: MobileOptimizedLayoutProps) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      // 
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.screen.height
      setIsKeyboardOpen(windowHeight - viewportHeight > 150)
    }

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      return () => window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/*  */}
      <div className={cn(
        "flex-1 pb-safe-bottom",
        showBottomNav && !isKeyboardOpen && "pb-20"
      )}>
        {children}
      </div>

      {/*  */}
      {showBottomNav && !isKeyboardOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border z-50 pb-safe-bottom">
          <div className="px-4 py-3">
            {bottomNavContent}
          </div>
        </div>
      )}
    </div>
  )
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  refreshThreshold?: number
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  refreshThreshold = 80 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY) {
      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - startY)
      setPullDistance(distance)
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > refreshThreshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
    setStartY(0)
  }

  const pullProgress = Math.min(pullDistance / refreshThreshold, 1)

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/*  */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm transition-all duration-200 ease-out"
          style={{ 
            height: Math.min(pullDistance, refreshThreshold),
            transform: `translateY(-${Math.min(pullDistance, refreshThreshold)}px)`
          }}
        >
          <div className={cn(
            "flex items-center gap-2 text-sm transition-all duration-200",
            pullProgress >= 1 ? "text-green-600" : "text-muted-foreground"
          )}>
            <div 
              className={cn(
                "w-5 h-5 border-2 rounded-full transition-all duration-200",
                isRefreshing 
                  ? "border-green-500 border-t-transparent animate-spin" 
                  : pullProgress >= 1
                    ? "border-green-500"
                    : "border-muted-foreground"
              )}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`
              }}
            />
            <span>
              {isRefreshing 
                ? "..." 
                : pullProgress >= 1 
                  ? "" 
                  : ""}
            </span>
          </div>
        </div>
      )}
      
      <div style={{ transform: `translateY(${Math.min(pullDistance, refreshThreshold)}px)` }}>
        {children}
      </div>
    </div>
  )
}