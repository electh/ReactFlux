import { useStore } from "@nanostores/react"
import { useMemo } from "react"
import { useHotkeys } from "react-hotkeys-hook"

import useEntryActions from "@/hooks/useEntryActions"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { duplicateHotkeysState, hotkeysState } from "@/store/hotkeysState"

const SCROLL_HOTKEY_IGNORE_SELECTOR = [
  "a[href]",
  "audio[controls]",
  "button",
  "dialog",
  "input",
  "select",
  "summary",
  "textarea",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='alertdialog']",
  "[role='button']",
  "[role='dialog']",
  "[role='link']",
].join(", ")

const SCROLL_HOTKEY_OPTIONS = {
  ignoreEventWhen: ({ target }) => Boolean(target?.closest?.(SCROLL_HOTKEY_IGNORE_SELECTOR)),
}

const useContentHotkeys = ({ handleRefreshArticleList }) => {
  const duplicateHotkeys = useStore(duplicateHotkeysState)
  const hotkeys = useStore(hotkeysState)

  const filteredHotkeys = useMemo(() => {
    const duplicateHotkeySet = new Set(duplicateHotkeys)

    return Object.fromEntries(
      Object.entries(hotkeys).map(([action, keys]) => [
        action,
        keys.filter((key) => !duplicateHotkeySet.has(key)),
      ]),
    )
  }, [duplicateHotkeys, hotkeys])

  const {
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
  } = useKeyHandlers()

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions()

  useHotkeys(filteredHotkeys.exitDetailView, exitDetailView)

  useHotkeys(filteredHotkeys.fetchOriginalArticle, () => fetchOriginalArticle(handleFetchContent))

  useHotkeys(filteredHotkeys.navigateToNextArticle, () => navigateToNextArticle())

  useHotkeys(filteredHotkeys.navigateToNextCategory, () => navigateToNextCategory())

  useHotkeys(filteredHotkeys.navigateToNextUnreadArticle, () => navigateToNextUnreadArticle())

  useHotkeys(filteredHotkeys.navigateToPreviousArticle, () => navigateToPreviousArticle())

  useHotkeys(filteredHotkeys.navigateToPreviousCategory, () => navigateToPreviousCategory())

  useHotkeys(filteredHotkeys.navigateToPreviousUnreadArticle, () =>
    navigateToPreviousUnreadArticle(),
  )

  useHotkeys(filteredHotkeys.openLinkExternally, openLinkExternally)

  useHotkeys(filteredHotkeys.openPhotoSlider, openPhotoSlider)

  useHotkeys(filteredHotkeys.refreshArticleList, handleRefreshArticleList)

  useHotkeys(filteredHotkeys.saveToThirdPartyServices, () =>
    saveToThirdPartyServices(handleSaveToThirdPartyServices),
  )

  useHotkeys(
    filteredHotkeys.scrollArticleDown,
    (event) => {
      if (event.defaultPrevented || !scrollArticleDown(event.repeat)) {
        return
      }
      event.preventDefault()
    },
    SCROLL_HOTKEY_OPTIONS,
  )

  useHotkeys(
    filteredHotkeys.scrollArticleUp,
    (event) => {
      if (event.defaultPrevented || !scrollArticleUp(event.repeat)) {
        return
      }
      event.preventDefault()
    },
    SCROLL_HOTKEY_OPTIONS,
  )

  useHotkeys(filteredHotkeys.showHotkeysSettings, showHotkeysSettings, {
    useKey: true,
  })

  useHotkeys(filteredHotkeys.toggleReadStatus, () => toggleReadStatus(handleToggleStatus))

  useHotkeys(filteredHotkeys.toggleStarStatus, () => toggleStarStatus(handleToggleStarred))
}

export default useContentHotkeys
