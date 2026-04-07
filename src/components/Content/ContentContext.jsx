import { useStore } from "@nanostores/react"
import { createContext, useCallback, useEffect, useMemo, useRef } from "react"
import { useLocation, useNavigate } from "react-router"

import { updateEntriesStatus } from "@/apis"
import useEntryActions from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setActiveContent, setIsArticleLoading } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { ANIMATION_DURATION_MS } from "@/utils/constants"
import { Message } from "@/utils/feedback"
import { getEntryImageSources, preloadImageMetadata } from "@/utils/images"
import { buildEntryDetailPath, extractBasePath, isEntryDetailPath } from "@/utils/url"

const Context = createContext()

export const ContextProvider = ({ children }) => {
  const { polyglot } = useStore(polyglotState)
  const { markReadAfterSeconds, markReadBy } = useStore(settingsState)

  const entryDetailRef = useRef(null)
  const entryListRef = useRef(null)
  const streamVirtualizerRef = useRef(null)
  const pendingReadTimerRef = useRef(null)
  const pendingReadEntryRef = useRef(null)
  const pendingReadEntryIdRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const { handleEntryStatusUpdate } = useEntryActions()

  const clearPendingMarkAsRead = useCallback(() => {
    if (pendingReadTimerRef.current !== null) {
      globalThis.clearTimeout(pendingReadTimerRef.current)
      pendingReadTimerRef.current = null
    }

    pendingReadEntryRef.current = null
    pendingReadEntryIdRef.current = null
  }, [])

  const markEntryAsRead = useCallback(
    (entry, { restoreActiveOnError = false } = {}) => {
      const { activeContent, entries } = contentState.get()
      const latestEntry =
        entries.find((currentEntry) => currentEntry.id === entry.id) ?? activeContent

      if (latestEntry?.status !== "unread") {
        return
      }

      handleEntryStatusUpdate(entry, "read")
      updateEntriesStatus([entry.id], "read").catch(() => {
        Message.error(polyglot.t("content.mark_as_read_error"))
        if (restoreActiveOnError && contentState.get().activeContent?.id === entry.id) {
          setActiveContent({ ...entry, status: "unread" })
        }
        handleEntryStatusUpdate(entry, "unread")
      })
    },
    [handleEntryStatusUpdate, polyglot],
  )

  const flushPendingMarkAsRead = useCallback(() => {
    const pendingEntry = pendingReadEntryRef.current
    clearPendingMarkAsRead()

    if (pendingEntry) {
      markEntryAsRead(pendingEntry)
    }
  }, [clearPendingMarkAsRead, markEntryAsRead])

  const cancelPendingMarkAsRead = useCallback(() => {
    clearPendingMarkAsRead()
  }, [clearPendingMarkAsRead])

  const scheduleMarkAsRead = useCallback(
    (entry) => {
      if (pendingReadEntryIdRef.current === entry.id) {
        clearPendingMarkAsRead()
      } else {
        flushPendingMarkAsRead()
      }

      if (markReadBy !== "view" || entry.status !== "unread") {
        return
      }

      pendingReadEntryRef.current = entry
      pendingReadEntryIdRef.current = entry.id
      pendingReadTimerRef.current = globalThis.setTimeout(() => {
        pendingReadTimerRef.current = null

        const latestActiveContent = contentState.get().activeContent
        const isStillActive =
          !document.hidden &&
          pendingReadEntryIdRef.current === entry.id &&
          latestActiveContent?.id === entry.id

        clearPendingMarkAsRead()

        if (!isStillActive) {
          return
        }

        markEntryAsRead(entry, { restoreActiveOnError: true })
      }, markReadAfterSeconds * 1000)
    },
    [
      clearPendingMarkAsRead,
      flushPendingMarkAsRead,
      markEntryAsRead,
      markReadAfterSeconds,
      markReadBy,
    ],
  )

  useEffect(() => cancelPendingMarkAsRead, [cancelPendingMarkAsRead])

  const closeActiveContent = useCallback(() => {
    flushPendingMarkAsRead()
    setActiveContent(null)

    const currentPath = location.pathname
    const basePath = extractBasePath(currentPath)

    if (isEntryDetailPath(currentPath) && basePath) {
      navigate(basePath)
    }
  }, [flushPendingMarkAsRead, location.pathname, navigate])

  const handleEntryClick = useCallback(
    async (entry) => {
      setIsArticleLoading(true)
      flushPendingMarkAsRead()

      if (settingsState.get().layoutMode === "stream") {
        const imageSources = getEntryImageSources(entry)

        if (imageSources.length > 0) {
          await Promise.allSettled(
            imageSources.map((imageSource) => preloadImageMetadata(imageSource)),
          )
        }
      }

      const shouldAutoMarkAsRead = markReadBy === "view"
      setActiveContent(entry)

      const currentPath = location.pathname
      const basePath = extractBasePath(currentPath)
      const entryDetailPath = buildEntryDetailPath(basePath, entry.id)

      navigate(entryDetailPath)

      setTimeout(() => {
        const articleContent = entryDetailRef.current
        if (articleContent) {
          const contentWrapper = articleContent.querySelector(".simplebar-content-wrapper")
          if (contentWrapper) {
            contentWrapper.scroll({ top: 0 })
          }
          articleContent.focus()
        }

        setIsArticleLoading(false)
        if (shouldAutoMarkAsRead) {
          scheduleMarkAsRead(entry)
        }
      }, ANIMATION_DURATION_MS)
    },
    [flushPendingMarkAsRead, location.pathname, markReadBy, navigate, scheduleMarkAsRead],
  )

  const value = useMemo(
    () => ({
      entryDetailRef,
      entryListRef,
      streamVirtualizerRef,
      scheduleMarkAsRead,
      flushPendingMarkAsRead,
      cancelPendingMarkAsRead,
      handleEntryClick,
      setActiveContent,
      closeActiveContent,
    }),
    [
      cancelPendingMarkAsRead,
      closeActiveContent,
      flushPendingMarkAsRead,
      handleEntryClick,
      scheduleMarkAsRead,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const ContentContext = Context
