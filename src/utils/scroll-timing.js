// Refresh-rate-agnostic scroll-completion primitives.
//
// These helpers decide "scroll finished" using the `scrollend` event when
// available and a `performance.now()` wall-clock stability window otherwise.
// requestAnimationFrame is used only as a "look again next paint" scheduler;
// nothing ever counts frames, so the outcome is identical at 30/60/120/144/
// 240/360Hz and in throttled background tabs.
//
// This module has no `@/...` imports on purpose so it can be unit-tested under
// plain `node --test` without Vite's alias resolver.

export const STREAM_SCROLL_ALIGNMENT_TOLERANCE = 4
export const STREAM_SCROLL_STABLE_WINDOW_MS = 120
export const STREAM_SCROLL_END_TIMEOUT_MS = 1000
export const STREAM_ELEMENT_WAIT_TIMEOUT_MS = 800
// Duration of the manual "quick scroll" tween used during rapid navigation —
// short enough to keep up with fast keypresses (so the view doesn't lag a full
// native smooth-scroll behind), long enough to still read as motion rather than
// an instant jump.
export const STREAM_QUICK_SCROLL_DURATION_MS = 180

const raf = (callback) =>
  typeof globalThis.requestAnimationFrame === "function"
    ? globalThis.requestAnimationFrame(callback)
    : globalThis.setTimeout(callback, 16)

const cancelRaf = (handle) => {
  if (handle === null || handle === undefined) {
    return
  }

  if (typeof globalThis.cancelAnimationFrame === "function") {
    globalThis.cancelAnimationFrame(handle)
  } else {
    globalThis.clearTimeout(handle)
  }
}

const now = () =>
  typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now()

const createAbortError = () => {
  const error = new Error("Aborted")
  error.name = "AbortError"
  return error
}

const easeOutCubic = (t) => 1 - (1 - t) ** 3

// A manual, short, abortable scroll tween. Native scrollTo({behavior:"smooth"})
// has no duration control and runs too long to keep up with rapid key nav —
// each press would abort it a few hundred px in, so the view creeps then jumps.
// This animates scrollTop over `duration` ms instead; on abort it stops in
// place (the next quick scroll continues from there, so a burst reads as one
// fast glide). Resolves "done" on completion, "aborted" if interrupted.
// Duration is wall-clock via performance.now(), so it's refresh-rate-agnostic.
export const quickScrollTo = (
  scrollElement,
  top,
  { signal, duration = STREAM_QUICK_SCROLL_DURATION_MS } = {},
) =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve("aborted")
      return
    }

    const startTop = scrollElement.scrollTop
    const distance = top - startTop
    const startedAt = now()

    let settled = false
    let frameId = null

    const cleanup = () => {
      cancelRaf(frameId)
      frameId = null
      signal?.removeEventListener?.("abort", onAbort)
    }

    const finish = (reason) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      resolve(reason)
    }

    function onAbort() {
      finish("aborted")
    }

    const step = () => {
      if (settled) {
        return
      }

      const elapsed = now() - startedAt
      const progress = duration <= 0 ? 1 : Math.min(1, elapsed / duration)
      scrollElement.scrollTop = startTop + distance * easeOutCubic(progress)

      if (progress >= 1) {
        finish("done")
        return
      }

      frameId = raf(step)
    }

    signal?.addEventListener?.("abort", onAbort, { once: true })
    frameId = raf(step)
  })

export const supportsScrollEnd = () => "onscrollend" in globalThis

