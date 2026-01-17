'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Wifi, WifiOff, CheckCircle, XCircle, Clock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NetworkStatusProps {
  onRetry?: () => void
  showOfflineMessage?: boolean
}

export function NetworkStatus({ onRetry, showOfflineMessage = true }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showStatus && isOnline) return null

  return (
    <div className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300",
      showStatus ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      <Card className={cn(
        "shadow-lg",
        isOnline ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      )}>
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800"></span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800"></span>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRetry}
                    className="ml-2 text-red-600 hover:text-red-700"
                  >
                    
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface LoadingStateProps {
  isLoading: boolean
  error?: string | null
  onRetry?: () => void
  loadingMessage?: string
  children?: ReactNode
  skeleton?: ReactNode
  showProgress?: boolean
  progress?: number
}

export function LoadingState({
  isLoading,
  error,
  onRetry,
  loadingMessage = "...",
  children,
  skeleton,
  showProgress = false,
  progress = 0
}: LoadingStateProps) {
  if (error) {
    return (
      <Card className="rounded-md border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-red-800 mb-2"></h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    if (skeleton) {
      return <>{skeleton}</>
    }

    return (
      <Card className="rounded-md">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-2">
              <p className="font-medium">{loadingMessage}</p>
              {showProgress && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastNotificationProps {
  type: ToastType
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  onClose?: () => void
  show: boolean
}

export function ToastNotification({
  type,
  title,
  description,
  action,
  duration = 5000,
  onClose,
  show
}: ToastNotificationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }

  const colors = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800"
  }

  const iconColors = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600"
  }

  const Icon = icons[type]

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 transition-all duration-300 transform",
      show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <Card className={cn("shadow-lg max-w-sm", colors[type])}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconColors[type])} />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{title}</div>
              {description && (
                <div className="text-sm opacity-90 mt-1">{description}</div>
              )}
              {action && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={action.onClick}
                  className="mt-2 text-current hover:bg-black/10"
                >
                  {action.label}
                </Button>
              )}
            </div>
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-current hover:bg-black/10 p-1"
              >
                ×
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Card className="rounded-md">
      <CardContent className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            {icon || <Clock className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
          </div>
          {action && (
            <Button onClick={action.onClick} className="mt-4">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}