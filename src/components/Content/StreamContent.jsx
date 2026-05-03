import { Button } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useRef } from "react"
import { useParams } from "react-router"

import StoryStream from "./StoryStream"

import { getEntry } from "@/apis"
import useAppData from "@/hooks/useAppData"
import useArticleList from "@/hooks/useArticleList"
import useContentContext from "@/hooks/useContentContext"
import useDocumentTitle from "@/hooks/useDocumentTitle"
import { polyglotState } from "@/hooks/useLanguage"
import useStreamHotkeys from "@/hooks/useStreamHotkeys"
import useStreamKeyHandlers from "@/hooks/useStreamKeyHandlers"
import {
  contentState,
  filteredEntriesState,
  setActiveContent,
  setInfoFrom,
  setInfoId,
  setIsArticleLoading,
} from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { duplicateHotkeysState } from "@/store/hotkeysState"
import { settingsState } from "@/store/settingsState"
import { Notification } from "@/utils/feedback"
import { parseCoverImage } from "@/utils/images"
import { extractEntryIdFromPath } from "@/utils/url"

import "./Content.css"

const getFilteredEntryIndex = (entryId) =>
  filteredEntriesState.get().findIndex((entry) => Number(entry.id) === Number(entryId))

const isEntryInFilteredEntries = (entryId) => getFilteredEntryIndex(entryId) !== -1
const STREAM_FOCUS_MAX_ATTEMPTS = 120
const STREAM_FOCUS_STABLE_FRAMES = 6
const STREAM_REVEAL_ALIGNMENT_TOLERANCE = 2

const getStreamTopOffset = (scrollElement) => {
  const computedStyle = globalThis.getComputedStyle(scrollElement)
  const scrollPaddingTop =
    computedStyle.scrollPaddingTop || computedStyle.scrollPaddingBlockStart || ""
  const parsedOffset = Number.parseFloat(scrollPaddingTop)

  return Number.isFinite(parsedOffset) ? parsedOffset : 0
}

const isStreamCardTopAligned = (card, scrollElement) => {
  const cardRect = card.getBoundingClientRect()
  const scrollRect = scrollElement.getBoundingClientRect()
  const topOffset = getStreamTopOffset(scrollElement)

  return Math.abs(cardRect.top - scrollRect.top - topOffset) <= STREAM_REVEAL_ALIGNMENT_TOLERANCE
}

