import { useStore } from "@nanostores/react"

import { polyglotState } from "./useLanguage"
import useModalToggle from "./useModalToggle"
import usePhotoSlider from "./usePhotoSlider"

import useContentContext from "@/hooks/useContentContext"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { ANIMATION_DURATION_MS } from "@/utils/constants"
import { Message } from "@/utils/feedback"
import { extractImageSources } from "@/utils/images"

const getAnimationScrollBehavior = () => (settingsState.get().animationsEnabled ? "smooth" : "auto")

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

const useClassicKeyHandlers = () => {
  const { activeContent } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)

  const { entryListRef, handleEntryClick, closeActiveContent } = useContentContext()

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

  const scrollSelectedCardIntoView = () => {
    if (entryListRef.current) {
      const selectedCard = getSelectedCard()

      if (selectedCard) {
        selectedCard.scrollIntoView({
          behavior: getAnimationScrollBehavior(),
          block: "center",
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

    if (previousContent) {
      handleEntryClick(previousContent)
      globalThis.setTimeout(() => scrollSelectedCardIntoView(), ANIMATION_DURATION_MS)
    } else {
      Message.info(polyglot.t("actions.no_previous_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToNextArticle = withPhotoSliderCheck(() => {
    const nextContent = getAdjacentEntry("next")

    if (nextContent) {
      handleEntryClick(nextContent)
      globalThis.setTimeout(() => scrollSelectedCardIntoView(), ANIMATION_DURATION_MS)
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
      globalThis.setTimeout(scrollSelectedCardIntoView, ANIMATION_DURATION_MS)
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
    setSettingsTabsActiveTab("6")
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

export default useClassicKeyHandlers
