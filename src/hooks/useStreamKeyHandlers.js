import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import { polyglotState } from "./useLanguage"
import useModalToggle from "./useModalToggle"
import usePhotoSlider from "./usePhotoSlider"

import useContentContext from "@/hooks/useContentContext"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { Message } from "@/utils/feedback"
import { extractImageSources } from "@/utils/images"
import {
  getAnimationScrollBehavior,
  quickScrollTo,
  STREAM_SCROLL_ALIGNMENT_TOLERANCE,
  STREAM_SCROLL_END_TIMEOUT_MS,
  STREAM_SCROLL_STABLE_WINDOW_MS,
  waitForElement,
  waitForScrollEnd,
} from "@/utils/scroll"

const STREAM_CARD_TOP_OFFSET_FALLBACK = 18
const STREAM_SCROLL_MAX_SETTLE_TIME_MS = 2600
const STREAM_ALIGNMENT_MAX_CORRECTIONS = 3
const STREAM_CARD_WAIT_TIMEOUT_MS = 800
// If a new navigation interrupts an in-flight smooth scroll within this window,
// the user is hammering the key faster than a smooth scroll completes. Animating
// each step would just creep a few hundred px then jump — so catch up instantly
// and only animate once the keypresses stop.
const STREAM_RAPID_NAV_WINDOW_MS = 350

const getStreamCardTopOffset = (scrollElement) => {
  const computedStyle = globalThis.getComputedStyle(scrollElement)
  const scrollPaddingTop =
    computedStyle.scrollPaddingTop || computedStyle.scrollPaddingBlockStart || ""
  const parsedOffset = Number.parseFloat(scrollPaddingTop)

  return Number.isFinite(parsedOffset) ? parsedOffset : STREAM_CARD_TOP_OFFSET_FALLBACK
}

// Single layout read per alignment pass: returns the target scrollTop plus the
// delta needed to decide "already aligned", accounting for clamp at start/end.
const measureStreamCardAlignment = (selectedCard, scrollElement) => {
  const containerRect = scrollElement.getBoundingClientRect()
  const selectedRect = selectedCard.getBoundingClientRect()
  const topOffset = getStreamCardTopOffset(scrollElement)

  const targetScrollTop = Math.max(
    0,
    scrollElement.scrollTop + selectedRect.top - containerRect.top - topOffset,
  )
  const topDelta = Math.abs(selectedRect.top - containerRect.top - topOffset)
  const maxScrollTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight)
  const isClampedToStart =
    targetScrollTop <= STREAM_SCROLL_ALIGNMENT_TOLERANCE &&
    scrollElement.scrollTop <= STREAM_SCROLL_ALIGNMENT_TOLERANCE
  const isClampedToEnd =
    targetScrollTop >= maxScrollTop - STREAM_SCROLL_ALIGNMENT_TOLERANCE &&
    scrollElement.scrollTop >= maxScrollTop - STREAM_SCROLL_ALIGNMENT_TOLERANCE
  const effectiveTopDelta = isClampedToStart || isClampedToEnd ? 0 : topDelta

  return { targetScrollTop, topDelta, effectiveTopDelta }
}

const scrollStreamCardIntoView = (
  selectedCard,
  scrollElement,
  behavior = getAnimationScrollBehavior(),
  measuredTargetScrollTop = null,
) => {
  const top =
    measuredTargetScrollTop ??
    measureStreamCardAlignment(selectedCard, scrollElement).targetScrollTop

  scrollElement.scrollTo({ behavior, top })
}

const focusStreamCard = (cardElement) => {
  if (document.activeElement === cardElement) {
    return
  }

  cardElement.focus({ preventScroll: true })
}

const findAdjacentUnreadEntry = (currentEntryId, direction, entries) => {
  const currentIndex = entries.findIndex((entry) => entry.id === currentEntryId)
  if (currentIndex === -1) {
    return null
  }

  const isSearchingBackward = direction === "prev"
  const searchRange = isSearchingBackward
    ? entries.slice(0, currentIndex).toReversed()
    : entries.slice(currentIndex + 1)

  return searchRange.find((entry) => entry.status === "unread")
}

