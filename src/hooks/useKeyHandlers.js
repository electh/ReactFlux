import { Message } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useNavigate } from "react-router"

import { handleOpenLinkExternally } from "./useEntryActions"
import { polyglotState } from "./useLanguage"
import useModalToggle from "./useModalToggle"
import usePhotoSlider from "./usePhotoSlider"
import useScreenWidth from "./useScreenWidth"

import useContentContext from "@/hooks/useContentContext"
import {
  activeEntryIndexState,
  contentState,
  filteredEntriesState,
  nextContentState,
  prevContentState,
  setActiveContent,
} from "@/store/contentState"
import { visibleCategoriesState } from "@/store/dataState"
import { getDefaultSettings, settingsState } from "@/store/settingsState"
import { ANIMATION_DURATION_MS } from "@/utils/constants"
import { getPreferredScrollBehavior } from "@/utils/dom"
import buildArticleImageModel from "@/utils/images"
import findAdjacentItem from "@/utils/navigation"
import { isSettingsTabAvailable, SETTINGS_TAB_KEYS } from "@/utils/settings-navigation"

const withActiveContent =
  (fn) =>
  (...args) => {
    const { activeContent } = contentState.get()
    if (activeContent) {
      return fn(activeContent, ...args)
    }
  }

const findAdjacentUnreadEntry = (currentIndex, direction, entries) => {
  const isSearchingBackward = direction === "prev"
  const searchRange = isSearchingBackward
    ? entries.slice(0, currentIndex).toReversed()
    : entries.slice(currentIndex + 1)

  return searchRange.find((entry) => entry.status === "unread")
}

const SCROLL_STEP_LINES_SINGLE = 8
const SCROLL_STEP_LINES_REPEAT = 2
const LINE_HEIGHT_CACHE_TTL_MS = 2000
const FALLBACK_LINE_HEIGHT_RATIO = 1.8
const FALLBACK_BASE_FONT_SIZE_PX = 16

let cachedLineHeight = null
let cachedLineHeightTimestamp = 0

// Support SimpleBar wrapper on desktop as well as native scroll containers
const getArticleScrollElement = (entryDetailRef) => {
  const articleContainer = entryDetailRef.current
  if (!articleContainer) {
    return null
  }
  return (
    articleContainer.querySelector(".simplebar-content-wrapper") ||
    articleContainer.querySelector("[data-native-scroll='true']") ||
    articleContainer.querySelector(".scroll-container")
  )
}

const getArticleLineHeight = (entryDetailRef) => {
  const now = performance.now()
  // Cache lineHeight to prevent layout thrashing on frequent key presses
  if (cachedLineHeight && now - cachedLineHeightTimestamp < LINE_HEIGHT_CACHE_TTL_MS) {
    return cachedLineHeight
  }

  const articleContainer = entryDetailRef.current
  const articleBody = articleContainer?.querySelector(".article-body")
  if (articleBody) {
    const computedStyle = globalThis.getComputedStyle(articleBody)
    const lineHeight = Number.parseFloat(computedStyle.lineHeight)
    if (Number.isFinite(lineHeight) && lineHeight > 0) {
      cachedLineHeight = lineHeight
      cachedLineHeightTimestamp = now
      return lineHeight
    }
  }

  const fontSize = settingsState.get().fontSize ?? getDefaultSettings().fontSize
  const fallbackLineHeight = fontSize * FALLBACK_BASE_FONT_SIZE_PX * FALLBACK_LINE_HEIGHT_RATIO
  cachedLineHeight = fallbackLineHeight
  cachedLineHeightTimestamp = now
  return fallbackLineHeight
}

const scrollArticle = (direction, entryDetailRef, isRepeating) => {
  const scrollElement = getArticleScrollElement(entryDetailRef)
  if (!scrollElement) {
    return false
  }

  const lineHeight = getArticleLineHeight(entryDetailRef)
  const lines = isRepeating ? SCROLL_STEP_LINES_REPEAT : SCROLL_STEP_LINES_SINGLE
  const step = Math.round(lineHeight * lines)
  const topDelta = direction === "down" ? step : -step

  scrollElement.scrollBy({
    top: topDelta,
    // Use "auto" during rapid key repeat to avoid browser animation cancellation stutter
    behavior: isRepeating ? "auto" : getPreferredScrollBehavior(),
  })
  return true
}

