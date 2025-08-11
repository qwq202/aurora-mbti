"use client"

import * as React from "react"
import { AlertCircle, CheckCircle, X } from "lucide-react"
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
  variant?: "default" | "destructive"
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "确定",
  cancelText = "取消",
  variant = "default",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {variant === "destructive" ? (
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
            <span>{title}</span>
          </DialogTitle>
          {description && (
            <DialogDescription className="text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex-row gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1 rounded-xl"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "flex-1 rounded-xl",
              variant === "destructive"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
            )}
          >
            {confirmText}
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
