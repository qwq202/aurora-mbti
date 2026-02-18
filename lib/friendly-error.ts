export function toFriendlyErrorMessage(rawError: string | undefined, locale: string, fallback?: string): string {
  const text = (rawError || '').trim()
  const normalized = text.toLowerCase()
  const isZh = locale.startsWith('zh')
  const isJa = locale.startsWith('ja')

  const message = (zh: string, en: string, ja: string) => (isZh ? zh : isJa ? ja : en)

  if (!normalized) {
    return fallback || message('请求失败，请稍后重试。', 'Request failed. Please try again later.', 'リクエストに失敗しました。しばらくしてから再試行してください。')
  }

  if (normalized.includes('abort') || normalized.includes('cancel')) {
    return message('请求已取消。', 'Request was cancelled.', 'リクエストはキャンセルされました。')
  }

  if (
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('etimedout')
  ) {
    return message('请求超时，请稍后重试。', 'Request timed out. Please try again.', 'リクエストがタイムアウトしました。再試行してください。')
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('econn') ||
    normalized.includes('enotfound')
  ) {
    return message('网络连接异常，请检查网络后重试。', 'Network error. Please check your connection and try again.', 'ネットワークエラーです。接続を確認して再試行してください。')
  }

  if (
    normalized.includes('http 429') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests')
  ) {
    return message('请求过于频繁，请稍后再试。', 'Too many requests. Please try again later.', 'リクエストが多すぎます。しばらくしてから再試行してください。')
  }

  if (
    normalized.includes('http 401') ||
    normalized.includes('http 403') ||
    normalized.includes('session_required') ||
    normalized.includes('session') ||
    normalized.includes('api key') ||
    normalized.includes('authentication') ||
    normalized.includes('unauthorized')
  ) {
    return message('会话已失效，请刷新页面后重试。', 'Session expired. Refresh the page and try again.', 'セッションの有効期限が切れました。ページを更新して再試行してください。')
  }

  if (normalized.includes('http 400') || normalized.includes('invalid input')) {
    return message('请求参数不正确，请检查后重试。', 'Invalid request parameters. Please review your input.', 'リクエストパラメータが不正です。入力内容を確認してください。')
  }

  if (
    normalized.includes('http 500') ||
    normalized.includes('http 502') ||
    normalized.includes('http 503') ||
    normalized.includes('http 504') ||
    normalized.includes('internal server error')
  ) {
    return message('服务暂时不可用，请稍后重试。', 'Service is temporarily unavailable. Please try again later.', 'サービスは一時的に利用できません。しばらくしてから再試行してください。')
  }

  return fallback || message('请求失败，请稍后重试。', 'Request failed. Please try again later.', 'リクエストに失敗しました。しばらくしてから再試行してください。')
}
