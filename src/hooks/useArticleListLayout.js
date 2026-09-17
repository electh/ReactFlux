import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

const CARD_GRID_GAP = 12
const CARD_GRID_MAX_COLUMNS = 4
const CARD_GRID_MIN_WIDTH = 280
const CARD_GRID_MOBILE_QUERY = "(max-width: 768px)"

const requestFrame = (callback) =>
  typeof globalThis.requestAnimationFrame === "function"
    ? globalThis.requestAnimationFrame(callback)
    : globalThis.setTimeout(callback, 0)

const cancelFrame = (frameId) => {
  if (typeof globalThis.cancelAnimationFrame === "function") {
    globalThis.cancelAnimationFrame(frameId)
  } else {
    globalThis.clearTimeout(frameId)
  }
}

const setRefValue = (ref, value) => {
  if (typeof ref === "function") {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

const getLayoutElement = (scrollRoot) => scrollRoot?.closest?.(".entry-list") ?? scrollRoot

const getCardColumnCount = (layoutElement) => {
  if (!layoutElement || globalThis.matchMedia?.(CARD_GRID_MOBILE_QUERY).matches) {
    return 1
  }

  const { paddingLeft, paddingRight } = globalThis.getComputedStyle(layoutElement)
  const horizontalPadding =
    (Number.parseFloat(paddingLeft) || 0) + (Number.parseFloat(paddingRight) || 0)
  const availableWidth = Math.max(
    0,
    layoutElement.getBoundingClientRect().width - horizontalPadding,
  )
  const columns = Math.floor(
    (availableWidth + CARD_GRID_GAP) / (CARD_GRID_MIN_WIDTH + CARD_GRID_GAP),
  )

  return Math.max(1, Math.min(CARD_GRID_MAX_COLUMNS, columns))
}

const groupEntriesIntoRows = (entries, columnCount) => {
  const rows = []
  for (let index = 0; index < entries.length; index += columnCount) {
    rows.push(entries.slice(index, index + columnCount))
  }
  return rows
}

const useArticleListLayout = ({ entries, layout, scrollRootRef }) => {
  const [cardColumnCount, setCardColumnCount] = useState(1)
  const [scrollRootRevision, setScrollRootRevision] = useState(0)
  const cardColumnCountRef = useRef(1)
  const scrollRootElementRef = useRef(null)
  const virtualizerRef = useRef(null)
  const visibleAnchorRef = useRef(null)
  const pendingAnchorRef = useRef(null)
  const captureFrameRef = useRef(null)
  const restoreFrameRef = useRef(null)

  const captureVisibleAnchor = useCallback(() => {
    const scrollRoot = scrollRootElementRef.current ?? scrollRootRef.current
    if (!scrollRoot) {
      return null
    }

    const rootRect = scrollRoot.getBoundingClientRect()
    const entryElements = scrollRoot.querySelectorAll("[data-entry-id]")

    for (const element of entryElements) {
      const elementRect = element.getBoundingClientRect()
      const isVisible = elementRect.bottom > rootRect.top && elementRect.top < rootRect.bottom
      if (isVisible) {
        const anchor = {
          entryId: Number(element.dataset.entryId),
          offset: elementRect.top - rootRect.top,
        }
        visibleAnchorRef.current = anchor
        return anchor
      }
    }

    return visibleAnchorRef.current
  }, [scrollRootRef])

  const setScrollRoot = useCallback(
    (element) => {
      setRefValue(scrollRootRef, element)

      if (!element || element === scrollRootElementRef.current) {
        return
      }

      pendingAnchorRef.current = visibleAnchorRef.current
      scrollRootElementRef.current = element
      setScrollRootRevision((revision) => revision + 1)
    },
    [scrollRootRef],
  )

  const scheduleAnchorCapture = useCallback(() => {
    if (captureFrameRef.current !== null) {
      return
    }

    captureFrameRef.current = requestFrame(() => {
      captureFrameRef.current = null
      captureVisibleAnchor()
    })
  }, [captureVisibleAnchor])

  useLayoutEffect(() => {
    const scrollRoot = scrollRootElementRef.current ?? scrollRootRef.current
    const layoutElement = getLayoutElement(scrollRoot)
    if (!layoutElement) {
      return
    }

    const updateColumnCount = () => {
      const nextColumnCount = getCardColumnCount(layoutElement)
      if (nextColumnCount === cardColumnCountRef.current) {
        return
      }

      pendingAnchorRef.current = visibleAnchorRef.current ?? captureVisibleAnchor()
      cardColumnCountRef.current = nextColumnCount
      setCardColumnCount(nextColumnCount)
    }

    updateColumnCount()
    scheduleAnchorCapture()

    const mobileMediaQuery = globalThis.matchMedia?.(CARD_GRID_MOBILE_QUERY)
    mobileMediaQuery?.addEventListener?.("change", updateColumnCount)

    if (typeof globalThis.ResizeObserver === "function") {
      const resizeObserver = new globalThis.ResizeObserver(updateColumnCount)
      resizeObserver.observe(layoutElement)
      return () => {
        resizeObserver.disconnect()
        mobileMediaQuery?.removeEventListener?.("change", updateColumnCount)
      }
    }

    globalThis.addEventListener?.("resize", updateColumnCount)
    return () => {
      globalThis.removeEventListener?.("resize", updateColumnCount)
      mobileMediaQuery?.removeEventListener?.("change", updateColumnCount)
    }
  }, [captureVisibleAnchor, layout, scheduleAnchorCapture, scrollRootRef, scrollRootRevision])

  const previousStructureRef = useRef(null)

  useLayoutEffect(() => {
    const previousStructure = previousStructureRef.current
    const currentStructure = { cardColumnCount, layout, scrollRootRevision }
    previousStructureRef.current = currentStructure

    if (!previousStructure) {
      scheduleAnchorCapture()
      return
    }

    const layoutChanged = previousStructure.layout !== layout
    const cardColumnCountChanged =
      previousStructure.cardColumnCount !== cardColumnCount &&
      (previousStructure.layout === "card" || layout === "card")
    const scrollRootChanged = previousStructure.scrollRootRevision !== scrollRootRevision

    if (!layoutChanged && !cardColumnCountChanged && !scrollRootChanged) {
      pendingAnchorRef.current = null
      scheduleAnchorCapture()
      return
    }

    const anchor = pendingAnchorRef.current ?? visibleAnchorRef.current
    pendingAnchorRef.current = null
    if (!anchor || !Number.isFinite(anchor.entryId)) {
      scheduleAnchorCapture()
      return
    }

    const entryIndex = entries.findIndex((entry) => Number(entry.id) === anchor.entryId)
    if (entryIndex === -1) {
      scheduleAnchorCapture()
      return
    }

    const virtualIndex = layout === "card" ? Math.floor(entryIndex / cardColumnCount) : entryIndex
    const offset = Math.max(0, -anchor.offset)

    if (restoreFrameRef.current !== null) {
      cancelFrame(restoreFrameRef.current)
    }
    restoreFrameRef.current = requestFrame(() => {
      restoreFrameRef.current = null
      virtualizerRef.current?.scrollToIndex(virtualIndex, { align: "start", offset })
      scheduleAnchorCapture()
    })
  }, [cardColumnCount, entries, layout, scheduleAnchorCapture, scrollRootRevision])

  useEffect(
    () => () => {
      if (captureFrameRef.current !== null) {
        cancelFrame(captureFrameRef.current)
      }
      if (restoreFrameRef.current !== null) {
        cancelFrame(restoreFrameRef.current)
      }
    },
    [],
  )

  const virtualItems = useMemo(
    () => (layout === "card" ? groupEntriesIntoRows(entries, cardColumnCount) : entries),
    [cardColumnCount, entries, layout],
  )
  const scrollRootKey = Math.max(0, scrollRootRevision - 1)
  const virtualizerKey = `${layout === "card" ? `card-${cardColumnCount}` : layout}-root-${scrollRootKey}`

  return {
    cardColumnCount,
    handleVirtualizerScroll: scheduleAnchorCapture,
    setScrollRoot,
    virtualItems,
    virtualizerKey,
    virtualizerRef,
  }
}

export default useArticleListLayout
