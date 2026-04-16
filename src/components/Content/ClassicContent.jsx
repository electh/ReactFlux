import { Button, Typography } from "@arco-design/web-react"
import { IconEmpty, IconLeft, IconRight } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useParams } from "react-router"
import { useSwipeable } from "react-swipeable"

import FooterPanel from "./FooterPanel"

import { getEntry } from "@/apis"
import ActionButtons from "@/components/Article/ActionButtons"
import ArticleDetail from "@/components/Article/ArticleDetail"
import ArticleList from "@/components/Article/ArticleList"
import ClassicSearchBar from "@/components/Article/ClassicSearchBar"
import FadeTransition from "@/components/ui/FadeTransition"
import useAppData from "@/hooks/useAppData"
import useArticleList from "@/hooks/useArticleList"
import useClassicHotkeys from "@/hooks/useClassicHotkeys"
import useClassicKeyHandlers from "@/hooks/useClassicKeyHandlers"
import useContentContext from "@/hooks/useContentContext"
import useDocumentTitle from "@/hooks/useDocumentTitle"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  setActiveContent,
  setInfoFrom,
  setInfoId,
  setIsArticleLoading,
} from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { duplicateHotkeysState } from "@/store/hotkeysState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { Notification } from "@/utils/feedback"
import { parseCoverImage } from "@/utils/images"

import "./Content.css"

