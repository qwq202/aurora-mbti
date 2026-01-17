'use client'

import { useEffect, useCallback, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  disabled?: boolean
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // /
    if (event.key === '?' && event.shiftKey) {
      event.preventDefault()
      setShowHelp(prev => !prev)
      return
    }

    // 
    if (event.key === 'Escape' && showHelp) {
      setShowHelp(false)
      return
    }

    // 
    const shortcut = shortcuts.find(s => {
      if (s.disabled) return false
      
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase()
      if (!keyMatch) return false

      const modifiers = s.modifiers || []
      const ctrlMatch = modifiers.includes('ctrl') ? event.ctrlKey : !event.ctrlKey
      const altMatch = modifiers.includes('alt') ? event.altKey : !event.altKey
      const shiftMatch = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey
      const metaMatch = modifiers.includes('meta') ? event.metaKey : !event.metaKey

      return ctrlMatch && altMatch && shiftMatch && metaMatch
    })

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }, [shortcuts, enabled, showHelp])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  return { showHelp, setShowHelp }
}

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[]
  show: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ shortcuts, show, onClose }: KeyboardShortcutsHelpProps) {
  if (!show) return null

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = []
    if (shortcut.modifiers?.includes('ctrl')) parts.push('Ctrl')
    if (shortcut.modifiers?.includes('alt')) parts.push('Alt')
    if (shortcut.modifiers?.includes('shift')) parts.push('Shift')
    if (shortcut.modifiers?.includes('meta')) parts.push('Cmd')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg"></h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            {shortcuts.filter(s => !s.disabled).map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
            
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">/</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  Shift + ?
                </kbd>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 
export const TEST_PAGE_SHORTCUTS = {
  nextQuestion: (onNext: () => void, disabled = false): KeyboardShortcut => ({
    key: 'ArrowRight',
    description: '',
    action: onNext,
    disabled
  }),
  
  previousQuestion: (onPrev: () => void, disabled = false): KeyboardShortcut => ({
    key: 'ArrowLeft', 
    description: '',
    action: onPrev,
    disabled
  }),
  
  selectAnswer1: (onSelect: () => void, disabled = false): KeyboardShortcut => ({
    key: '1',
    description: '""',
    action: onSelect,
    disabled
  }),
  
  selectAnswer2: (onSelect: () => void, disabled = false): KeyboardShortcut => ({
    key: '2',
    description: '""',
    action: onSelect,
    disabled
  }),
  
  selectAnswer3: (onSelect: () => void, disabled = false): KeyboardShortcut => ({
    key: '3',
    description: '""',
    action: onSelect,
    disabled
  }),
  
  selectAnswer4: (onSelect: () => void, disabled = false): KeyboardShortcut => ({
    key: '4',
    description: '""',
    action: onSelect,
    disabled
  }),
  
  selectAnswer5: (onSelect: () => void, disabled = false): KeyboardShortcut => ({
    key: '5',
    description: '""',
    action: onSelect,
    disabled
  }),
  
  saveProgress: (onSave: () => void, disabled = false): KeyboardShortcut => ({
    key: 's',
    description: '',
    action: onSave,
    modifiers: ['ctrl'],
    disabled
  }),
  
  submitTest: (onSubmit: () => void, disabled = false): KeyboardShortcut => ({
    key: 'Enter',
    description: '',
    action: onSubmit,
    modifiers: ['ctrl'],
    disabled
  })
}

interface TestPageKeyboardProps {
  onNext: () => void
  onPrevious: () => void
  onSelectAnswer: (value: number) => void
  onSave: () => void
  onSubmit: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  canSubmit: boolean
  enabled?: boolean
}

export function TestPageKeyboard({
  onNext,
  onPrevious, 
  onSelectAnswer,
  onSave,
  onSubmit,
  canGoNext,
  canGoPrevious,
  canSubmit,
  enabled = true
}: TestPageKeyboardProps) {
  const shortcuts = [
    TEST_PAGE_SHORTCUTS.nextQuestion(onNext, !canGoNext),
    TEST_PAGE_SHORTCUTS.previousQuestion(onPrevious, !canGoPrevious),
    TEST_PAGE_SHORTCUTS.selectAnswer1(() => onSelectAnswer(1)),
    TEST_PAGE_SHORTCUTS.selectAnswer2(() => onSelectAnswer(2)),
    TEST_PAGE_SHORTCUTS.selectAnswer3(() => onSelectAnswer(3)),
    TEST_PAGE_SHORTCUTS.selectAnswer4(() => onSelectAnswer(4)),
    TEST_PAGE_SHORTCUTS.selectAnswer5(() => onSelectAnswer(5)),
    TEST_PAGE_SHORTCUTS.saveProgress(onSave),
    TEST_PAGE_SHORTCUTS.submitTest(onSubmit, !canSubmit)
  ]

  const { showHelp, setShowHelp } = useKeyboardShortcuts({ shortcuts, enabled })

  return (
    <>
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        show={showHelp}
        onClose={() => setShowHelp(false)}
      />
      
      {/*  */}
      {enabled && (
        <div className="fixed bottom-4 left-4 text-xs text-muted-foreground">
           <kbd className="px-1 py-0.5 bg-muted rounded">Shift + ?</kbd> 
        </div>
      )}
    </>
  )
}