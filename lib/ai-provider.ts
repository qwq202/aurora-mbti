import { AI_PROVIDER_MAP, type AIProviderId, type AIProviderSpec } from './ai-provider-defs'
import { type AIConfigInput } from './ai-config'
import { readStoredAIConfig } from './ai-settings-store'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AIResponseFormat =
  | { type: 'json_schema'; json_schema: Record<string, unknown> }
  | { type: 'json_object' }

export type AICompletionOptions = {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  responseFormat?: AIResponseFormat
  timeoutMs?: number
}

export type AIStreamChunk = {
  text?: string
  functionArgs?: string
}

export type AIResolvedConfig = {
  provider: AIProviderId
  spec: AIProviderSpec
  baseUrl: string
  model: string
  apiKey?: string
  openrouterSiteUrl?: string
  openrouterAppName?: string
  anthropicVersion?: string
}


function joinUrl(baseUrl: string, path: string) {
  const left = baseUrl.replace(/\/+$/, '')
  const right = path.startsWith('/') ? path : `/${path}`
  return `${left}${right}`
}

function getProviderSpec(provider?: string) {
  if (provider && provider in AI_PROVIDER_MAP) {
    return AI_PROVIDER_MAP[provider as AIProviderId]
  }
  return AI_PROVIDER_MAP.openai
}

function normalizeBaseUrl(provider: AIProviderId, baseUrl: string, defaultBaseUrl?: string) {
  if (!baseUrl) return baseUrl

  try {
    const parsed = new URL(baseUrl)
    const pathname = parsed.pathname.replace(/\/+$/, '')
    const defaultPath = (() => {
      if (provider === 'newapi') return '/v1'
      if (!defaultBaseUrl) return ''
      try {
        const defaultUrl = new URL(defaultBaseUrl)
        const path = defaultUrl.pathname.replace(/\/+$/, '')
        return path && path !== '/' ? path : ''
      } catch {
        return ''
      }
    })()

    if (!pathname || pathname === '') {
      if (defaultPath) {
        parsed.pathname = defaultPath
      }
      return parsed.toString().replace(/\/+$/, '')
    }

    if (provider === 'newapi' && !pathname.endsWith('/v1')) {
      parsed.pathname = `${pathname}/v1`
    }

    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return baseUrl
  }
}

// AI 配置仅从管理面板（data/ai-config.json）读取，不再支持环境变量
export function resolveAIConfig(input?: AIConfigInput): AIResolvedConfig {
  const storedConfig = readStoredAIConfig()
  const provider = (input?.provider || storedConfig?.provider || 'openai') as AIProviderId
  const spec = getProviderSpec(provider)

  const rawBaseUrl = (input?.baseUrl || storedConfig?.baseUrl || spec.defaultBaseUrl || '').replace(/\/+$/, '')
  const baseUrl = normalizeBaseUrl(spec.id, rawBaseUrl, spec.defaultBaseUrl)
  const model = input?.model || storedConfig?.model || spec.defaultModel || ''
  const apiKey = input?.apiKey || storedConfig?.apiKey
  const openrouterSiteUrl = input?.openrouterSiteUrl || storedConfig?.openrouterSiteUrl
  const openrouterAppName = input?.openrouterAppName || storedConfig?.openrouterAppName
  const anthropicVersion = input?.anthropicVersion || storedConfig?.anthropicVersion || '2023-06-01'

  return {
    provider: spec.id,
    spec,
    baseUrl,
    model,
    apiKey,
    openrouterSiteUrl,
    openrouterAppName,
    anthropicVersion,
  }
}

export function assertAIConfig(config: AIResolvedConfig) {
  if (!config.baseUrl) {
    throw new Error('AI_BASE_URL')
  }
  if (!config.model) {
    throw new Error('AI_MODEL')
  }
  if (config.spec.requiresApiKey && !config.apiKey) {
    throw new Error('AI_API_KEY')
  }
}

function splitSystemMessages(messages: ChatMessage[]) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
  const chat = messages.filter((m) => m.role !== 'system')
  return { system, chat }
}

function buildOpenAIChatBody(options: AICompletionOptions, config: AIResolvedConfig, stream: boolean) {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    stream,
  }
  if (options.maxTokens) body.max_tokens = options.maxTokens

  if (options.responseFormat && config.spec.supportsJsonSchema) {
    body.response_format = options.responseFormat
  }
  return body
}

