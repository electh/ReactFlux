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

import "./Content.css"

const StreamContent = ({ info, getEntries, markAllAsRead }) => {
  const { entries, filterDate, filterString } = useStore(contentState)
  const { isAppDataReady } = useStore(dataState)
  const { orderBy, orderDirection, showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const duplicateHotkeys = useStore(duplicateHotkeysState)

  const cardsRef = useRef(null)
  const streamVirtualizerRef = useRef(null)

  const params = useParams()

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

  const focusFirstStreamCard = useCallback(() => {
    const firstEntry = filteredEntriesState.get()[0]
    if (!firstEntry) {
      flushPendingMarkAsRead()
      setActiveContent(null)
      return
    }

    setActiveContent(firstEntry)
    scheduleMarkAsRead(firstEntry)

    const focusSelectedCard = (attempt = 0) => {
      const entryList = entryListRef.current
      if (!entryList) {
        if (attempt < 8) {
          globalThis.requestAnimationFrame(() => focusSelectedCard(attempt + 1))
        }
        return
      }

      const scrollElement = entryList.getScrollElement?.() || entryList.contentWrapperEl
      if (scrollElement) {
        scrollElement.scrollTo({ top: 0, behavior: "auto" })
      }

      const selectedCard = entryList.el?.querySelector(".card-wrapper.selected")
      if (selectedCard) {
        selectedCard.focus({ preventScroll: true })
        return
      }

      if (attempt < 8) {
        globalThis.requestAnimationFrame(() => focusSelectedCard(attempt + 1))
      }
    }

    globalThis.requestAnimationFrame(() => focusSelectedCard())
  }, [entryListRef, flushPendingMarkAsRead, scheduleMarkAsRead])

  const fetchArticleListOnly = useCallback(
    async (options = {}) => {
      const { focusFirstInStream = false } = options
      if (!isAppDataReady) {
        await fetchAppData()
      }
      await fetchArticleList(getEntries)
      if (focusFirstInStream) {
        focusFirstStreamCard()
      }
    },
    [isAppDataReady, fetchArticleList, getEntries, fetchAppData, focusFirstStreamCard],
  )

  const fetchArticleListWithRelatedData = useCallback(
    async (options = {}) => {
      const { focusFirstInStream = false } = options
      const needsAppData = !isAppDataReady

      if (!isAppDataReady) {
        await fetchAppData()
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
      const existingEntry = entries.find((entry) => entry.id === Number(entryId))

      if (existingEntry) {
        setActiveContent(existingEntry)
        return
      }

      try {
        setIsArticleLoading(true)
        const entry = parseCoverImage(await getEntry(entryId))
        setActiveContent(entry)
      } catch (error) {
        console.error("Failed to fetch entry:", error)
      } finally {
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
    const { entryId } = params
    if (entryId && !entries.some((entry) => entry.id === Number(entryId))) {
      fetchSingleEntry(entryId)
    }
  }, [params, entries, fetchSingleEntry])

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
