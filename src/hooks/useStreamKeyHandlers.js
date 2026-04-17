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

const STREAM_CARD_TOP_OFFSET_FALLBACK = 18
const STREAM_SCROLL_ALIGNMENT_TOLERANCE = 4
const STREAM_SCROLL_INITIAL_ALIGNMENT_DELAY_MS = 220
const STREAM_SCROLL_MAX_SETTLE_TIME_MS = 2600
const STREAM_SCROLL_QUIET_FRAME_TARGET = 20
const STREAM_SCROLL_STABLE_FRAME_TARGET = 6

const getStreamCardTopOffset = (scrollElement) => {
  const computedStyle = globalThis.getComputedStyle(scrollElement)
  const scrollPaddingTop =
    computedStyle.scrollPaddingTop || computedStyle.scrollPaddingBlockStart || ""
  const parsedOffset = Number.parseFloat(scrollPaddingTop)

  return Number.isFinite(parsedOffset) ? parsedOffset : STREAM_CARD_TOP_OFFSET_FALLBACK
}

const getStreamCardScrollTop = (selectedCard, scrollElement) => {
  const containerRect = scrollElement.getBoundingClientRect()
  const selectedRect = selectedCard.getBoundingClientRect()
  const topOffset = getStreamCardTopOffset(scrollElement)

  return Math.max(0, scrollElement.scrollTop + selectedRect.top - containerRect.top - topOffset)
}

const getAnimationScrollBehavior = () => (settingsState.get().animationsEnabled ? "smooth" : "auto")

const scrollStreamCardIntoView = (
  selectedCard,
  scrollElement,
  behavior = getAnimationScrollBehavior(),
) => {
  scrollElement.scrollTo({
    behavior,
    top: getStreamCardScrollTop(selectedCard, scrollElement),
  })
}

