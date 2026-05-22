import { useStore } from "@nanostores/react"
import { useMemo } from "react"
import { useHotkeys } from "react-hotkeys-hook"

import useEntryActions from "@/hooks/useEntryActions"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { contentState } from "@/store/contentState"
import { duplicateHotkeysState, hotkeysState } from "@/store/hotkeysState"

const useContentHotkeys = ({ handleRefreshArticleList }) => {
  const { activeContent } = useStore(contentState)
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
    saveToThirdPartyServices(() => handleSaveToThirdPartyServices(activeContent)),
  )

  useHotkeys(filteredHotkeys.showHotkeysSettings, showHotkeysSettings, {
    useKey: true,
  })

  useHotkeys(filteredHotkeys.toggleReadStatus, () =>
    toggleReadStatus(() => handleToggleStatus(activeContent)),
  )

  useHotkeys(filteredHotkeys.toggleStarStatus, () =>
    toggleStarStatus(() => handleToggleStarred(activeContent)),
  )
}

export default useContentHotkeys