const ClassicContent = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, entries, filterDate, filterString, isArticleLoading } =
    useStore(contentState)
  const { isAppDataReady } = useStore(dataState)
  const {
    enableSwipeGesture,
    entryListWidth: storedEntryListWidth,
    orderBy,
    orderDirection,
    showStatus,
    swipeSensitivity,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const duplicateHotkeys = useStore(duplicateHotkeysState)

  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [isSwipingRight, setIsSwipingRight] = useState(false)
  const cardsRef = useRef(null)

  const location = useLocation()
  const params = useParams()

  useDocumentTitle()

  const { entryDetailRef, entryListRef, handleEntryClick } = useContentContext()
  const { navigateToNextArticle, navigateToPreviousArticle, showHotkeysSettings } =
    useClassicKeyHandlers()

  const { fetchAppData, fetchFeedRelatedData } = useAppData()
  const { fetchArticleList } = useArticleList(info)
  const { isBelowMedium } = useScreenWidth()

  const [entryListWidth, setEntryListWidth] = useState(storedEntryListWidth ?? 420)
  const [isResizingEntryList, setIsResizingEntryList] = useState(false)
  const contentSplitRef = useRef(null)
  const hasAppliedOrderChange = useRef(false)
  const hasAppliedFilterChange = useRef(false)
  const infoFromRef = useRef(info.from)
  const fetchArticleListOnlyRef = useRef(null)
  const fetchArticleListWithRelatedDataRef = useRef(null)

  const fetchArticleListOnly = useCallback(async () => {
    if (!isAppDataReady) {
      await fetchAppData()
    }
    await fetchArticleList(getEntries)
  }, [isAppDataReady, fetchArticleList, getEntries, fetchAppData])

  const fetchArticleListWithRelatedData = useCallback(async () => {
    const needsAppData = !isAppDataReady

    if (!isAppDataReady) {
      await fetchAppData()
    }

    await fetchArticleList(getEntries)
    if (!needsAppData) {
      await fetchFeedRelatedData()
    }
  }, [isAppDataReady, fetchAppData, fetchArticleList, getEntries, fetchFeedRelatedData])

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
            fetchArticleListWithRelatedData()
          } else {
            fetchArticleListOnly()
          }
        }
      } catch (error) {
        console.error("Error handling refresh event:", error)
      }
    }

    globalThis.addEventListener("reloadedflux:refresh", handler)
    return () => globalThis.removeEventListener("reloadedflux:refresh", handler)
  }, [info, fetchArticleListOnly, fetchArticleListWithRelatedData])

  const fetchSingleEntry = async (entryId) => {
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
  }

  useClassicHotkeys({ handleRefreshArticleList: fetchArticleListWithRelatedData })

  const handleSwiping = (eventData) => {
    setIsSwipingLeft(eventData.dir === "Left")
    setIsSwipingRight(eventData.dir === "Right")
  }

  const handleSwiped = () => {
    setIsSwipingLeft(false)
    setIsSwipingRight(false)
  }

  const handleSwipeLeft = useCallback(() => navigateToNextArticle(), [navigateToNextArticle])

  const handleSwipeRight = useCallback(
    () => navigateToPreviousArticle(),
    [navigateToPreviousArticle],
  )

  const handlers = useSwipeable({
    delta: 50 / swipeSensitivity,
    onSwiping: enableSwipeGesture
      ? (eventData) => {
          if (globalThis.getSelection().toString()) {
            return
          }
          handleSwiping(eventData)
        }
      : undefined,
    onSwiped: enableSwipeGesture ? handleSwiped : undefined,
    onSwipedLeft: enableSwipeGesture ? handleSwipeLeft : undefined,
    onSwipedRight: enableSwipeGesture ? handleSwipeRight : undefined,
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
      fetchArticleListWithRelatedDataRef.current?.()
    } else {
      fetchArticleListOnlyRef.current?.()
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
    if (isBelowMedium && activeContent) {
      const { entryId } = params
      if (!entryId) {
        setActiveContent(null)
      }
    }
  }, [location.pathname])

  useEffect(() => {
    const { entryId } = params
    if (entryId) {
      if (!activeContent || activeContent.id !== Number(entryId)) {
        fetchSingleEntry(entryId)
      }
    } else if (activeContent) {
      setActiveContent(null)
    }
  }, [params])

  const handleEntryListSplitterPointerDown = (event) => {
    if (isBelowMedium) {
      return
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }

    const container = contentSplitRef.current
    if (!container) {
      return
    }

    event.preventDefault()

    const startX = event.clientX
    const startWidth = entryListWidth
    let latestWidth = startWidth

    const minWidth = 280
    const minRightPaneWidth = 320
    const splitterSize = 8

    document.body.style.userSelect = "none"
    setIsResizingEntryList(true)

    const handlePointerMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const containerWidth = container.getBoundingClientRect().width
      const maxWidth = Math.max(minWidth, containerWidth - minRightPaneWidth - splitterSize)
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
      latestWidth = nextWidth
      setEntryListWidth(nextWidth)
    }

    const handlePointerUp = () => {
      document.body.style.userSelect = ""
      setIsResizingEntryList(false)
      updateSettings({ entryListWidth: latestWidth })
      globalThis.removeEventListener("pointermove", handlePointerMove)
      globalThis.removeEventListener("pointerup", handlePointerUp)
    }

    globalThis.addEventListener("pointermove", handlePointerMove)
    globalThis.addEventListener("pointerup", handlePointerUp)
  }

  return (
    <div ref={contentSplitRef} className="content-split">
      <div
        className="entry-col"
        style={{
          opacity: isBelowMedium && isArticleLoading ? 0 : 1,
          width: isBelowMedium ? undefined : entryListWidth,
        }}
      >
        <ClassicSearchBar />
        <ArticleList
          ref={entryListRef}
          cardsRef={cardsRef}
          getEntries={getEntries}
          handleEntryClick={handleEntryClick}
        />
        <FooterPanel info={info} markAllAsRead={markAllAsRead} />
      </div>
      {isBelowMedium ? null : (
        <div
          aria-label="Resize entry list"
          aria-orientation="vertical"
          role="separator"
          className={
            isResizingEntryList
              ? "pane-splitter content-splitter is-dragging"
              : "pane-splitter content-splitter"
          }
          onPointerDown={handleEntryListSplitterPointerDown}
        />
      )}
      {activeContent ? (
        <div
          className="article-container content-wrapper"
          style={isBelowMedium ? undefined : { flex: 1, minWidth: 0 }}
          {...handlers}
        >
          {!isBelowMedium && <ActionButtons />}
          {isArticleLoading ? (
            <div style={{ flex: 1 }} />
          ) : (
            <>
              <AnimatePresence>
                {isSwipingRight && (
                  <FadeTransition key="swipe-hint-left" className="swipe-hint left">
                    <IconLeft style={{ fontSize: 24 }} />
                  </FadeTransition>
                )}
                {isSwipingLeft && (
                  <FadeTransition key="swipe-hint-right" className="swipe-hint right">
                    <IconRight style={{ fontSize: 24 }} />
                  </FadeTransition>
                )}
              </AnimatePresence>
              <ArticleDetail ref={entryDetailRef} />
            </>
          )}
          {isBelowMedium && <ActionButtons />}
        </div>
      ) : (
        <div
          className="content-empty content-wrapper"
          style={isBelowMedium ? undefined : { flex: 1, minWidth: 0 }}
        >
          <IconEmpty style={{ fontSize: "64px" }} />
          <Typography.Title heading={6} style={{ color: "var(--color-text-3)", marginTop: "10px" }}>
            ReloadedFlux
          </Typography.Title>
        </div>
      )}
    </div>
  )
}

export default ClassicContent