// Resolves once `scrollElement` has finished scrolling. Always runs a
// wall-clock stability detector; additionally listens for `scrollend` when the
// engine supports it. Honors an AbortSignal.
//
// `expectedTop` (optional): the scrollTop the caller asked for. When provided,
// "stable" only resolves once the scroll has both stopped AND landed within
// `tolerance` of that target — so a stability window that elapses while the
// engine is still easing the final few pixels can't resolve early and trigger a
// redundant "auto" micro-correction. If the scroll stops short of the target
// (engine clamped/blocked it), a longer stuck-window still resolves so we never
// hang.
//
// `timeout` is idle-based, not absolute: it fires only when the scroll has made
// no progress for that long. A long smooth scroll keeps resetting it, so it
// won't snap the tail of a big jump. The caller's session max timeout remains
// the absolute cap.
export const waitForScrollEnd = (
  scrollElement,
  {
    signal,
    timeout = STREAM_SCROLL_END_TIMEOUT_MS,
    stableWindow = STREAM_SCROLL_STABLE_WINDOW_MS,
    tolerance = STREAM_SCROLL_ALIGNMENT_TOLERANCE,
    expectedTop = null,
  } = {},
) =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve("aborted")
      return
    }

    let settled = false
    let frameId = null
    let lastScrollTop = scrollElement.scrollTop
    let stableSince = now()
    let lastProgressAt = now()
    // A smooth scroll has startup latency: scrollTop stays put for the first
    // frames after scrollTo(). Without this gate the detector would read those
    // frames as "not moving" and resolve "stable" mid-animation, so the caller
    // would fire a competing "auto" correction that snaps instantly. Only allow
    // a "stable" resolution once the scroll has actually moved at least once.
    let hasMoved = false

    // How long a stopped-but-off-target scroll waits before giving up on
    // reaching expectedTop (engine clamped it). Long enough not to truncate a
    // brief easing tail, short enough not to stall the loop.
    const stuckWindow = Math.max(stableWindow * 3, 360)

    const cleanup = () => {
      cancelRaf(frameId)
      frameId = null
      scrollElement.removeEventListener?.("scrollend", onScrollEnd)
      signal?.removeEventListener?.("abort", onAbort)
    }

    const finish = (reason) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      resolve(reason)
    }

    const atTarget = (value) => expectedTop === null || Math.abs(value - expectedTop) <= tolerance

    function onScrollEnd() {
      // Firefox can emit `scrollend` mid-animation (async panning) while still
      // far from the target. Trust it only when we've actually arrived; an early
      // one is ignored and the wall-clock detector keeps waiting, so the caller
      // never fires a big "auto" snap to finish the scroll the engine abandoned.
      if (atTarget(scrollElement.scrollTop)) {
        finish("scrollend")
      } else {
        // Re-arm the one-shot listener for the real end-of-scroll event.
        scrollElement.addEventListener?.("scrollend", onScrollEnd, { once: true })
      }
    }

    function onAbort() {
      finish("aborted")
    }

    const checkStability = () => {
      if (settled) {
        return
      }

      const current = scrollElement.scrollTop
      const moved = Math.abs(current - lastScrollTop) > tolerance
      lastScrollTop = current

      const stoppedLongEnough = hasMoved && now() - stableSince >= stableWindow
      // Stopped. Resolve if we reached the target, or if we've been stuck short
      // of it long enough that the engine clearly won't get there.
      const stuckShort = hasMoved && now() - stableSince >= stuckWindow

      if (moved) {
        hasMoved = true
        stableSince = now()
        lastProgressAt = now()
      } else if (stoppedLongEnough && (atTarget(current) || stuckShort)) {
        finish("stable")
        return
      }

      // Idle timeout: only when no progress at all for `timeout` ms. A scroll
      // that keeps advancing resets lastProgressAt and never trips this.
      if (now() - lastProgressAt >= timeout) {
        finish("timeout")
        return
      }

      frameId = raf(checkStability)
    }

    if (supportsScrollEnd()) {
      scrollElement.addEventListener?.("scrollend", onScrollEnd, { once: true })
    }

    signal?.addEventListener?.("abort", onAbort, { once: true })

    frameId = raf(checkStability)
  })

// Resolves with the element once `container.querySelector(selector)` finds it.
// RAF-polled, wall-clock capped, abortable. Rejects with AbortError on abort
// and a generic Error when the element never appears.
export const waitForElement = (
  container,
  selector,
  { signal, timeout = STREAM_ELEMENT_WAIT_TIMEOUT_MS } = {},
) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError())
      return
    }

    const existing = container?.querySelector?.(selector)
    if (existing) {
      resolve(existing)
      return
    }

    let settled = false
    let frameId = null
    const startedAt = now()

    const cleanup = () => {
      cancelRaf(frameId)
      frameId = null
      signal?.removeEventListener?.("abort", onAbort)
    }

    const settle = (fn, value) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      fn(value)
    }

    function onAbort() {
      settle(reject, createAbortError())
    }

    const poll = () => {
      if (settled) {
        return
      }

      const found = container?.querySelector?.(selector)
      if (found) {
        settle(resolve, found)
        return
      }

      if (now() - startedAt >= timeout) {
        settle(reject, new Error(`Timed out waiting for element: ${selector}`))
        return
      }

      frameId = raf(poll)
    }

    signal?.addEventListener?.("abort", onAbort, { once: true })
    frameId = raf(poll)
  })
