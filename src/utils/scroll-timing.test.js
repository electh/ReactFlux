/* eslint-disable import/extensions */
import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"

import {
  quickScrollTo,
  supportsScrollEnd,
  waitForElement,
  waitForScrollEnd,
} from "./scroll-timing.js"

// A controllable RAF: callbacks run on demand via flushFrames(), so tests drive
// "paint" cadence explicitly and assert that outcome is frame-count-independent.
const installFakeRaf = () => {
  const callbacks = []
  globalThis.requestAnimationFrame = (cb) => {
    callbacks.push(cb)
    return callbacks.length
  }
  globalThis.cancelAnimationFrame = () => {}

  return {
    flushFrames(count) {
      for (let i = 0; i < count; i += 1) {
        const pending = callbacks.splice(0)
        for (const cb of pending) {
          cb()
        }
      }
    },
    pendingCount: () => callbacks.length,
  }
}

const createScrollElement = (scrollTop = 0) => {
  const listeners = new Map()
  return {
    scrollTop,
    addEventListener(type, handler) {
      listeners.set(type, handler)
    },
    removeEventListener(type) {
      listeners.delete(type)
    },
    emit(type) {
      listeners.get(type)?.()
    },
    hasListener(type) {
      return listeners.has(type)
    },
  }
}

let originalRaf
let originalCancelRaf
let originalOnScrollEnd

beforeEach(() => {
  originalRaf = globalThis.requestAnimationFrame
  originalCancelRaf = globalThis.cancelAnimationFrame
  originalOnScrollEnd = Object.getOwnPropertyDescriptor(globalThis, "onscrollend")
})

afterEach(() => {
  globalThis.requestAnimationFrame = originalRaf
  globalThis.cancelAnimationFrame = originalCancelRaf
  if (originalOnScrollEnd) {
    Object.defineProperty(globalThis, "onscrollend", originalOnScrollEnd)
  } else {
    delete globalThis.onscrollend
  }
})

test("supportsScrollEnd reflects onscrollend presence", () => {
  globalThis.onscrollend = null
  assert.equal(supportsScrollEnd(), true)
  delete globalThis.onscrollend
  assert.equal(supportsScrollEnd(), false)
})

test("waitForScrollEnd resolves on scrollend event when supported", async () => {
  globalThis.onscrollend = null
  installFakeRaf()
  const element = createScrollElement(0)

  const promise = waitForScrollEnd(element, { timeout: 1000 })
  assert.equal(element.hasListener("scrollend"), true)
  element.emit("scrollend")

  assert.equal(await promise, "scrollend")
  // Listener cleaned up after resolution.
  assert.equal(element.hasListener("scrollend"), false)
})

test("waitForScrollEnd ignores an early scrollend fired far from expectedTop", async () => {
  globalThis.onscrollend = null
  const raf = installFakeRaf()
  const element = createScrollElement(0)

  const promise = waitForScrollEnd(element, {
    timeout: 1000,
    stableWindow: 5,
    tolerance: 4,
    expectedTop: 100,
  })

  // Firefox-style spurious scrollend while still far from target: must be
  // ignored, listener re-armed, and the scroll allowed to keep animating.
  element.scrollTop = 40
  element.emit("scrollend")
  assert.equal(element.hasListener("scrollend"), true)

  // Scroll continues to target, then a real scrollend lands.
  const pumpInterval = setInterval(() => {
    if (element.scrollTop < 100) {
      element.scrollTop = Math.min(100, element.scrollTop + 20)
    } else {
      element.emit("scrollend")
    }
    raf.flushFrames(1)
  }, 2)

  try {
    assert.equal(await promise, "scrollend")
    assert.equal(element.scrollTop, 100)
  } finally {
    clearInterval(pumpInterval)
  }
})

test("waitForScrollEnd resolves via wall-clock stability after the scroll moves", async () => {
  delete globalThis.onscrollend
  const raf = installFakeRaf()
  const element = createScrollElement(0)

  // Tiny stable window so a couple of real-time ms elapse between checks.
  const promise = waitForScrollEnd(element, {
    timeout: 1000,
    stableWindow: 5,
    tolerance: 4,
  })

  // Simulate a smooth scroll: a few frames of startup latency (no movement),
  // then the position ramps toward target, then it rests. Stability must only
  // resolve once movement has been observed AND the position then settles —
  // and the outcome is independent of how many frames elapse.
  const pumpInterval = setInterval(() => {
    if (element.scrollTop < 100) {
      element.scrollTop = Math.min(100, element.scrollTop + 30)
    }
    raf.flushFrames(1)
  }, 2)

  try {
    assert.equal(await promise, "stable")
    assert.equal(element.scrollTop, 100)
  } finally {
    clearInterval(pumpInterval)
  }
})

test("waitForScrollEnd waits for expectedTop instead of resolving short", async () => {
  delete globalThis.onscrollend
  const raf = installFakeRaf()
  const element = createScrollElement(0)

  // Ramp to 93 (short of target 100 by 7px), pause long enough that a plain
  // stability window would resolve, then finish to 100. With expectedTop the
  // detector must hold until it lands on target — not resolve at 93.
  const promise = waitForScrollEnd(element, {
    timeout: 1000,
    stableWindow: 5,
    tolerance: 4,
    expectedTop: 100,
  })

  let phase = 0
  const pumpInterval = setInterval(() => {
    phase += 1
    if (phase <= 3) {
      element.scrollTop = 93 // ramped near target, then "pauses" off-target
    } else if (phase >= 8) {
      element.scrollTop = 100 // engine eases the final pixels
    }
    raf.flushFrames(1)
  }, 2)

  try {
    assert.equal(await promise, "stable")
    assert.equal(element.scrollTop, 100)
  } finally {
    clearInterval(pumpInterval)
  }
})

