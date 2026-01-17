'use client'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-muted rounded ${className}`}
      style={{ width, height }}
    />
  )
}

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="h-16 border-b flex items-center justify-between px-6">
        <Skeleton width="120px" height="32px" />
        <div className="flex gap-4">
          <Skeleton width="80px" height="32px" />
          <Skeleton width="80px" height="32px" />
          <Skeleton width="80px" height="32px" />
        </div>
      </div>
      
      {/* Hero Section Skeleton */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <Skeleton width="200px" height="32px" />
            <div className="space-y-2">
              <Skeleton width="100%" height="48px" />
              <Skeleton width="80%" height="48px" />
            </div>
            <Skeleton width="100%" height="24px" />
            <div className="flex gap-3">
              <Skeleton width="150px" height="44px" />
              <Skeleton width="120px" height="44px" />
            </div>
          </div>
          <Skeleton width="100%" height="300px" className="rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function TestPageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 border-b" />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <Skeleton width="200px" height="32px" className="mx-auto mb-4" />
          <Skeleton width="300px" height="20px" className="mx-auto" />
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 border rounded-md">
              <Skeleton width="100%" height="24px" className="mb-4" />
              <Skeleton width="80%" height="16px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}