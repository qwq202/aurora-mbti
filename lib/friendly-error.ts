export function toFriendlyErrorMessage(rawError: string | undefined, locale: string, fallback?: string): string {
  const text = (rawError || '').trim()
  const normalized = text.toLowerCase()
  const isZh = locale.startsWith('zh')

  const message = (zh: string, en: string) => (isZh ? zh : en)

  if (!normalized) {
    return fallback || message('请求失败，请稍后重试。', 'Request failed. Please try again later.')
  }

  if (normalized.includes('abort') || normalized.includes('cancel')) {
    return message('请求已取消。', 'Request was cancelled.')
  }

  if (
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('etimedout')
  ) {
    return message('请求超时，请稍后重试。', 'Request timed out. Please try again.')
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('econn') ||
    normalized.includes('enotfound')
  ) {
    return message('网络连接异常，请检查网络后重试。', 'Network error. Please check your connection and try again.')
  }

  if (
    normalized.includes('http 429') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests')
  ) {
    return message('请求过于频繁，请稍后再试。', 'Too many requests. Please try again later.')
  }

  if (
    normalized.includes('http 401') ||
    normalized.includes('http 403') ||
    normalized.includes('api key') ||
    normalized.includes('authentication') ||
    normalized.includes('unauthorized')
  ) {
    return message('服务鉴权失败，请检查 API 配置。', 'Authentication failed. Please verify API credentials.')
  }

  if (normalized.includes('http 400') || normalized.includes('invalid input')) {
    return message('请求参数不正确，请检查后重试。', 'Invalid request parameters. Please review your input.')
  }

  if (
    normalized.includes('http 500') ||
    normalized.includes('http 502') ||
    normalized.includes('http 503') ||
    normalized.includes('http 504') ||
    normalized.includes('internal server error')
  ) {
    return message('服务暂时不可用，请稍后重试。', 'Service is temporarily unavailable. Please try again later.')
  }

  return fallback || message('请求失败，请稍后重试。', 'Request failed. Please try again later.')
}
