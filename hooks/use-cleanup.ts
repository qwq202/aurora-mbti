import { useRef, useEffect } from 'react'

/**
 *  Hook - 
 * AbortController
 */
export function useCleanup() {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const controllersRef = useRef<Set<AbortController>>(new Set())
  const listenersRef = useRef<Set<{ 
    element: EventTarget, 
    event: string, 
    handler: EventListener,
    options?: boolean | AddEventListenerOptions 
  }>>(new Set())

  // 
  const addTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const timer = setTimeout(() => {
      callback()
      timersRef.current.delete(timer)
    }, delay)
    timersRef.current.add(timer)
    return timer
  }

  // 
  const addInterval = (callback: () => void, delay: number): NodeJS.Timeout => {
    const interval = setInterval(callback, delay)
    intervalsRef.current.add(interval)
    return interval
  }

  // AbortController
  const addController = (): AbortController => {
    const controller = new AbortController()
    controllersRef.current.add(controller)
    return controller
  }

  // 
  const addEventListener = (
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options)
    listenersRef.current.add({ element, event, handler, options })
  }

  // 
  const clearTimer = (timer: NodeJS.Timeout) => {
    clearTimeout(timer)
    timersRef.current.delete(timer)
  }

  // 
  const clearIntervalTimer = (interval: NodeJS.Timeout) => {
    clearInterval(interval)
    intervalsRef.current.delete(interval)
  }

  // 
  const clearController = (controller: AbortController) => {
    try {
      controller.abort()
      controllersRef.current.delete(controller)
    } catch (error) {
      console.warn('AbortController:', error)
    }
  }

  // 
  const removeEventListener = (
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.removeEventListener(event, handler, options)
    // 
    for (const listener of listenersRef.current) {
      if (listener.element === element && 
          listener.event === event && 
          listener.handler === handler) {
        listenersRef.current.delete(listener)
        break
      }
    }
  }

  // 
  useEffect(() => {
    return () => {
      // 
      timersRef.current.forEach(timer => {
        try { clearTimeout(timer) } catch (error) { console.warn(':', error) }
      })
      timersRef.current.clear()

      // 
      intervalsRef.current.forEach(interval => {
        try { clearInterval(interval) } catch (error) { console.warn(':', error) }
      })
      intervalsRef.current.clear()

      // AbortController
      controllersRef.current.forEach(controller => {
        try { controller.abort() } catch (error) { console.warn(':', error) }
      })
      controllersRef.current.clear()

      // 
      listenersRef.current.forEach(({ element, event, handler, options }) => {
        try {
          element.removeEventListener(event, handler, options)
        } catch (error) {
          console.warn(':', error)
        }
      })
      listenersRef.current.clear()
    }
  }, [])

  return {
    // 
    addTimeout,
    addInterval,
    clearTimer,
    clearIntervalTimer,
    
    // 
    addController,
    clearController,
    
    // 
    addEventListener,
    removeEventListener,
    
    // 
    getStats: () => ({
      timers: timersRef.current.size,
      intervals: intervalsRef.current.size,
      controllers: controllersRef.current.size,
      listeners: listenersRef.current.size
    })
  }
}

/**
 *  Hook - setTimeout
 */
export function useTimeout() {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())

  const addTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const timer = setTimeout(() => {
      callback()
      timersRef.current.delete(timer)
    }, delay)
    timersRef.current.add(timer)
    return timer
  }

  const clearTimer = (timer: NodeJS.Timeout) => {
    clearTimeout(timer)
    timersRef.current.delete(timer)
  }

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => {
        try { clearTimeout(timer) } catch (error) { console.warn(':', error) }
      })
      timersRef.current.clear()
    }
  }, [])

  return { addTimeout, clearTimer }
}

/**
 *  Hook - setInterval
 */
export function useInterval() {
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  const addInterval = (callback: () => void, delay: number): NodeJS.Timeout => {
    const interval = setInterval(callback, delay)
    intervalsRef.current.add(interval)
    return interval
  }

  const clearInterval = (interval: NodeJS.Timeout) => {
    clearInterval(interval)
    intervalsRef.current.delete(interval)
  }

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => {
        try { clearInterval(interval) } catch (error) { console.warn(':', error) }
      })
      intervalsRef.current.clear()
    }
  }, [])

  return { addInterval, clearInterval }
}
