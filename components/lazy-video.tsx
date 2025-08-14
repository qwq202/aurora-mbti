'use client'

import { useEffect, useRef, useState } from 'react'

interface LazyVideoProps {
  src: string
  poster?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  children?: React.ReactNode
}

export function LazyVideo({ 
  src, 
  poster, 
  className, 
  autoPlay = false,
  muted = true,
  loop = false,
  playsInline = true,
  preload = 'metadata',
  children 
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' } // 提前50px开始加载
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const handleLoadedData = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  if (hasError && poster) {
    return (
      <div className="relative w-full h-full">
        <img
          src={poster}
          alt="视频预览图"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={className}
        src={isIntersecting ? src : undefined}
        poster={poster}
        autoPlay={autoPlay && isIntersecting}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={isIntersecting ? preload : 'none'}
        onLoadedData={handleLoadedData}
        onError={handleError}
      >
        {children}
      </video>
      
      {/* 加载状态指示器 */}
      {isIntersecting && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-2xl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}