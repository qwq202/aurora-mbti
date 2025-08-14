'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  distance?: number
  threshold?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 600,
  direction = 'up',
  distance = 50,
  threshold = 0.1,
  once = true
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasAnimated)) {
          setTimeout(() => {
            setIsVisible(true)
            if (once) setHasAnimated(true)
          }, delay)
        } else if (!once && !entry.isIntersecting) {
          setIsVisible(false)
        }
      },
      { 
        threshold,
        rootMargin: '0px 0px -50px 0px' // 提前一点触发动画
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [delay, threshold, once, hasAnimated])

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0)'
    
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0)`
      case 'down':
        return `translate3d(0, -${distance}px, 0)`
      case 'left':
        return `translate3d(${distance}px, 0, 0)`
      case 'right':
        return `translate3d(-${distance}px, 0, 0)`
      case 'fade':
      default:
        return 'translate3d(0, 0, 0)'
    }
  }

  const baseStyles = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    willChange: 'transform, opacity',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={baseStyles}
    >
      {children}
    </div>
  )
}

// 预设动画类型的便捷组件
export const FadeIn = ({ children, ...props }: Omit<ScrollRevealProps, 'direction'>) => (
  <ScrollReveal direction="fade" {...props}>{children}</ScrollReveal>
)

export const SlideUp = ({ children, ...props }: Omit<ScrollRevealProps, 'direction'>) => (
  <ScrollReveal direction="up" {...props}>{children}</ScrollReveal>
)

export const SlideDown = ({ children, ...props }: Omit<ScrollRevealProps, 'direction'>) => (
  <ScrollReveal direction="down" {...props}>{children}</ScrollReveal>
)

export const SlideLeft = ({ children, ...props }: Omit<ScrollRevealProps, 'direction'>) => (
  <ScrollReveal direction="left" {...props}>{children}</ScrollReveal>
)

export const SlideRight = ({ children, ...props }: Omit<ScrollRevealProps, 'direction'>) => (
  <ScrollReveal direction="right" {...props}>{children}</ScrollReveal>
)