import { type Question, type UserProfile } from './mbti-types'

//  AI - SSE
export interface RobustGenerationOptions {
  profileData: UserProfile
  questionCount: number
  existingQuestions?: Array<Pick<Question, 'text' | 'dimension'>>
  batchNumber?: number
  onProgress?: (current: number, total: number, message: string) => void
  onQuestionPreview?: (question: Question) => void
  onSuccess?: (questions: Question[], metadata: { count: number; batches: number }) => void
  onError?: (error: string, retry: boolean) => void
}

export interface GenerationEvent {
  type: 'start' | 'progress' | 'success' | 'partial_success' | 'error' | 'parse_error'
  message?: string
  progress?: { current: number; total: number }
  questions?: Question[]
  metadata?: { count?: number; batches?: number }
  error?: string
  retry?: boolean
}

type GenerationSSEEvent = {
  type: 'start' | 'progress' | 'preview' | 'success' | 'error'
  message?: string
  progress?: { current?: number; total?: number }
  increment?: Question[]
  questions?: Question[]
}

/**
 *  AI - API
 */
export class RobustAIClient {
  private controller: AbortController | null = null

  constructor() {}

  //  
  async generateQuestions({
    questionCount,
    profile,
    onProgress,
    onPreview,
    onSuccess,
    onError,
    existingQuestions = []
  }: {
    questionCount: number
    profile: UserProfile
    onProgress?: (current: number, total: number, message: string) => void
    onPreview?: (questions: Question[]) => void
    onSuccess?: (questions: Question[], metadata: { count: number; batches: number }) => void
    onError?: (message: string, retry: boolean) => void
    existingQuestions?: Array<Pick<Question, 'text' | 'dimension'>>
  }) {
    //  60
    const batchSize = 60
    const batches = Math.ceil(questionCount / batchSize)
    const allQuestions: Question[] = []
    
    try {
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const currentBatchSize = Math.min(batchSize, questionCount - allQuestions.length)
        const currentExisting = [...existingQuestions, ...allQuestions]
        
        console.log(`API${batchIndex + 1}/${batches}: ${currentBatchSize}`)
        
        const batchQuestions = await this.generateSingleBatch({
          questionCount: currentBatchSize,
          profile,
          existingQuestions: currentExisting,
          batchIndex,
          onProgress: (current, total, message) => {
            //  
            const globalCurrent = allQuestions.length + current
            onProgress?.(globalCurrent, questionCount, `${batchIndex + 1}/${batches}: ${message}`)
          },
          onPreview
        })
        
        //  
        const existingTexts = new Set(allQuestions.map(q => q.text))
        const uniqueQuestions = batchQuestions.filter(q => !existingTexts.has(q.text))
        allQuestions.push(...uniqueQuestions)
        
        console.log(`${batchIndex + 1}: ${allQuestions.length}/${questionCount}`)
      }
      
      //  
      onSuccess?.(allQuestions, { count: allQuestions.length, batches })
      
    } catch (error) {
      console.error(':', error)
      onError?.(
        error instanceof Error ? error.message : '',
        true
      )
    }
  }

  //  
  private async generateSingleBatch({
    questionCount,
    profile,
    existingQuestions,
    batchIndex,
    onProgress,
    onPreview
  }: {
    questionCount: number
    profile: UserProfile
    existingQuestions: Array<Pick<Question, 'text' | 'dimension'>>
    batchIndex: number
    onProgress?: (current: number, total: number, message: string) => void
    onPreview?: (questions: Question[]) => void
  }): Promise<Question[]> {
    return new Promise((resolve, reject) => {
      this.controller = new AbortController()
      let batchQuestions: Question[] = []

      fetch('/api/generate-questions-stream-robust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionCount,
          profile,
          existingQuestions,
          batchIndex
        }),
        signal: this.controller.signal
      })
      .then(response => {
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
              resolve(batchQuestions)
              return
            }

            buffer += decoder.decode(value, { stream: true })
            
            //  SSE
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6)) as GenerationSSEEvent
                  
                  switch (data.type) {
                    case 'start':
                      onProgress?.(0, questionCount, data.message || '...')
                      break
                      
                    case 'progress':
                      if (data.progress) {
                        onProgress?.(
                          data.progress.current || 0,
                          data.progress.total || questionCount,
                          data.message || `${data.progress.current}...`
                        )
                      }
                      break
                      
                    case 'preview':
                      if (data.increment && data.increment.length > 0) {
                        batchQuestions.push(...data.increment)
                        onPreview?.(batchQuestions)
                      }
                      break
                      
                    case 'success':
                      if (data.questions) {
                        batchQuestions = data.questions
                      }
                      resolve(batchQuestions)
                      return
                      
                    case 'error':
                      reject(new Error(data.message || ''))
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
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          reject(new Error(''))
        } else {
          reject(error)
        }
      })
    })
  }

  //  
  cancel() {
    if (this.controller) {
      this.controller.abort()
      this.controller = null
    }
  }
}

//  NDJSON  
export function createRobustAIClient() {
  return new RobustAIClient()
}
