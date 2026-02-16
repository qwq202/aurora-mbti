export type AIProviderId =
  | 'openai'
  | 'openai-responses'
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'volcengine'
  | 'bailian'
  | 'newapi'
  | 'siliconflow'
  | 'ollama'
  | 'anthropic'
  | 'groq'

export type AIProviderType =
  | 'openai-chat'
  | 'openai-responses'
  | 'gemini'
  | 'anthropic'
  | 'ollama'

export type AIProviderSpec = {
  id: AIProviderId
  label: string
  type: AIProviderType
  defaultBaseUrl: string
  baseUrlPlaceholder?: string
  chatPath?: string
  responsesPath?: string
  defaultModel?: string
  requiresApiKey?: boolean
  supportsJsonSchema?: boolean
}

export const AI_PROVIDER_SPECS: AIProviderSpec[] = [
  {
    id: 'openai',
    label: 'OpenAI (Chat Completions)',
    type: 'openai-chat',
    defaultBaseUrl: 'https://api.openai.com',
    chatPath: '/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    requiresApiKey: true,
    supportsJsonSchema: true,
  },
  {
    id: 'openai-responses',
    label: 'OpenAI (Responses API)',
    type: 'openai-responses',
    defaultBaseUrl: 'https://api.openai.com',
    responsesPath: '/v1/responses',
    defaultModel: 'gpt-4o-mini',
    requiresApiKey: true,
    supportsJsonSchema: true,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    type: 'gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-flash',
    requiresApiKey: true,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    type: 'openai-chat',
    defaultBaseUrl: 'https://api.deepseek.com',
    chatPath: '/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    requiresApiKey: true,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    type: 'openai-chat',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    chatPath: '/chat/completions',
    defaultModel: 'openai/gpt-4o-mini',
    requiresApiKey: true,
  },
  {
    id: 'volcengine',
    label: 'Volcengine (Doubao)',
    type: 'openai-chat',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    chatPath: '/chat/completions',
    defaultModel: 'doubao-lite-32k',
    requiresApiKey: true,
  },
  {
    id: 'bailian',
    label: 'Alibaba Bailian (DashScope)',
    type: 'openai-chat',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    chatPath: '/chat/completions',
    defaultModel: 'qwen-plus',
    requiresApiKey: true,
  },
  {
    id: 'newapi',
    label: 'NewAPI',
    type: 'openai-chat',
    defaultBaseUrl: '',
    baseUrlPlaceholder: 'https://your-newapi-domain/v1',
    chatPath: '/chat/completions',
    defaultModel: '',
    requiresApiKey: true,
  },
  {
    id: 'siliconflow',
    label: 'SiliconFlow',
    type: 'openai-chat',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    chatPath: '/chat/completions',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    requiresApiKey: true,
  },
  {
    id: 'ollama',
    label: 'Ollama',
    type: 'ollama',
    defaultBaseUrl: 'http://localhost:11434',
    chatPath: '/api/chat',
    defaultModel: 'llama3.2',
    requiresApiKey: false,
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    type: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    chatPath: '/v1/messages',
    defaultModel: 'claude-3-5-sonnet-latest',
    requiresApiKey: true,
  },
  {
    id: 'groq',
    label: 'Groq',
    type: 'openai-chat',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    chatPath: '/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresApiKey: true,
  },
]

export const AI_PROVIDER_MAP = AI_PROVIDER_SPECS.reduce((acc, provider) => {
  acc[provider.id] = provider
  return acc
}, {} as Record<AIProviderId, AIProviderSpec>)