const getStreamCardTopDelta = (selectedCard, scrollElement) => {
  const containerRect = scrollElement.getBoundingClientRect()
  const selectedRect = selectedCard.getBoundingClientRect()
  const topOffset = getStreamCardTopOffset(scrollElement)

  return Math.abs(selectedRect.top - containerRect.top - topOffset)
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
    delayTimeoutId: null,
    frameId: null,
    maxTimeoutId: null,
    observedElements: new Set(),
    resizeObserver: null,
    sessionId: 0,
  })

  const clearPendingStreamAlignment = () => {
    const task = streamAlignmentTaskRef.current

    if (task.frameId !== null) {
      globalThis.cancelAnimationFrame(task.frameId)
      task.frameId = null
    }

    if (task.delayTimeoutId !== null) {
      globalThis.clearTimeout(task.delayTimeoutId)
      task.delayTimeoutId = null
    }

    if (task.maxTimeoutId !== null) {
      globalThis.clearTimeout(task.maxTimeoutId)
      task.maxTimeoutId = null
    }

    if (task.resizeObserver) {
      task.resizeObserver.disconnect()
      task.resizeObserver = null
    }

    task.observedElements = new Set()
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
    const currentIndex = entries.findIndex((entry) => entry.id === latestActiveContent.id)
    if (currentIndex === -1) {
      return null
    }

    const step = direction === "prev" ? -1 : 1
    return entries[currentIndex + step] ?? null
  }

  const alignSelectedStreamCard = (
    targetEntryId = null,
    { relatedEntryIds = [], skipInitialScroll = false } = {},
  ) => {
    clearPendingStreamAlignment()

    const task = streamAlignmentTaskRef.current
    const sessionId = task.sessionId + 1
    const observedEntryIds = new Set(
      [targetEntryId, ...relatedEntryIds]
        .filter((entryId) => entryId !== null && entryId !== undefined)
        .map(String),
    )
    let stableFrameCount = 0
    let lastTargetScrollTop = null
    let quietFrameCount = 0
    let shouldSkipNextScroll = skipInitialScroll

    task.sessionId = sessionId

    const isCurrentSession = () => streamAlignmentTaskRef.current.sessionId === sessionId

    task.maxTimeoutId = globalThis.setTimeout(() => {
      if (!isCurrentSession()) {
        return
      }

      clearPendingStreamAlignment()
    }, STREAM_SCROLL_MAX_SETTLE_TIME_MS)

    const ensureResizeObserver = () => {
      if (streamAlignmentTaskRef.current.resizeObserver || typeof ResizeObserver !== "function") {
        return
      }

      const observer = new ResizeObserver(() => {
        if (!isCurrentSession()) {
          return
        }

        stableFrameCount = 0
        quietFrameCount = 0

        if (streamAlignmentTaskRef.current.delayTimeoutId !== null) {
          globalThis.clearTimeout(streamAlignmentTaskRef.current.delayTimeoutId)
          streamAlignmentTaskRef.current.delayTimeoutId = null
        }

        if (streamAlignmentTaskRef.current.frameId !== null) {
          globalThis.cancelAnimationFrame(streamAlignmentTaskRef.current.frameId)
        }

        streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
      })

      streamAlignmentTaskRef.current.resizeObserver = observer
    }

    const observeElement = (element) => {
      if (
        !element ||
        !(element instanceof Element) ||
        streamAlignmentTaskRef.current.observedElements.has(element)
      ) {
        return
      }

      streamAlignmentTaskRef.current.observedElements.add(element)

      if (streamAlignmentTaskRef.current.resizeObserver) {
        streamAlignmentTaskRef.current.resizeObserver.observe(element)
      }
    }

    const scheduleAlignmentRetry = () => {
      if (streamAlignmentTaskRef.current.delayTimeoutId !== null) {
        globalThis.clearTimeout(streamAlignmentTaskRef.current.delayTimeoutId)
      }

      streamAlignmentTaskRef.current.delayTimeoutId = globalThis.setTimeout(() => {
        if (!isCurrentSession()) {
          return
        }

        streamAlignmentTaskRef.current.delayTimeoutId = null
        streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
      }, STREAM_SCROLL_INITIAL_ALIGNMENT_DELAY_MS)
    }

    function settleAlignment() {
      if (!isCurrentSession()) {
        return
      }

      const selectedCard = getSelectedCard(targetEntryId)
      const scrollElement = getEntryListScrollElement()

      if (!selectedCard || !scrollElement) {
        streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
        return
      }

      ensureResizeObserver()
      observeElement(selectedCard)

      for (const observedEntryId of observedEntryIds) {
        observeElement(getSelectedCard(observedEntryId))
      }

      focusStreamCard(selectedCard)

      const targetScrollTop = getStreamCardScrollTop(selectedCard, scrollElement)
      const targetScrollDelta =
        lastTargetScrollTop === null ? 0 : Math.abs(targetScrollTop - lastTargetScrollTop)
      const topDelta = getStreamCardTopDelta(selectedCard, scrollElement)
      const maxScrollTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight)
      const isClampedToStart =
        targetScrollTop <= STREAM_SCROLL_ALIGNMENT_TOLERANCE &&
        scrollElement.scrollTop <= STREAM_SCROLL_ALIGNMENT_TOLERANCE
      const isClampedToEnd =
        targetScrollTop >= maxScrollTop - STREAM_SCROLL_ALIGNMENT_TOLERANCE &&
        scrollElement.scrollTop >= maxScrollTop - STREAM_SCROLL_ALIGNMENT_TOLERANCE
      const effectiveTopDelta = isClampedToStart || isClampedToEnd ? 0 : topDelta

      lastTargetScrollTop = targetScrollTop
      quietFrameCount += 1

      if (targetScrollDelta > STREAM_SCROLL_ALIGNMENT_TOLERANCE) {
        stableFrameCount = 0
      } else {
        stableFrameCount += 1
      }

      if (effectiveTopDelta <= STREAM_SCROLL_ALIGNMENT_TOLERANCE) {
        if (
          stableFrameCount >= STREAM_SCROLL_STABLE_FRAME_TARGET &&
          quietFrameCount >= STREAM_SCROLL_QUIET_FRAME_TARGET
        ) {
          clearPendingStreamAlignment()
        } else {
          streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
        }
        return
      }

      if (stableFrameCount < STREAM_SCROLL_STABLE_FRAME_TARGET) {
        streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
        return
      }

      stableFrameCount = 0

      if (shouldSkipNextScroll) {
        shouldSkipNextScroll = false
        scheduleAlignmentRetry()
        return
      }

      scrollStreamCardIntoView(selectedCard, scrollElement)
      quietFrameCount = 0
      scheduleAlignmentRetry()
    }

    streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
  }

  const scrollSelectedCardIntoView = (
    targetEntryId = null,
    { relatedEntryIds = [], skipInitialScroll = false } = {},
  ) => {
    if (entryListRef.current) {
      const scrollElement = getEntryListScrollElement()
      const topOffset = scrollElement ? getStreamCardTopOffset(scrollElement) : 0
      const selectedCard = getSelectedCard(targetEntryId)

      if (scrollElement) {
        if (!selectedCard && targetEntryId !== null && streamVirtualizerRef.current) {
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

        alignSelectedStreamCard(targetEntryId, {
          relatedEntryIds,
          skipInitialScroll: skipInitialScroll || !selectedCard,
        })
      }
    }
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
    showHotkeysSettings,
    toggleReadStatus,
    toggleStarStatus,
  }
}

export default useStreamKeyHandlers
