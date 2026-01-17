"use client"

import * as React from "react"
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning" | "info"
  singleAction?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "",
  cancelText = "",
  variant = "default",
  singleAction = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const t = useTranslations('common')

  // Get icon and colors based on variant
  const getVariantConfig = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          iconBg: "bg-rose-50",
          iconColor: "text-rose-500",
          buttonBg: "bg-rose-500 hover:bg-rose-600",
        }
      case "warning":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-500",
          buttonBg: "bg-amber-500 hover:bg-amber-600",
        }
      case "info":
        return {
          icon: <Info className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-500",
          buttonBg: "bg-blue-500 hover:bg-blue-600",
        }
      default:
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          iconBg: "bg-zinc-50",
          iconColor: "text-zinc-900",
          buttonBg: "bg-zinc-900 hover:bg-black",
        }
    }
  }

  const variantConfig = getVariantConfig()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-md border-zinc-100 bg-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center",
              variantConfig.iconBg,
              variantConfig.iconColor
            )}>
              {variantConfig.icon}
            </div>
            <span className="text-xl font-bold tracking-tight">{title}</span>
          </DialogTitle>
          {description && (
            <DialogDescription className="text-zinc-500 font-medium leading-relaxed py-4">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className={cn(
          "flex flex-col sm:flex-row gap-3",
          singleAction ? "pt-6 border-t border-zinc-50" : "mt-8"
        )}>
          {!singleAction && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="h-12 flex-1 rounded-md border-zinc-100 text-zinc-400 font-bold uppercase tracking-widest text-[10px]"
            >
              {cancelText || t('cancel')}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "h-12 rounded-md font-bold uppercase tracking-widest text-[10px] text-white",
              singleAction ? "w-full" : "flex-1",
              variantConfig.buttonBg
            )}
          >
            {confirmText || (singleAction ? t('continue') : t('confirm'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for programmatic usage
export function useConfirm() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, "open" | "onOpenChange"> | null>(null)
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback((props: Omit<ConfirmDialogProps, "open" | "onOpenChange" | "onConfirm" | "onCancel">) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...props,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
      setIsOpen(true)
      resolveRef.current = resolve
    })
  }, [])

  const ConfirmDialogComponent = React.useCallback(() => {
    if (!config) return null

    return (
      <ConfirmDialog
        {...config}
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open && resolveRef.current) {
            resolveRef.current(false)
          }
        }}
      />
    )
  }, [config, isOpen])

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}