const useKeyHandlers = () => {
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()
  const navigate = useNavigate()

  const { entryDetailRef, entryListRef, handleEntryClick, closeActiveContent } = useContentContext()

  const scrollSelectedCardIntoView = () => {
    if (entryListRef.current) {
      const selectedCard = entryListRef.current.el.querySelector(".article-entry.selected")
      if (selectedCard) {
        selectedCard.scrollIntoView({
          behavior: getPreferredScrollBehavior(),
          block: "center",
        })
      }
    }
  }

  const {
    isPhotoSliderVisible,
    openPhotoSlider: showPhotoSlider,
    requestPhotoSliderClose,
  } = usePhotoSlider()
  const { setSettingsModalVisible, setSettingsTabsActiveTab } = useModalToggle()

  const withPhotoSliderCheck =
    (fn) =>
    (...args) => {
      if (isPhotoSliderVisible) {
        return
      }
      return fn(...args)
    }

  const exitDetailView = withActiveContent(withPhotoSliderCheck(closeActiveContent))

  // eslint-disable-next-line react-hooks/refs
  const navigateToPreviousArticle = withPhotoSliderCheck(() => {
    const previousContent = prevContentState.get()
    if (previousContent) {
      handleEntryClick(previousContent)
      setTimeout(() => scrollSelectedCardIntoView(), ANIMATION_DURATION_MS)
    } else {
      Message.info(polyglot.t("actions.no_previous_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToNextArticle = withPhotoSliderCheck(() => {
    const nextContent = nextContentState.get()
    if (nextContent) {
      handleEntryClick(nextContent)
      setTimeout(() => scrollSelectedCardIntoView(), ANIMATION_DURATION_MS)
    } else {
      Message.info(polyglot.t("actions.no_next_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToAdjacentUnreadArticle = withPhotoSliderCheck((direction) => {
    const adjacentUnreadEntry = findAdjacentUnreadEntry(
      activeEntryIndexState.get(),
      direction,
      filteredEntriesState.get(),
    )
    if (adjacentUnreadEntry) {
      handleEntryClick(adjacentUnreadEntry)
      setTimeout(scrollSelectedCardIntoView, ANIMATION_DURATION_MS)
    } else if (direction === "prev") {
      Message.info(polyglot.t("actions.no_previous_unread_article"))
    } else {
      Message.info(polyglot.t("actions.no_next_unread_article"))
    }
  })

  const navigateToPreviousUnreadArticle = () => navigateToAdjacentUnreadArticle("prev")
  const navigateToNextUnreadArticle = () => navigateToAdjacentUnreadArticle("next")

  const navigateToAdjacentCategory = withPhotoSliderCheck((direction) => {
    const { infoFrom, infoId } = contentState.get()
    if (infoFrom !== "category") {
      return
    }

    const categories = visibleCategoriesState.get()
    const currentIndex = categories.findIndex((category) => category.id === Number(infoId))
    const adjacentCategory = findAdjacentItem(categories, currentIndex, direction)

    if (adjacentCategory) {
      navigate(`/category/${adjacentCategory.id}`)
      setActiveContent(null)
    } else if (direction === "prev") {
      Message.info(polyglot.t("actions.no_previous_category"))
    } else {
      Message.info(polyglot.t("actions.no_next_category"))
    }
  })

  const navigateToPreviousCategory = () => navigateToAdjacentCategory("prev")
  const navigateToNextCategory = () => navigateToAdjacentCategory("next")

  const openLinkExternally = withActiveContent(handleOpenLinkExternally)

  const fetchOriginalArticle = withActiveContent((_activeContent, handleFetchContent) => {
    handleFetchContent()
  })

  const saveToThirdPartyServices = withActiveContent(
    (activeContent, handleSaveToThirdPartyServices) => {
      handleSaveToThirdPartyServices(activeContent)
    },
  )

  const showHotkeysSettings = () => {
    if (!isSettingsTabAvailable(SETTINGS_TAB_KEYS.HOTKEYS, isBelowMedium)) {
      Message.info(polyglot.t("settings.hotkeys_desktop_only"))
      return
    }

    setSettingsTabsActiveTab(SETTINGS_TAB_KEYS.HOTKEYS)
    setSettingsModalVisible(true)
  }

  const toggleReadStatus = withActiveContent((activeContent, handleUpdateEntry) => {
    handleUpdateEntry(activeContent)
  })

  const toggleStarStatus = withActiveContent((activeContent, handleStarEntry) => {
    handleStarEntry(activeContent)
  })

  const openPhotoSlider = withActiveContent((activeContent) => {
    if (isPhotoSliderVisible) {
      requestPhotoSliderClose()
      return
    }

    const { imageSources } = buildArticleImageModel(
      activeContent.content,
      activeContent.attachments?.items,
    )
    if (imageSources.length === 0) {
      return
    }

    showPhotoSlider(0)
  })

  const scrollArticleDown = withActiveContent(
    withPhotoSliderCheck((_activeContent, isRepeating) =>
      scrollArticle("down", entryDetailRef, isRepeating),
    ),
  )

  const scrollArticleUp = withActiveContent(
    withPhotoSliderCheck((_activeContent, isRepeating) =>
      scrollArticle("up", entryDetailRef, isRepeating),
    ),
  )

  return {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToNextCategory,
    navigateToNextUnreadArticle,
    navigateToPreviousArticle,
    navigateToPreviousCategory,
    navigateToPreviousUnreadArticle,
    openLinkExternally,
    openPhotoSlider,
    saveToThirdPartyServices,
    scrollArticleDown,
    scrollArticleUp,
    showHotkeysSettings,
    toggleReadStatus,
    toggleStarStatus,
  }
}

export default useKeyHandlers