function buildOpenAIResponsesBody(options: AICompletionOptions, config: AIResolvedConfig, stream: boolean) {
  const { system, chat } = splitSystemMessages(options.messages)
  const input = chat.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: [{ type: 'input_text', text: m.content }],
  }))

  const body: Record<string, unknown> = {
    model: config.model,
    input,
    stream,
    temperature: options.temperature ?? 0.7,
  }
  if (system) body.instructions = system
  if (options.maxTokens) body.max_output_tokens = options.maxTokens
  if (options.responseFormat && config.spec.supportsJsonSchema) {
    body.response_format = options.responseFormat
  }
  return body
}

function buildGeminiBody(options: AICompletionOptions) {
  const { system, chat } = splitSystemMessages(options.messages)
  const contents = chat.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 1024,
    },
  }
  if (system) {
    body.system_instruction = { parts: [{ text: system }] }
  }
  return body
}

function buildAnthropicBody(options: AICompletionOptions, config: AIResolvedConfig, stream: boolean) {
  const { system, chat } = splitSystemMessages(options.messages)
  const body: Record<string, unknown> = {
    model: config.model,
    messages: chat.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.7,
    stream,
  }
  if (system) body.system = system
  return body
}

function buildOllamaBody(options: AICompletionOptions, config: AIResolvedConfig, stream: boolean) {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: options.messages,
    stream,
    options: {},
  }
  if (typeof options.temperature === 'number') {
    ;(body.options as Record<string, unknown>).temperature = options.temperature
  }
  if (typeof options.maxTokens === 'number') {
    ;(body.options as Record<string, unknown>).num_predict = options.maxTokens
  }
  return body
}

async function ensureResponseOk(response: Response) {
  if (response.ok) return
  const text = await response.text().catch(() => '')
  throw new Error(`${response.status} ${response.statusText} ${text}`.trim())
}

async function* readSSEData(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''
    for (const part of parts) {
      const lines = part.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice('data:'.length).trim()
        if (data) yield data
      }
    }
  }
}

async function* readJsonLines(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed) yield trimmed
    }
  }
}

