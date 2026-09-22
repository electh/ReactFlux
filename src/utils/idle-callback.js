const IDLE_CALLBACK_TIMEOUT = 500
const FALLBACK_DELAY = 50

const scheduleWhenIdle = (callback) => {
  if (typeof globalThis.requestIdleCallback === "function") {
    const idleCallbackId = globalThis.requestIdleCallback(callback, {
      timeout: IDLE_CALLBACK_TIMEOUT,
    })
    return () => globalThis.cancelIdleCallback(idleCallbackId)
  }

  const timeoutId = setTimeout(callback, FALLBACK_DELAY)
  return () => clearTimeout(timeoutId)
}

export default scheduleWhenIdle
