import { Button, Notification, Typography } from "@arco-design/web-react"
import { IconEmpty, IconLeft, IconRight } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useSwipeable } from "react-swipeable"

import FooterPanel from "./FooterPanel"

import ActionButtons from "@/components/Article/ActionButtons"
import ArticleDetail from "@/components/Article/ArticleDetail"
import ArticleList from "@/components/Article/ArticleList"
import SearchAndSortBar from "@/components/Article/SearchAndSortBar"
import FadeTransition from "@/components/ui/FadeTransition"
import useAppData from "@/hooks/useAppData"
import useArticleList from "@/hooks/useArticleList"
import useContentContext from "@/hooks/useContentContext"
import useDocumentTitle from "@/hooks/useDocumentTitle"
import useEntryActions from "@/hooks/useEntryActions"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { contentState, setActiveContent, setInfoFrom, setInfoId } from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { duplicateHotkeysState, hotkeysState } from "@/store/hotkeysState"
import { settingsState } from "@/store/settingsState"

import "./Content.css"

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, filterDate, isArticleLoading } = useStore(contentState)
  const { isAppDataReady } = useStore(dataState)
  const { enableSwipeGesture, orderBy, orderDirection, showStatus, swipeSensitivity } =
    useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const duplicateHotkeys = useStore(duplicateHotkeysState)
  const hotkeys = useStore(hotkeysState)

  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [isSwipingRight, setIsSwipingRight] = useState(false)
  const cardsRef = useRef(null)

  useDocumentTitle()

  const { entryDetailRef, entryListRef, handleEntryClick } = useContentContext()

  const {
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
  } = useKeyHandlers()

  const { fetchAppData } = useAppData()
  const { fetchArticleList } = useArticleList(info, getEntries)
  const { isBelowMedium } = useScreenWidth()

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions()

  const refreshArticleList = async (getEntries) => {
    if (!isAppDataReady) {
      await fetchAppData()
    } else {
      await fetchArticleList(getEntries)
    }
  }

  const handleRefreshArticleList = () => {
    refreshArticleList(getEntries)
  }

  const hotkeyActions = {
    exitDetailView,
    fetchOriginalArticle: () => fetchOriginalArticle(handleFetchContent),
    navigateToNextArticle: () => navigateToNextArticle(),
    navigateToNextUnreadArticle: () => navigateToNextUnreadArticle(),
    navigateToPreviousArticle: () => navigateToPreviousArticle(),
    navigateToPreviousUnreadArticle: () => navigateToPreviousUnreadArticle(),
    openLinkExternally,
    openPhotoSlider,
    refreshArticleList: handleRefreshArticleList,
    saveToThirdPartyServices: () => saveToThirdPartyServices(handleSaveToThirdPartyServices),
    showHotkeysSettings,
    toggleReadStatus: () => toggleReadStatus(() => handleToggleStatus(activeContent)),
    toggleStarStatus: () => toggleStarStatus(() => handleToggleStarred(activeContent)),
  }

  const removeConflictingKeys = (keys) => keys.filter((key) => !duplicateHotkeys.includes(key))

  for (const [key, action] of Object.entries(hotkeyActions)) {
    useHotkeys(removeConflictingKeys(hotkeys[key]), action, { useKey: true })
  }

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
          if (window.getSelection().toString()) {
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
    if (activeContent) {
      setActiveContent(null)
    }
    refreshArticleList(getEntries)
  }, [info])

  useEffect(() => {
    if (["starred", "history"].includes(info.from)) {
      return
    }
    refreshArticleList(getEntries)
  }, [orderBy])

  useEffect(() => {
    refreshArticleList(getEntries)
  }, [filterDate, orderDirection, showStatus])

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
          refreshArticleList={() => refreshArticleList(getEntries)}
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
              <ArticleDetail ref={entryDetailRef} />
            </>
          )}
          {isBelowMedium && <ActionButtons />}
        </div>
      ) : (
        <div className="content-empty content-wrapper">
          <IconEmpty style={{ fontSize: "64px" }} />
          <Typography.Title heading={6} style={{ color: "var(--color-text-3)", marginTop: "10px" }}>
            ReactFlux
          </Typography.Title>
        </div>
      )}
    </>
  )
}

export default Content