export async function* streamAIText(config: AIResolvedConfig, options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
  const timeoutMs = options.timeoutMs ?? 60000
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  }

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`
  }

  if (config.provider === 'openrouter') {
    if (config.openrouterSiteUrl) headers['HTTP-Referer'] = config.openrouterSiteUrl
    if (config.openrouterAppName) headers['X-Title'] = config.openrouterAppName
  }

  if (config.spec.type === 'anthropic') {
    if (config.apiKey) delete headers.Authorization
    headers['x-api-key'] = config.apiKey || ''
    headers['anthropic-version'] = config.anthropicVersion || '2023-06-01'
  }

  if (config.spec.type === 'gemini') {
    delete headers.Authorization
    if (config.apiKey) {
      headers['x-goog-api-key'] = config.apiKey
    }
  }

  let url = ''
  let body: Record<string, unknown> = {}

  if (config.spec.type === 'openai-chat') {
    url = joinUrl(config.baseUrl, config.spec.chatPath || '/v1/chat/completions')
    body = buildOpenAIChatBody(options, config, true)
  } else if (config.spec.type === 'openai-responses') {
    url = joinUrl(config.baseUrl, config.spec.responsesPath || '/v1/responses')
    body = buildOpenAIResponsesBody(options, config, true)
  } else if (config.spec.type === 'gemini') {
    const endpoint = joinUrl(config.baseUrl, `/models/${encodeURIComponent(config.model)}:streamGenerateContent`)
    const urlObj = new URL(endpoint)
    urlObj.searchParams.set('alt', 'sse')
    url = urlObj.toString()
    body = buildGeminiBody(options)
  } else if (config.spec.type === 'anthropic') {
    url = joinUrl(config.baseUrl, config.spec.chatPath || '/v1/messages')
    body = buildAnthropicBody(options, config, true)
  } else if (config.spec.type === 'ollama') {
    url = joinUrl(config.baseUrl, config.spec.chatPath || '/api/chat')
    body = buildOllamaBody(options, config, true)
    headers.Accept = 'application/json'
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })

  await ensureResponseOk(response)

  const reader = response.body?.getReader()
  if (!reader) return

  if (config.spec.type === 'ollama') {
    for await (const line of readJsonLines(reader)) {
      try {
        const payload = JSON.parse(line) as { message?: { content?: string }; done?: boolean }
        if (payload.message?.content) {
          yield { text: payload.message.content }
        }
        if (payload.done) break
      } catch {
        continue
      }
    }
    return
  }

  for await (const data of readSSEData(reader)) {
    if (data === '[DONE]') break
    try {
      const payload = JSON.parse(data) as Record<string, unknown>
      if (config.spec.type === 'openai-chat') {
        const choice = (payload.choices as Array<Record<string, unknown>> | undefined)?.[0]
        const delta = (choice?.delta as Record<string, unknown> | undefined) || {}
        const content = typeof delta.content === 'string' ? delta.content : ''
        const functionArgs = (delta.function_call as Record<string, unknown> | undefined)?.arguments
        if (content) yield { text: content }
        if (typeof functionArgs === 'string' && functionArgs) yield { functionArgs }
      } else if (config.spec.type === 'openai-responses') {
        const eventType = typeof payload.type === 'string' ? payload.type : ''
        if (eventType.includes('output_text') && typeof payload.delta === 'string') {
          yield { text: payload.delta }
        }
        if (eventType === 'response.output_text.done' && typeof payload.text === 'string') {
          yield { text: payload.text }
        }
      } else if (config.spec.type === 'gemini') {
        const candidates = payload.candidates as Array<Record<string, unknown>> | undefined
        const parts = candidates?.[0]?.content as { parts?: Array<Record<string, unknown>> }
        const text = parts?.parts?.[0]?.text
        if (typeof text === 'string' && text) yield { text }
      } else if (config.spec.type === 'anthropic') {
        const eventType = typeof payload.type === 'string' ? payload.type : ''
        if (eventType === 'content_block_delta') {
          const delta = payload.delta as Record<string, unknown> | undefined
          const text = delta?.text
          if (typeof text === 'string' && text) yield { text }
        }
      }
    } catch {
      continue
    }
  }
}

export async function completeAIText(config: AIResolvedConfig, options: AICompletionOptions): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 60000
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`
  }

  if (config.provider === 'openrouter') {
    if (config.openrouterSiteUrl) headers['HTTP-Referer'] = config.openrouterSiteUrl
    if (config.openrouterAppName) headers['X-Title'] = config.openrouterAppName
  }

  if (config.spec.type === 'anthropic') {
    if (config.apiKey) delete headers.Authorization
    headers['x-api-key'] = config.apiKey || ''
    headers['anthropic-version'] = config.anthropicVersion || '2023-06-01'
  }

  if (config.spec.type === 'gemini') {
    delete headers.Authorization
    if (config.apiKey) {
      headers['x-goog-api-key'] = config.apiKey
    }
  }

  let url = ''
  let body: Record<string, unknown> = {}

  if (config.spec.type === 'openai-chat') {
    url = joinUrl(config.baseUrl, config.spec.chatPath || '/v1/chat/completions')
    body = buildOpenAIChatBody(options, config, false)
  } else if (config.spec.type === 'openai-responses') {
    url = joinUrl(config.baseUrl, config.spec.responsesPath || '/v1/responses')
    body = buildOpenAIResponsesBody(options, config, false)
  } else if (config.spec.type === 'gemini') {
    const endpoint = joinUrl(config.baseUrl, `/models/${encodeURIComponent(config.model)}:generateContent`)
    const urlObj = new URL(endpoint)
    url = urlObj.toString()
    body = buildGeminiBody(options)
  } else if (config.spec.type === 'anthropic') {
    url = joinUrl(config.baseUrl, config.spec.chatPath || '/v1/messages')
    body = buildAnthropicBody(options, config, false)
  } else if (config.spec.type === 'ollama') {
    url = joinUrl(config.baseUrl, config.spec.chatPath || '/api/chat')
    body = buildOllamaBody(options, config, false)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })

  await ensureResponseOk(response)

  const payload = (await response.json()) as Record<string, unknown>

  if (config.spec.type === 'openai-chat') {
    const message = (payload.choices as Array<Record<string, unknown>> | undefined)?.[0]?.message as Record<string, unknown> | undefined
    return typeof message?.content === 'string' ? message.content : ''
  }

  if (config.spec.type === 'openai-responses') {
    if (typeof payload.output_text === 'string') return payload.output_text
    const output = payload.output as Array<Record<string, unknown>> | undefined
    const texts = output
      ?.flatMap((item) => (item.content as Array<Record<string, unknown>> | undefined) || [])
      .filter((c) => c.type === 'output_text')
      .map((c) => (typeof c.text === 'string' ? c.text : ''))
      .filter(Boolean)
    return texts?.join('') || ''
  }

  if (config.spec.type === 'gemini') {
    const candidates = payload.candidates as Array<Record<string, unknown>> | undefined
    const parts = candidates?.[0]?.content as { parts?: Array<Record<string, unknown>> }
    const texts = (parts?.parts || [])
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .filter(Boolean)
    return texts.join('')
  }

  if (config.spec.type === 'anthropic') {
    const content = payload.content as Array<Record<string, unknown>> | undefined
    const texts = (content || [])
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .filter(Boolean)
    return texts.join('')
  }

  if (config.spec.type === 'ollama') {
    const message = payload.message as Record<string, unknown> | undefined
    return typeof message?.content === 'string' ? message.content : ''
  }

  return ''
}
