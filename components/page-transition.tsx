"use client"

import { usePathname } from "next/navigation"
import { ReactNode, useEffect, useState, useRef } from "react"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (children !== displayChildren) {
      setIsAnimating(true)
      
      // 
      if (containerRef.current) {
        containerRef.current.style.opacity = '0'
        containerRef.current.style.transform = 'translateY(20px) scale(0.98)'
      }
      
      // 
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        
        // 
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.opacity = '1'
            containerRef.current.style.transform = 'translateY(0px) scale(1)'
          }
          setIsAnimating(false)
        })
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [children, displayChildren])

  return (
    <div
      ref={containerRef}
      className="min-h-screen transition-all duration-300 ease-out"
      style={{
        opacity: 1,
        transform: 'translateY(0px) scale(1)',
        transformOrigin: 'center top'
      }}
    >
      {displayChildren}
    </div>
  )
}

// 
export function PageContent({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number 
}) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-500 ease-out ${className} ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  )
}

// 
export function AnimatedCard({ 
  children, 
  delay = 0,
  className = ""
}: { 
  children: ReactNode
  delay?: number
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-400 ease-out ${className} ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-5 scale-95'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
      }}
    >
      {children}
    </div>
  )
}

// 
export function StaggeredList({ 
  children,
  staggerDelay = 100,
  className = ""
}: {
  children: ReactNode[]
  staggerDelay?: number
  className?: string
}) {
  return (
    <div className={className}>
      {Array.isArray(children) ? children.map((child, index) => (
        <AnimatedCard 
          key={index} 
          delay={index * staggerDelay}
          className="mb-2"
        >
          {child}
        </AnimatedCard>
      )) : children}
    </div>
  )
}
