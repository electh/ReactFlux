import { Typography } from "@arco-design/web-react"
import { IconEmpty, IconLeft, IconRight } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { AnimatePresence } from "framer-motion"
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { useSwipeable } from "react-swipeable"

import FooterPanel from "./FooterPanel"

import { getEntry } from "@/apis"
import ActionButtons from "@/components/Article/ActionButtons"
import ArticleList from "@/components/Article/ArticleList"
import SearchAndSortBar from "@/components/Article/SearchAndSortBar"
import FadeTransition from "@/components/ui/FadeTransition"
import useAppData from "@/hooks/useAppData"
import useArticleList from "@/hooks/useArticleList"
import useContentContext from "@/hooks/useContentContext"
import useContentHotkeys from "@/hooks/useContentHotkeys"
import useDocumentTitle from "@/hooks/useDocumentTitle"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  setActiveContent,
  setInfoFrom,
  setInfoId,
  setIsArticleLoading,
} from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import prepareEntry from "@/utils/entry-presentation"

import "./Content.css"

const ArticleDetail = lazy(() => import("@/components/Article/ArticleDetail"))

const isInHorizontalScrollable = (element) => {
  let el = element
  while (el && el !== document.body) {
    const { overflowX } = globalThis.getComputedStyle(el)
    if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth) {
      return true
    }
    el = el.parentElement
  }
  return false
}

const shouldIgnoreSwipe = (element) =>
  isInHorizontalScrollable(element) || Boolean(element?.closest?.(".plyr, audio, video"))

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { from: source, id: sourceId } = info
  const { activeContent, isArticleLoading } = useStore(contentState)
  const { enableSwipeGesture, swipeSensitivity } = useStore(settingsState)

  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [isSwipingRight, setIsSwipingRight] = useState(false)
  const cardsRef = useRef(null)
  const entryRequestIdRef = useRef(0)

  const { entryId } = useParams()

  useDocumentTitle()

  const { entryDetailRef, entryListRef, handleEntryClick } = useContentContext()

  const { navigateToNextArticle, navigateToPreviousArticle } = useKeyHandlers()

  const { refreshFeedData } = useAppData()
  const { isBelowMedium } = useScreenWidth()

  useEffect(() => {
    const { activeContent: storedActiveContent, infoFrom, infoId } = contentState.get()
    const sourceChanged = infoFrom !== source || String(infoId ?? "") !== String(sourceId ?? "")

    setInfoFrom(source)
    setInfoId(sourceId)
    if (sourceChanged) {
      setIsArticleLoading(false)
      if (storedActiveContent) {
        setActiveContent(null)
      }
    }

    return () => {
      entryRequestIdRef.current += 1
    }
  }, [source, sourceId])

  const { fetchArticleList } = useArticleList(source, sourceId, getEntries)

  const fetchArticleListWithRelatedData = useCallback(
    () => Promise.allSettled([fetchArticleList(), refreshFeedData()]),
    [fetchArticleList, refreshFeedData],
  )

  const fetchSingleEntry = useCallback(async (entryId) => {
    const requestId = ++entryRequestIdRef.current
    const isCurrentRequest = () => entryRequestIdRef.current === requestId
    const numericEntryId = Number(entryId)
    const existingEntry = contentState.get().entries.find((entry) => entry.id === numericEntryId)

    if (existingEntry) {
      setIsArticleLoading(false)
      setActiveContent(existingEntry)
      return
    }

    try {
      setIsArticleLoading(true)
      const entry = await getEntry(entryId)
      if (isCurrentRequest()) {
        setActiveContent(prepareEntry(entry))
      }
    } catch (error) {
      if (isCurrentRequest()) {
        console.error("Failed to fetch entry:", error)
      }
    } finally {
      if (isCurrentRequest()) {
        setIsArticleLoading(false)
      }
    }
  }, [])

  useContentHotkeys({ handleRefreshArticleList: fetchArticleListWithRelatedData })

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
          if (globalThis.getSelection().toString() || shouldIgnoreSwipe(eventData.event.target)) {
            return
          }
          handleSwiping(eventData)
        }
      : undefined,
    onSwiped: enableSwipeGesture ? handleSwiped : undefined,
    onSwipedLeft: enableSwipeGesture
      ? (eventData) => {
          if (!shouldIgnoreSwipe(eventData.event.target)) {
            handleSwipeLeft()
          }
        }
      : undefined,
    onSwipedRight: enableSwipeGesture
      ? (eventData) => {
          if (!shouldIgnoreSwipe(eventData.event.target)) {
            handleSwipeRight()
          }
        }
      : undefined,
  })

  useEffect(() => {
    if (source === "category") {
      refreshFeedData().catch((error) => {
        console.error("Failed to refresh category feed data:", error)
      })
    }
  }, [refreshFeedData, source, sourceId])

  useEffect(() => {
    const currentActiveContent = contentState.get().activeContent

    if (entryId) {
      if (currentActiveContent?.id !== Number(entryId)) {
        fetchSingleEntry(entryId)
      }
    } else {
      entryRequestIdRef.current += 1
      if (currentActiveContent) {
        setActiveContent(null)
      }
      setIsArticleLoading(false)
    }
  }, [entryId, fetchSingleEntry, source, sourceId])

  return (
    <>
      <div
        className="entry-col"
        style={{
          opacity: isBelowMedium && isArticleLoading ? 0 : 1,
        }}
      >
        <SearchAndSortBar />
        <ArticleList
          ref={entryListRef}
          cardsRef={cardsRef}
          getEntries={getEntries}
          handleEntryClick={handleEntryClick}
        />
        <FooterPanel
          info={info}
          markAllAsRead={markAllAsRead}
          refreshArticleList={fetchArticleListWithRelatedData}
        />
      </div>
      {activeContent ? (
        <div className="article-container content-wrapper" {...handlers}>
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
              <Suspense fallback={<div aria-busy="true" style={{ flex: 1 }} />}>
                <ArticleDetail ref={entryDetailRef} />
              </Suspense>
            </>
          )}
          {isBelowMedium && <ActionButtons />}
        </div>
      ) : (
        <div className="content-empty content-wrapper">
          <IconEmpty style={{ fontSize: "64px" }} />
          <Typography.Title heading={6} style={{ color: "var(--color-text-2)", marginTop: "10px" }}>
            ReactFlux
          </Typography.Title>
        </div>
      )}
    </>
  )
}

export default Content
