import { Message } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useNavigate } from "react-router"

import { polyglotState } from "./useLanguage"
import useModalToggle from "./useModalToggle"
import usePhotoSlider from "./usePhotoSlider"

import useContentContext from "@/hooks/useContentContext"
import {
  activeEntryIndexState,
  contentState,
  filteredEntriesState,
  nextContentState,
  prevContentState,
  setActiveContent,
} from "@/store/contentState"
import { filteredCategoriesState } from "@/store/dataState"
import { ANIMATION_DURATION_MS } from "@/utils/constants"
import { getPreferredScrollBehavior } from "@/utils/dom"
import buildArticleImageModel from "@/utils/images"
import findAdjacentItem from "@/utils/navigation"

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

const useKeyHandlers = () => {
  const { polyglot } = useStore(polyglotState)
  const navigate = useNavigate()

  const { entryListRef, handleEntryClick, closeActiveContent } = useContentContext()

  const scrollSelectedCardIntoView = () => {
    if (entryListRef.current) {
      const selectedCard = entryListRef.current.el.querySelector(".card-wrapper.selected")
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

    const filteredCategories = filteredCategoriesState.get()
    const currentIndex = filteredCategories.findIndex((category) => category.id === Number(infoId))
    const adjacentCategory = findAdjacentItem(filteredCategories, currentIndex, direction)

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

  const openLinkExternally = withActiveContent((activeContent) => {
    window.open(activeContent.url, "_blank")
  })

  const fetchOriginalArticle = withActiveContent((_activeContent, handleFetchContent) => {
    handleFetchContent()
  })

  const saveToThirdPartyServices = withActiveContent(
    (activeContent, handleSaveToThirdPartyServices) => {
      handleSaveToThirdPartyServices(activeContent)
    },
  )

  const showHotkeysSettings = () => {
    setSettingsTabsActiveTab("5")
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
    showHotkeysSettings,
    toggleReadStatus,
    toggleStarStatus,
  }
}

export default useKeyHandlers
