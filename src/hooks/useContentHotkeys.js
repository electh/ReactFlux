import { useStore } from "@nanostores/react"
import { useHotkeys } from "react-hotkeys-hook"

import useEntryActions from "@/hooks/useEntryActions"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { contentState } from "@/store/contentState"
import { duplicateHotkeysState, hotkeysState } from "@/store/hotkeysState"

const useContentHotkeys = ({ handleRefreshArticleList }) => {
  const { activeContent } = useStore(contentState)
  const duplicateHotkeys = useStore(duplicateHotkeysState)
  const hotkeys = useStore(hotkeysState)

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

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions()

  const removeConflictingKeys = (keys) => keys.filter((key) => !duplicateHotkeys.includes(key))

  useHotkeys(removeConflictingKeys(hotkeys.exitDetailView), exitDetailView)

  useHotkeys(removeConflictingKeys(hotkeys.fetchOriginalArticle), () =>
    fetchOriginalArticle(handleFetchContent),
  )

  useHotkeys(removeConflictingKeys(hotkeys.navigateToNextArticle), () => navigateToNextArticle())

  useHotkeys(removeConflictingKeys(hotkeys.navigateToNextUnreadArticle), () =>
    navigateToNextUnreadArticle(),
  )

  useHotkeys(removeConflictingKeys(hotkeys.navigateToPreviousArticle), () =>
    navigateToPreviousArticle(),
  )

  useHotkeys(removeConflictingKeys(hotkeys.navigateToPreviousUnreadArticle), () =>
    navigateToPreviousUnreadArticle(),
  )

  useHotkeys(removeConflictingKeys(hotkeys.openLinkExternally), openLinkExternally)

  useHotkeys(removeConflictingKeys(hotkeys.openPhotoSlider), openPhotoSlider)

  useHotkeys(removeConflictingKeys(hotkeys.refreshArticleList), handleRefreshArticleList)

  useHotkeys(removeConflictingKeys(hotkeys.saveToThirdPartyServices), () =>
    saveToThirdPartyServices(() => handleSaveToThirdPartyServices(activeContent)),
  )

  useHotkeys(removeConflictingKeys(hotkeys.showHotkeysSettings), showHotkeysSettings, {
    useKey: true,
  })

  useHotkeys(removeConflictingKeys(hotkeys.toggleReadStatus), () =>
    toggleReadStatus(() => handleToggleStatus(activeContent)),
  )

  useHotkeys(removeConflictingKeys(hotkeys.toggleStarStatus), () =>
    toggleStarStatus(() => handleToggleStarred(activeContent)),
  )
}

export default useContentHotkeys