const StreamContent = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, entries, filterDate, filterString, isArticleListReady } =
    useStore(contentState)
  const filteredEntries = useStore(filteredEntriesState)
  const { isAppDataReady } = useStore(dataState)
  const { orderBy, orderDirection, showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const duplicateHotkeys = useStore(duplicateHotkeysState)

  const cardsRef = useRef(null)
  const streamVirtualizerRef = useRef(null)

  const { entryId } = useParams()

  useDocumentTitle()

  const { entryListRef, flushPendingMarkAsRead, handleEntryClick, scheduleMarkAsRead } =
    useContentContext()
  const { showHotkeysSettings } = useStreamKeyHandlers({ streamVirtualizerRef })

  const { fetchAppData, fetchFeedRelatedData } = useAppData()
  const { fetchArticleList } = useArticleList(info)

  const contentSplitRef = useRef(null)
  const hasAppliedOrderChange = useRef(false)
  const hasAppliedFilterChange = useRef(false)
  const infoFromRef = useRef(info.from)
  const fetchArticleListOnlyRef = useRef(null)
  const fetchArticleListWithRelatedDataRef = useRef(null)
  const autoFocusedEntryRef = useRef(null)
  const pendingSingleEntryIdRef = useRef(null)

  const resetStreamScrollPosition = useCallback(() => {
    const scrollElement =
      entryListRef.current?.getScrollElement?.() || entryListRef.current?.contentWrapperEl

    if (scrollElement) {
      scrollElement.scrollTop = 0
    }
  }, [entryListRef])

  const revealStreamCard = useCallback(
    (entryId) => {
      const entryList = entryListRef.current
      if (!entryList) {
        return false
      }

      const scrollElement = entryList.getScrollElement?.() || entryList.contentWrapperEl
      const targetIndex = getFilteredEntryIndex(entryId)

      if (targetIndex === 0 && scrollElement) {
        // Direct assignment bypasses CSS scroll-behavior: smooth on the stream scroller.
        scrollElement.scrollTop = 0
        return true
      }

      if (targetIndex !== -1) {
        streamVirtualizerRef.current?.scrollToIndex(targetIndex, {
          align: "start",
          smooth: false,
        })
        return true
      }

      return false
    },
    [entryListRef],
  )

  const focusStreamCard = useCallback(
    (entryId, { reveal = false } = {}) => {
      const targetId = String(entryId)
      let stableFrames = 0

      const focusCard = (attempt = 0) => {
        const scrollElement =
          entryListRef.current?.getScrollElement?.() || entryListRef.current?.contentWrapperEl
        const card = entryListRef.current?.el?.querySelector(`[data-entry-id="${targetId}"]`)

        if (!card) {
          if (reveal) {
            revealStreamCard(entryId)
          }

          scrollElement?.focus?.({ preventScroll: true })

          if (attempt < STREAM_FOCUS_MAX_ATTEMPTS) {
            globalThis.requestAnimationFrame(() => focusCard(attempt + 1))
          }
          return
        }

        if (reveal) {
          revealStreamCard(entryId)
        }

        if (document.activeElement === card) {
          stableFrames += 1
        } else {
          document.activeElement?.blur?.()
          card.focus({ preventScroll: true })
          stableFrames = 0
        }

        if (reveal && scrollElement && !isStreamCardTopAligned(card, scrollElement)) {
          stableFrames = 0
        }

        if (stableFrames < STREAM_FOCUS_STABLE_FRAMES && attempt < STREAM_FOCUS_MAX_ATTEMPTS) {
          globalThis.requestAnimationFrame(() => focusCard(attempt + 1))
        }
      }

      globalThis.requestAnimationFrame(() => focusCard())
    },
    [entryListRef, revealStreamCard],
  )

  const focusFirstStreamCard = useCallback(() => {
    const firstEntry = filteredEntriesState.get()[0]
    if (!firstEntry) {
      flushPendingMarkAsRead()
      setActiveContent(null)
      return
    }

    setActiveContent(firstEntry)
    scheduleMarkAsRead(firstEntry)
    focusStreamCard(firstEntry.id, { reveal: true })
  }, [flushPendingMarkAsRead, focusStreamCard, scheduleMarkAsRead])

  const fetchArticleListOnly = useCallback(
    async (options = {}) => {
      const { focusFirstInStream = false } = options
      if (!isAppDataReady) {
        await fetchAppData()
      }
      if (focusFirstInStream) {
        resetStreamScrollPosition()
      }
      await fetchArticleList(getEntries)
      if (focusFirstInStream) {
        focusFirstStreamCard()
      }
    },
    [
      isAppDataReady,
      fetchArticleList,
      getEntries,
      fetchAppData,
      focusFirstStreamCard,
      resetStreamScrollPosition,
    ],
  )

  const fetchArticleListWithRelatedData = useCallback(
    async (options = {}) => {
      const { focusFirstInStream = false } = options
      const needsAppData = !isAppDataReady

      if (!isAppDataReady) {
        await fetchAppData()
      }

      if (focusFirstInStream) {
        resetStreamScrollPosition()
      }
      await fetchArticleList(getEntries)
      if (!needsAppData) {
        await fetchFeedRelatedData()
      }
      if (focusFirstInStream) {
        focusFirstStreamCard()
      }
    },
    [
      isAppDataReady,
      fetchAppData,
      fetchArticleList,
      getEntries,
      fetchFeedRelatedData,
      focusFirstStreamCard,
      resetStreamScrollPosition,
    ],
  )

  useEffect(() => {
    infoFromRef.current = info.from
  }, [info.from])

  useEffect(() => {
    fetchArticleListOnlyRef.current = fetchArticleListOnly
  }, [fetchArticleListOnly])

  useEffect(() => {
    fetchArticleListWithRelatedDataRef.current = fetchArticleListWithRelatedData
  }, [fetchArticleListWithRelatedData])

  // Listen for external refresh requests (e.g., clicking an already-active sidebar item)
  useEffect(() => {
    const handler = (e) => {
      try {
        const { from, id } = e.detail || {}
        if (!from) {
          return
        }

        if (String(info.from) === String(from) && String(info.id) === String(id)) {
          const fullRefreshTargets = ["category", "feed", "all", "today", "starred", "history"]
          if (fullRefreshTargets.includes(String(info.from))) {
            fetchArticleListWithRelatedData({ focusFirstInStream: true })
          } else {
            fetchArticleListOnly({ focusFirstInStream: true })
          }
        }
      } catch (error) {
        console.error("Error handling refresh event:", error)
      }
    }

    globalThis.addEventListener("reloadedflux:refresh", handler)
    return () => globalThis.removeEventListener("reloadedflux:refresh", handler)
  }, [info, fetchArticleListOnly, fetchArticleListWithRelatedData])

  const fetchSingleEntry = useCallback(
    async (entryId) => {
      // Prevent repeated URL-entry fetches while contentState updates re-run effects.
      if (String(pendingSingleEntryIdRef.current) === String(entryId)) {
        return
      }

      const { activeContent: latestActiveContent } = contentState.get()
      if (Number(latestActiveContent?.id) === Number(entryId)) {
        return
      }

      const existingEntry = entries.find((entry) => entry.id === Number(entryId))

      if (existingEntry) {
        const { isArticleListReady: latestIsArticleListReady } = contentState.get()
        if (latestIsArticleListReady && !isEntryInFilteredEntries(entryId)) {
          return
        }

        setActiveContent(existingEntry)
        return
      }

      try {
        pendingSingleEntryIdRef.current = entryId
        setIsArticleLoading(true)
        const entry = parseCoverImage(await getEntry(entryId))
        const currentEntryId = extractEntryIdFromPath(globalThis.location?.pathname || "")
        if (String(currentEntryId) !== String(entryId)) {
          return
        }

        const { isArticleListReady: latestIsArticleListReady } = contentState.get()
        if (latestIsArticleListReady && !isEntryInFilteredEntries(entryId)) {
          return
        }

        setActiveContent(entry)
      } catch (error) {
        console.error("Failed to fetch entry:", error)
      } finally {
        if (String(pendingSingleEntryIdRef.current) === String(entryId)) {
          pendingSingleEntryIdRef.current = null
        }
        setIsArticleLoading(false)
      }
    },
    [entries],
  )

  useStreamHotkeys({
    handleRefreshArticleList: fetchArticleListWithRelatedData,
    streamVirtualizerRef,
  })

  useEffect(() => {
    if (duplicateHotkeys.length > 0) {
      const id = "duplicate-hotkeys"
      Notification.error({
        id,
        title: polyglot.t("settings.duplicate_hotkeys"),
        duration: 0,
        btn: (
          <span>
            <Button
              size="small"
              style={{ marginRight: 8 }}
              type="secondary"
              onClick={() => Notification.remove(id)}
            >
              {polyglot.t("actions.dismiss")}
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                showHotkeysSettings()
                Notification.remove(id)
              }}
            >
              {polyglot.t("actions.check")}
            </Button>
          </span>
        ),
      })
    }
  }, [duplicateHotkeys, polyglot, showHotkeysSettings])

  useEffect(() => {
    setInfoFrom(info.from)
    setInfoId(info.id)
    setActiveContent(null)
    autoFocusedEntryRef.current = null
    if (info.from === "category") {
      fetchArticleListWithRelatedDataRef.current?.({ focusFirstInStream: true })
    } else {
      fetchArticleListOnlyRef.current?.({ focusFirstInStream: true })
    }
  }, [info])

  useEffect(() => {
    if (!hasAppliedOrderChange.current) {
      hasAppliedOrderChange.current = true
      return
    }

    if (["starred", "history"].includes(infoFromRef.current)) {
      return
    }
    fetchArticleListOnlyRef.current?.()
  }, [orderBy])

  useEffect(() => {
    if (!hasAppliedFilterChange.current) {
      hasAppliedFilterChange.current = true
      return
    }

    fetchArticleListOnlyRef.current?.()
  }, [filterDate, filterString, orderDirection, showStatus])

  useEffect(() => {
    if (!entryId) {
      return
    }

    const entryIdNumber = Number(entryId)
    if (Number(activeContent?.id) === entryIdNumber) {
      return
    }

    const entryInEntries = entries.some((entry) => Number(entry.id) === entryIdNumber)
    const entryInFilteredEntries = filteredEntries.some(
      (entry) => Number(entry.id) === entryIdNumber,
    )

    if (!entryInEntries && (!isArticleListReady || entryInFilteredEntries)) {
      fetchSingleEntry(entryId)
    }
  }, [entryId, activeContent?.id, entries, filteredEntries, isArticleListReady, fetchSingleEntry])

  useEffect(() => {
    if (!isArticleListReady) {
      autoFocusedEntryRef.current = null
      return
    }

    const firstEntry = filteredEntries[0]
    if (!firstEntry) {
      return
    }

    const urlEntryId = entryId ? Number(entryId) : null
    const urlEntryInList = urlEntryId
      ? filteredEntries.find((entry) => Number(entry.id) === urlEntryId)
      : null

    const activeEntryInList = activeContent
      ? filteredEntries.some((entry) => Number(entry.id) === Number(activeContent.id))
      : false
    const target = urlEntryInList || (activeEntryInList ? null : firstEntry)

    if (!target) {
      return
    }

    if (!activeContent || activeContent.id !== target.id) {
      setActiveContent(target)
      scheduleMarkAsRead(target)
    }

    if (autoFocusedEntryRef.current !== target.id) {
      autoFocusedEntryRef.current = target.id
      focusStreamCard(target.id, { reveal: true })
    }
  }, [
    info.from,
    info.id,
    isArticleListReady,
    activeContent,
    focusStreamCard,
    entryId,
    filteredEntries,
    scheduleMarkAsRead,
  ])

  return (
    <div ref={contentSplitRef} className="content-split">
      <StoryStream
        cardsRef={cardsRef}
        entryListRef={entryListRef}
        getEntries={getEntries}
        handleEntryClick={handleEntryClick}
        info={info}
        markAllAsRead={markAllAsRead}
        streamVirtualizerRef={streamVirtualizerRef}
      />
    </div>
  )
}

export default StreamContent
