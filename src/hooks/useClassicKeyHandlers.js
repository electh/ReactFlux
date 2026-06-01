import { useStore } from "@nanostores/react"
import { useRef } from "react"

import { polyglotState } from "./useLanguage"
import useModalToggle from "./useModalToggle"
import usePhotoSlider from "./usePhotoSlider"

import useContentContext from "@/hooks/useContentContext"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { Message } from "@/utils/feedback"
import { extractImageSources } from "@/utils/images"
import { getAnimationScrollBehavior } from "@/utils/scroll"

// If consecutive navigations land within this window, the user is hammering the
// key faster than a smooth scroll completes — animate instantly so the middle
// pane jumps cleanly card-to-card instead of jerking between interrupted smooth
// scrolls. A lone press animates normally.
const CLASSIC_RAPID_NAV_WINDOW_MS = 350

// Run after React commit + layout (next paint), so the DOM node exists and is
// positioned. Two frames: first commits, second lets layout settle. Replaces a
// magic 250ms timer and is refresh-rate-safe.
const scrollAfterCommit = (callback) =>
  globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(callback))

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

const useClassicKeyHandlers = ({ classicVirtualizerRef } = {}) => {
  const { activeContent } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)

  const { entryListRef, handleEntryClick, closeActiveContent } = useContentContext()
  const lastNavAtRef = useRef(0)

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

  const scrollSelectedCardIntoView = (targetEntryId = null) => {
    if (!entryListRef.current) {
      return
    }

    // Rapid nav: each new smooth scroll interrupts the prior one mid-flight,
    // which reads as a jerky middle pane on Chromium. Detect a fast streak and
    // scroll instantly so it jumps cleanly card-to-card; a lone press animates.
    // This only runs from a keypress-driven rAF callback, never during render.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const rapidNav = now - lastNavAtRef.current < CLASSIC_RAPID_NAV_WINDOW_MS
    lastNavAtRef.current = now
    const animate = settingsState.get().animationsEnabled && !rapidNav

    const selectedCard = getSelectedCard(targetEntryId)

    if (selectedCard) {
      selectedCard.scrollIntoView({
        behavior: animate ? getAnimationScrollBehavior() : "auto",
        block: "center",
      })
      return
    }

    // The card isn't mounted — rapid nav outran the virtualizer's rendered
    // window, so scrollIntoView has no node to target (this left the middle pane
    // behind). Reveal it by index via the virtua handle instead, which works
    // regardless of mount state.
    if (targetEntryId !== null && classicVirtualizerRef?.current) {
      const targetIndex = filteredEntriesState
        .get()
        .findIndex((entry) => Number(entry.id) === Number(targetEntryId))

      if (targetIndex !== -1) {
        classicVirtualizerRef.current.scrollToIndex(targetIndex, {
          align: "center",
          smooth: animate,
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
      scrollAfterCommit(() => scrollSelectedCardIntoView(previousContent.id))
    } else {
      Message.info(polyglot.t("actions.no_previous_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToNextArticle = withPhotoSliderCheck(() => {
    const nextContent = getAdjacentEntry("next")

    if (nextContent) {
      handleEntryClick(nextContent)
      scrollAfterCommit(() => scrollSelectedCardIntoView(nextContent.id))
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
      scrollAfterCommit(() => scrollSelectedCardIntoView(adjacentUnreadEntry.id))
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
    setSettingsTabsActiveTab("8")
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
