import { useCallback, useEffect, useRef } from "react"

import { markEntriesAsRead } from "@/hooks/useEntryActions"

const READ_UPDATE_BATCH_DELAY_MS = 50

const useReadOnScroll = (rootRef) => {
  const observerRef = useRef(null)
  const observerRootRef = useRef(null)
  const entryByElementRef = useRef(new WeakMap())
  const wasVisibleRef = useRef(new WeakSet())
  const pendingEntriesRef = useRef(new Map())
  const flushTimerRef = useRef(null)

  const flushPendingEntries = useCallback(() => {
    flushTimerRef.current = null
    const entries = [...pendingEntriesRef.current.values()]
    pendingEntriesRef.current.clear()
    markEntriesAsRead(entries)
  }, [])

  const queueEntry = useCallback(
    (entry) => {
      pendingEntriesRef.current.set(entry.id, entry)
      if (flushTimerRef.current !== null) {
        return
      }

      flushTimerRef.current = globalThis.setTimeout(flushPendingEntries, READ_UPDATE_BATCH_DELAY_MS)
    },
    [flushPendingEntries],
  )

  const getObserver = useCallback(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") {
      return null
    }
    if (observerRef.current && observerRootRef.current === root) {
      return observerRef.current
    }

    observerRef.current?.disconnect()
    entryByElementRef.current = new WeakMap()
    wasVisibleRef.current = new WeakSet()
    observerRootRef.current = root
    observerRef.current = new IntersectionObserver(
      (observerEntries, observer) => {
        for (const observerEntry of observerEntries) {
          const element = observerEntry.target
          if (observerEntry.isIntersecting) {
            wasVisibleRef.current.add(element)
            continue
          }

          const entry = entryByElementRef.current.get(element)
          const movedAboveViewport =
            observerEntry.rootBounds &&
            observerEntry.boundingClientRect.top < observerEntry.rootBounds.top

          if (entry && wasVisibleRef.current.has(element) && movedAboveViewport) {
            queueEntry(entry)
            observer.unobserve(element)
            entryByElementRef.current.delete(element)
            wasVisibleRef.current.delete(element)
          }
        }
      },
      { root, threshold: 0.2 },
    )

    return observerRef.current
  }, [queueEntry, rootRef])

  const observeRead = useCallback(
    (element, entry) => {
      const observer = getObserver()
      if (!observer || !element) {
        return
      }

      entryByElementRef.current.set(element, entry)
      observer.observe(element)

      return () => {
        const root = observerRootRef.current
        const observedEntry = entryByElementRef.current.get(element)
        const movedAboveViewport =
          observedEntry &&
          wasVisibleRef.current.has(element) &&
          element.isConnected &&
          root?.isConnected &&
          element.getBoundingClientRect().top < root.getBoundingClientRect().top

        observer.unobserve(element)
        entryByElementRef.current.delete(element)
        wasVisibleRef.current.delete(element)

        if (movedAboveViewport) {
          queueEntry(observedEntry)
        }
      }
    },
    [getObserver, queueEntry],
  )

  useEffect(
    () => () => {
      observerRef.current?.disconnect()
      observerRef.current = null
      observerRootRef.current = null
      if (flushTimerRef.current !== null) {
        globalThis.clearTimeout(flushTimerRef.current)
      }
      if (pendingEntriesRef.current.size > 0) {
        flushPendingEntries()
      }
    },
    [flushPendingEntries],
  )

  return observeRead
}

export default useReadOnScroll
