// 开发环境默认开启调试日志，生产环境关闭
export function isDebugEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export function debugLog(...args: unknown[]) {
  if (isDebugEnabled()) {
    console.log(...args)
  }
}

export function debugWarn(...args: unknown[]) {
  if (isDebugEnabled()) {
    console.warn(...args)
  }
}

export function debugError(...args: unknown[]) {
  if (isDebugEnabled()) {
    console.error(...args)
  }
}
