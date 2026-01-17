'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Save, RotateCcw, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Answers } from "@/lib/mbti"

interface TestProgressBarProps {
  current: number
  total: number
  answeredCount: number
  onSave?: () => void
  onReset?: () => void
  showSaveButton?: boolean
  testMode?: string
  estimatedTimeLeft?: number
}

export function TestProgressBar({ 
  current, 
  total, 
  answeredCount,
  onSave,
  onReset,
  showSaveButton = true,
  testMode = "standard",
  estimatedTimeLeft
}: TestProgressBarProps) {
  const [showSaved, setShowSaved] = useState(false)
  const progress = Math.round((current / total) * 100)
  const completionRate = Math.round((answeredCount / total) * 100)
  
  const handleSave = () => {
    onSave?.()
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}${remainingSeconds > 0 ? remainingSeconds + '' : ''}`
  }

  return (
    <Card className="rounded-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">
              {current + 1} / {total}
            </div>
            <div className="text-xs text-muted-foreground">
              ({testMode.startsWith('ai') ? 'AI' : ''})
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {estimatedTimeLeft && (
              <>
                <Clock className="w-4 h-4" />
                <span>: {formatTime(estimatedTimeLeft)}</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/*  -  */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span></span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 rounded-md" />
          </div>

          {/*  -  */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground"></span>
              <span className="text-muted-foreground">{answeredCount}/{total} ({completionRate}%)</span>
            </div>
            <Progress 
              value={completionRate} 
              className="h-1.5 opacity-60 rounded-md" 
            />
          </div>
        </div>

        {/*  */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="flex gap-2">
            {showSaveButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className={cn(
                  "rounded-md transition-all",
                  showSaved && "border-green-500 text-green-600"
                )}
              >
                {showSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="rounded-md"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {answeredCount > 0 && (
              <span> {Math.round((answeredCount / total) * 100)}%</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface QuestionNavigationProps {
  current: number
  total: number
  answers: Answers
  questions: Array<{ id: string }>
  onJumpTo: (index: number) => void
  disabled?: boolean
}

export function QuestionNavigation({ 
  current, 
  total, 
  answers, 
  questions,
  onJumpTo,
  disabled = false
}: QuestionNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="rounded-md"
      >
         ({current + 1}/{total})
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-80 z-50 max-h-64 overflow-y-auto">
          <CardContent className="p-4">
            <div className="grid grid-cols-8 gap-1">
              {questions.map((question, index) => {
                const isAnswered = !!answers[question.id]
                const isCurrent = index === current
                
                return (
                  <button
                    key={question.id}
                    onClick={() => {
                      onJumpTo(index)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-8 h-8 rounded text-xs font-medium transition-all",
                      isCurrent && "ring-2 ring-primary ring-offset-2",
                      isAnswered 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            
            <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-100" />
                <span></span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted" />
                <span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
