import { type Answers, type MbtiResult, type Question, type UserProfile } from './mbti-types'
import { type AIAnalysis } from './ai-types'

//  AI - 
export interface RobustAnalysisOptions {
  profile: UserProfile
  answers: Answers
  questions: Question[]
  mbtiResult: MbtiResult
  onProgress?: (message: string) => void
  onSuccess?: (analysis: AIAnalysis, metadata: Record<string, unknown>) => void
  onError?: (error: string, retry: boolean) => void
}

export interface AnalysisEvent {
  type: 'start' | 'progress' | 'success' | 'partial_success' | 'error' | 'parse_error'
  message?: string
  analysis?: AIAnalysis
  metadata?: Record<string, unknown>
  error?: string
  retry?: boolean
  preview?: unknown
}

/**
 *  AI - API
 */
export class RobustAnalysisClient {
  private controller: AbortController | null = null

  constructor() {}

  //  
  async generateAnalysis({
    profile,
    answers,
    questions,
    mbtiResult,
    onProgress,
    onSuccess,
    onError
  }: RobustAnalysisOptions) {
    
    try {
      console.log(`: ${mbtiResult.type}`)
      
      this.controller = new AbortController()

      const response = await fetch('/api/generate-analysis-robust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          answers,
          questions,
          mbtiResult
        }),
        signal: this.controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      const pump = (): Promise<void> => {
        return reader.read().then(({ done, value }) => {
          if (done) {
            return
          }

          buffer += decoder.decode(value, { stream: true })
          
          //  SSE
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as AnalysisEvent
                
                switch (data.type) {
                  case 'start':
                    onProgress?.(data.message || '...')
                    break
                    
                  case 'progress':
                    onProgress?.(data.message || '...')
                    break
                    
                  case 'success':
                    if (data.analysis) {
                      onSuccess?.(data.analysis, data.metadata || {})
                    }
                    return
                    
                  case 'partial_success':
                    if (data.analysis && Object.keys(data.analysis).length > 0) {
                      onSuccess?.(data.analysis, { partial: true })
                    } else {
                      onError?.('', true)
                    }
                    return
                    
                  case 'error':
                  case 'parse_error':
                    onError?.(data.error || data.message || '', data.retry || false)
                    return
                }
              } catch (e) {
                console.warn('SSE:', e)
              }
            }
          }

          return pump()
        })
      }

      return pump()
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onError?.('', false)
      } else {
        onError?.(
          error instanceof Error ? error.message : '',
          true
        )
      }
    }
  }

  //  
  cancel() {
    if (this.controller) {
      this.controller.abort()
      this.controller = null
    }
  }
}

//    
export function createRobustAnalysisClient() {
  return new RobustAnalysisClient()
}