test("waitForScrollEnd does not time out while a long scroll keeps progressing", async () => {
  delete globalThis.onscrollend
  const raf = installFakeRaf()
  const element = createScrollElement(0)

  // Idle timeout is short (20ms) but the scroll keeps advancing past it; the
  // timeout must reset on progress and only the final settle resolves.
  const target = 600
  const promise = waitForScrollEnd(element, {
    timeout: 20,
    stableWindow: 5,
    tolerance: 4,
    expectedTop: target,
  })

  const pumpInterval = setInterval(() => {
    if (element.scrollTop < target) {
      element.scrollTop = Math.min(target, element.scrollTop + 25)
    }
    raf.flushFrames(1)
  }, 5) // 5ms/step > 20ms? no — each step progresses, resetting idle timer

  try {
    assert.equal(await promise, "stable")
    assert.equal(element.scrollTop, target)
  } finally {
    clearInterval(pumpInterval)
  }
})

test("waitForScrollEnd does not resolve 'stable' before any movement (timeout backstop)", async () => {
  delete globalThis.onscrollend
  const raf = installFakeRaf()
  const element = createScrollElement(50)

  // scrollTop never changes (engine dropped the scroll / startup never ramps).
  // The movement gate prevents a premature "stable"; the timeout is the only
  // way out.
  const promise = waitForScrollEnd(element, {
    timeout: 30,
    stableWindow: 5,
    tolerance: 4,
  })

  const pumpInterval = setInterval(() => raf.flushFrames(1), 2)

  try {
    assert.equal(await promise, "timeout")
  } finally {
    clearInterval(pumpInterval)
  }
})

test("waitForScrollEnd resolves 'aborted' immediately when signal already aborted", async () => {
  delete globalThis.onscrollend
  installFakeRaf()
  const element = createScrollElement(0)
  const controller = new AbortController()
  controller.abort()

  assert.equal(await waitForScrollEnd(element, { signal: controller.signal }), "aborted")
})

test("waitForScrollEnd resolves 'aborted' when signal fires mid-wait", async () => {
  delete globalThis.onscrollend
  installFakeRaf()
  const element = createScrollElement(50)
  const controller = new AbortController()

  const promise = waitForScrollEnd(element, { signal: controller.signal, timeout: 1000 })
  controller.abort()

  assert.equal(await promise, "aborted")
})

test("quickScrollTo tweens to target and resolves 'done'", async () => {
  const raf = installFakeRaf()
  const element = createScrollElement(0)

  const promise = quickScrollTo(element, 100, { duration: 10 })

  // Pump frames + let wall-clock time pass so the duration elapses.
  const pumpInterval = setInterval(() => raf.flushFrames(1), 2)
  try {
    assert.equal(await promise, "done")
    assert.equal(element.scrollTop, 100)
  } finally {
    clearInterval(pumpInterval)
  }
})

test("quickScrollTo resolves 'aborted' and stops in place when interrupted", async () => {
  const raf = installFakeRaf()
  const element = createScrollElement(0)
  const controller = new AbortController()

  const promise = quickScrollTo(element, 1000, {
    duration: 1000,
    signal: controller.signal,
  })

  raf.flushFrames(1) // advance a little
  controller.abort()

  assert.equal(await promise, "aborted")
  // Stopped partway, not snapped to target.
  assert.ok(element.scrollTop < 1000)
})

test("quickScrollTo resolves 'aborted' immediately when signal already aborted", async () => {
  installFakeRaf()
  const element = createScrollElement(50)
  const controller = new AbortController()
  controller.abort()

  assert.equal(await quickScrollTo(element, 500, { signal: controller.signal }), "aborted")
  assert.equal(element.scrollTop, 50)
})

test("waitForElement resolves when element already present", async () => {
  installFakeRaf()
  const node = { id: "card" }
  const container = { querySelector: () => node }

  assert.equal(await waitForElement(container, "[data-entry-id]"), node)
})

test("waitForElement resolves once element appears", async () => {
  const raf = installFakeRaf()
  let node = null
  const container = { querySelector: () => node }

  const promise = waitForElement(container, "[data-entry-id]", { timeout: 1000 })
  raf.flushFrames(2)
  node = { id: "card" }
  raf.flushFrames(1)

  assert.equal(await promise, node)
})

test("waitForElement rejects with AbortError when aborted", async () => {
  installFakeRaf()
  const container = { querySelector: () => null }
  const controller = new AbortController()
  controller.abort()

  await assert.rejects(
    waitForElement(container, "[data-entry-id]", { signal: controller.signal }),
    (error) => error.name === "AbortError",
  )
})

test("waitForElement rejects on timeout when element never appears", async () => {
  const raf = installFakeRaf()
  const container = { querySelector: () => null }

  const promise = waitForElement(container, "[data-entry-id]", { timeout: 0 })
  // First poll past the 0ms cap rejects.
  await new Promise((resolve) => setTimeout(resolve, 2))
  raf.flushFrames(1)

  await assert.rejects(promise, /Timed out waiting for element/)
})
