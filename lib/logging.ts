export function isDebugEnabled(): boolean {
  return process.env.DEBUG_API_LOGS === 'true'
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