const useStreamKeyHandlers = ({ streamVirtualizerRef }) => {
  const { activeContent } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)

  const { entryListRef, handleEntryClick, closeActiveContent } = useContentContext()
  const streamAlignmentTaskRef = useRef({
    controller: null,
    waitController: null,
    resizeObserver: null,
    observedElements: new Map(),
    maxTimeoutId: null,
    restartRequested: false,
    scrollInFlight: false,
    lastInterruptedAt: 0,
  })

  const clearPendingStreamAlignment = () => {
    const task = streamAlignmentTaskRef.current

    // If we're tearing down while a scroll was still animating, the user
    // interrupted it (rapid nav). Stamp it so the next alignment catches up
    // instantly instead of starting another doomed smooth scroll.
    if (task.scrollInFlight) {
      task.lastInterruptedAt = Date.now()
      task.scrollInFlight = false
    }

    // Aborting the session signal propagates into every pending await
    // (waitForScrollEnd / waitForElement), so no stale callback runs.
    task.controller?.abort()
    task.controller = null
    task.waitController?.abort()
    task.waitController = null

    if (task.maxTimeoutId !== null) {
      globalThis.clearTimeout(task.maxTimeoutId)
      task.maxTimeoutId = null
    }

    if (task.resizeObserver) {
      task.resizeObserver.disconnect()
      task.resizeObserver = null
    }

    task.observedElements = new Map()
    task.restartRequested = false
  }

  useEffect(() => clearPendingStreamAlignment, [])

  const getEntryListScrollElement = () => {
    if (!entryListRef.current) {
      return null
    }

    return entryListRef.current.getScrollElement?.() || entryListRef.current.contentWrapperEl
  }

  const getSelectedCard = (targetEntryId = null) => {
    if (!entryListRef.current?.el) {
      return null
    }

    if (targetEntryId !== null) {
      return entryListRef.current.el.querySelector(`[data-entry-id="${targetEntryId}"]`) || null
    }

    return entryListRef.current.el.querySelector(".card-wrapper.selected") || null
  }

  const getAdjacentEntry = (direction) => {
    const { activeContent: latestActiveContent } = contentState.get()
    if (!latestActiveContent) {
      return null
    }

    const entries = filteredEntriesState.get()
    const currentIndex = entries.findIndex(
      (entry) => Number(entry.id) === Number(latestActiveContent.id),
    )
    if (currentIndex === -1) {
      return null
    }

    const step = direction === "prev" ? -1 : 1
    return entries[currentIndex + step] ?? null
  }

  const ensureResizeObserver = (signal, requestRestart) => {
    const task = streamAlignmentTaskRef.current
    if (task.resizeObserver || typeof ResizeObserver !== "function") {
      return
    }

    // ResizeObserver fires once immediately on observe() and again for every
    // reflow our own scroll causes. Only a *genuine height change* of an
    // already-known element (after its first, baseline report) should restart
    // alignment — otherwise the initial fire aborts the in-flight smooth scroll
    // and the loop snaps with an "auto" correction.
    task.resizeObserver = new ResizeObserver((entries) => {
      if (signal.aborted) {
        return
      }

      let meaningfulChange = false
      for (const entry of entries) {
        const previousHeight = task.observedElements.get(entry.target)
        const currentHeight = entry.contentRect.height

        if (previousHeight === undefined) {
          // Baseline report (initial observe) — record, do not restart.
          task.observedElements.set(entry.target, currentHeight)
          continue
        }

        if (Math.abs(currentHeight - previousHeight) > STREAM_SCROLL_ALIGNMENT_TOLERANCE) {
          task.observedElements.set(entry.target, currentHeight)
          meaningfulChange = true
        }
      }

      if (meaningfulChange) {
        requestRestart()
      }
    })
  }

  const observeElement = (element) => {
    const task = streamAlignmentTaskRef.current
    if (!element || !(element instanceof Element) || task.observedElements.has(element)) {
      return
    }

    task.observedElements.set(element, undefined)
    task.resizeObserver?.observe(element)
  }

  // Event-driven alignment: top-align the selected card to scroll-padding, then
  // wait for the scroll to actually finish (scrollend event or a wall-clock
  // stability window — never frame counts) before re-measuring. virtua may
  // remeasure mid-scroll and shift the target, so we allow a bounded number of
  // correction passes. A ResizeObserver re-arms alignment on layout changes.
  const alignSelectedStreamCard = (
    targetEntryId = null,
    { relatedEntryIds = [], skipInitialScroll = false } = {},
  ) => {
    clearPendingStreamAlignment()

    const task = streamAlignmentTaskRef.current
    const controller = new AbortController()
    const { signal } = controller
    task.controller = controller

    const observedEntryIds = new Set(
      [targetEntryId, ...relatedEntryIds]
        .filter((entryId) => entryId !== null && entryId !== undefined)
        .map(String),
    )

    // Hard safety cap for buggy/noisy engines: tear everything down on fire.
    task.maxTimeoutId = globalThis.setTimeout(() => {
      clearPendingStreamAlignment()
    }, STREAM_SCROLL_MAX_SETTLE_TIME_MS)

    const requestRestart = () => {
      // Layout changed: re-arm alignment within the same session by aborting
      // only the current wait, never the session controller.
      task.restartRequested = true
      task.waitController?.abort()
    }

    ensureResizeObserver(signal, requestRestart)

    const revealCard = () => {
      if (targetEntryId === null || !streamVirtualizerRef.current) {
        return
      }

      const scrollElement = getEntryListScrollElement()
      const topOffset = scrollElement ? getStreamCardTopOffset(scrollElement) : 0
      const targetIndex = filteredEntriesState
        .get()
        .findIndex((entry) => entry.id === Number(targetEntryId))

      if (targetIndex !== -1) {
        streamVirtualizerRef.current.scrollToIndex(targetIndex, {
          align: "start",
          offset: -topOffset,
          smooth: settingsState.get().animationsEnabled,
        })
      }
    }

    let correctionCount = 0
    let firstScrollSkipped = false

    const alignOnce = async () => {
      while (!signal.aborted) {
        const scrollElement = getEntryListScrollElement()
        let selectedCard = getSelectedCard(targetEntryId)

        // Card not mounted yet (virtua): reveal it, then wait for the node.
        if (!selectedCard || !scrollElement) {
          if (!scrollElement) {
            return
          }

          revealCard()

          try {
            await waitForElement(entryListRef.current.el, `[data-entry-id="${targetEntryId}"]`, {
              signal,
              timeout: STREAM_CARD_WAIT_TIMEOUT_MS,
            })
          } catch {
            // Aborted or never appeared — let the loop re-check / exit.
          }

          if (signal.aborted) {
            return
          }
          selectedCard = getSelectedCard(targetEntryId)
          if (!selectedCard) {
            return
          }
        }

        observeElement(selectedCard)
        for (const observedEntryId of observedEntryIds) {
          observeElement(getSelectedCard(observedEntryId))
        }

        // Single focus owner (Step 4): focus the card here, once per pass.
        focusStreamCard(selectedCard)

        const { effectiveTopDelta, targetScrollTop } = measureStreamCardAlignment(
          selectedCard,
          scrollElement,
        )

        // Already aligned: never issue a no-op scroll (scrollend would not fire
        // and the stability fallback would just spin).
        if (effectiveTopDelta <= STREAM_SCROLL_ALIGNMENT_TOLERANCE) {
          clearPendingStreamAlignment()
          return
        }

        if (correctionCount >= STREAM_ALIGNMENT_MAX_CORRECTIONS) {
          clearPendingStreamAlignment()
          return
        }

        // When the user just interrupted an in-flight scroll, they're navigating
        // faster than a full native smooth scroll completes. Use a short manual
        // tween ("quick scroll") instead of either a slow smooth scroll (which
        // would creep + jump) or an instant jump (which feels jarring).
        const rapidNav = Date.now() - task.lastInterruptedAt < STREAM_RAPID_NAV_WINDOW_MS

        // Pass 0 with animations on is the only pass that animates; later passes
        // snap "auto" to clean up sub-pixel reflow without a second animation.
        const animateThisPass = correctionCount === 0 && getAnimationScrollBehavior() === "smooth"

        if (skipInitialScroll && !firstScrollSkipped) {
          // A reveal scroll was already issued by the caller (or revealCard).
          // Wait for it to settle once before correcting, rather than firing an
          // immediate competing scroll.
          firstScrollSkipped = true
        } else if (animateThisPass && rapidNav) {
          // Rapid nav: short fixed JS tween. virtua's native smooth is too slow
          // to keep up with fast keypresses, so we accept the per-frame cost for
          // the brief catch-up. The tween also survives virtua's height-
          // compensation write (it re-asserts scrollTop every frame) where a
          // native smooth scroll would be silently cancelled by it.
          const waitController = new AbortController()
          task.waitController = waitController
          const onAbort = () => waitController.abort()
          signal.addEventListener("abort", onAbort, { once: true })

          task.scrollInFlight = true
          const reason = await quickScrollTo(scrollElement, targetScrollTop, {
            signal: waitController.signal,
          })

          signal.removeEventListener("abort", onAbort)
          task.waitController = null
          if (reason !== "aborted") {
            task.scrollInFlight = false
          }
          if (signal.aborted) {
            return
          }
          correctionCount += 1
          task.restartRequested = false
          continue
        } else if (animateThisPass) {
          // Unhurried nav: let virtua own the smooth scroll. Its scrollToIndex
          // uses native (compositor-driven) behavior:"smooth" AND coordinates its
          // own reflow with it, so there's no per-frame main-thread tween fighting
          // virtua's height compensation — which is what made the JS tween judder
          // (dropped frames from forcing a virtua reflow every frame). We then
          // wait for the scroll to settle via the usual event-driven detector.
          const topOffset = getStreamCardTopOffset(scrollElement)
          const targetIndex = filteredEntriesState
            .get()
            .findIndex((entry) => entry.id === Number(targetEntryId))

          if (targetIndex !== -1 && streamVirtualizerRef.current) {
            task.scrollInFlight = true
            streamVirtualizerRef.current.scrollToIndex(targetIndex, {
              align: "start",
              offset: -topOffset,
              smooth: true,
            })
          }
          // Fall through to waitForScrollEnd below (do NOT continue): the same
          // settle-detector handles virtua's smooth scroll, and the loop then
          // re-measures for any sub-pixel correction.
          correctionCount += 1
        } else {
          // Reached only when the JS tween / virtua smooth didn't run: either
          // animations are off (instant nav by design) or this is a correction
          // pass (correctionCount > 0) cleaning up sub-pixel reflow. Both snap
          // "auto" — a correction must not re-animate, animations-off wants the
          // instant jump.
          scrollStreamCardIntoView(selectedCard, scrollElement, "auto", targetScrollTop)
          correctionCount += 1
          task.scrollInFlight = true
        }

        const waitController = new AbortController()
        task.waitController = waitController
        const onAbort = () => waitController.abort()
        signal.addEventListener("abort", onAbort, { once: true })

        const reason = await waitForScrollEnd(scrollElement, {
          signal: waitController.signal,
          timeout: STREAM_SCROLL_END_TIMEOUT_MS,
          stableWindow: STREAM_SCROLL_STABLE_WINDOW_MS,
          expectedTop: targetScrollTop,
        })

        signal.removeEventListener("abort", onAbort)
        task.waitController = null
        // Scroll completed normally (not interrupted) — clear in-flight so a
        // later, unhurried nav animates again.
        if (reason !== "aborted") {
          task.scrollInFlight = false
        }

        if (signal.aborted) {
          return
        }

        // A ResizeObserver restart aborts only the wait; clear the flag and
        // re-measure under the same session.
        task.restartRequested = false
        // Loop back: re-measure (virtua may have shifted the target).
      }
    }

    alignOnce()
  }

  const scrollSelectedCardIntoView = (
    targetEntryId = null,
    { relatedEntryIds = [], skipInitialScroll = false } = {},
  ) => {
    if (!entryListRef.current || !getEntryListScrollElement()) {
      return
    }

    const selectedCard = getSelectedCard(targetEntryId)

    alignSelectedStreamCard(targetEntryId, {
      relatedEntryIds,
      skipInitialScroll: skipInitialScroll || !selectedCard,
    })
  }

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, setSelectedIndex } = usePhotoSlider()
  const { setSettingsModalVisible, setSettingsTabsActiveTab } = useModalToggle()

  const withActiveContent =
    (fn) =>
    (...args) => {
      if (activeContent) {
        return fn(...args)
      }
    }

  const withPhotoSliderCheck =
    (fn) =>
    (...args) => {
      if (isPhotoSliderVisible) {
        return
      }
      return fn(...args)
    }

  const exitDetailView = withActiveContent(
    // eslint-disable-next-line react-hooks/refs
    withPhotoSliderCheck(() => {
      closeActiveContent()
      if (entryListRef.current) {
        entryListRef.current.contentWrapperEl.focus()
      }
    }),
  )

  // eslint-disable-next-line react-hooks/refs
  const navigateToPreviousArticle = withPhotoSliderCheck(() => {
    const previousContent = getAdjacentEntry("prev")
    const { activeContent: latestActiveContent } = contentState.get()

    if (previousContent) {
      handleEntryClick(previousContent)

      globalThis.requestAnimationFrame(() =>
        scrollSelectedCardIntoView(previousContent.id, {
          relatedEntryIds: [latestActiveContent?.id],
        }),
      )
    } else {
      Message.info(polyglot.t("actions.no_previous_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToNextArticle = withPhotoSliderCheck(() => {
    const nextContent = getAdjacentEntry("next")
    const { activeContent: latestActiveContent } = contentState.get()

    if (nextContent) {
      handleEntryClick(nextContent)

      globalThis.requestAnimationFrame(() =>
        scrollSelectedCardIntoView(nextContent.id, {
          relatedEntryIds: [latestActiveContent?.id],
        }),
      )
    } else {
      Message.info(polyglot.t("actions.no_next_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToAdjacentUnreadArticle = withPhotoSliderCheck((direction) => {
    const { activeContent: latestActiveContent } = contentState.get()
    const filteredEntries = filteredEntriesState.get()
    if (!latestActiveContent) {
      return
    }

    const adjacentUnreadEntry = findAdjacentUnreadEntry(
      latestActiveContent.id,
      direction,
      filteredEntries,
    )
    if (adjacentUnreadEntry) {
      handleEntryClick(adjacentUnreadEntry)

      globalThis.requestAnimationFrame(() =>
        scrollSelectedCardIntoView(adjacentUnreadEntry.id, {
          relatedEntryIds: [latestActiveContent.id],
        }),
      )
    } else if (direction === "prev") {
      Message.info(polyglot.t("actions.no_previous_unread_article"))
    } else {
      Message.info(polyglot.t("actions.no_next_unread_article"))
    }
  })

  const navigateToPreviousUnreadArticle = () => navigateToAdjacentUnreadArticle("prev")
  const navigateToNextUnreadArticle = () => navigateToAdjacentUnreadArticle("next")

  const openLinkExternally = withActiveContent(() => {
    window.open(activeContent.url, "_blank")
  })

  const fetchOriginalArticle = withActiveContent((handleFetchContent) => {
    handleFetchContent()
  })

  const saveToThirdPartyServices = withActiveContent((handleSaveToThirdPartyServices) => {
    handleSaveToThirdPartyServices()
  })

  const showHotkeysSettings = () => {
    setSettingsTabsActiveTab("8")
    setSettingsModalVisible(true)
  }

  const toggleReadStatus = withActiveContent((handleUpdateEntry) => {
    handleUpdateEntry()
  })

  const toggleStarStatus = withActiveContent((handleStarEntry) => {
    handleStarEntry()
  })

  const openPhotoSlider = withActiveContent(() => {
    if (isPhotoSliderVisible) {
      setIsPhotoSliderVisible(false)
      return
    }

    const imageSources = activeContent.imageSources ?? extractImageSources(activeContent.content)
    if (imageSources.length === 0) {
      return
    }

    setSelectedIndex(0)
    setIsPhotoSliderVisible(true)
  })

  return {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToNextUnreadArticle,
    navigateToPreviousArticle,
    navigateToPreviousUnreadArticle,
    openLinkExternally,
    openPhotoSlider,
    saveToThirdPartyServices,
    scrollSelectedCardIntoView,
    showHotkeysSettings,
    toggleReadStatus,
    toggleStarStatus,
  }
}

export default useStreamKeyHandlers
