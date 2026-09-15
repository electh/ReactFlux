import { hotkeysState, replaceHotkeys } from "@/store/hotkeysState"
import { getDefaultSettings, replaceSettings, settingsState } from "@/store/settingsState"
import { swapDirectionalNavigationHotkeys } from "@/utils/content-browsing-direction"
import { findDuplicateHotkeys } from "@/utils/hotkeys-schema"
import { sanitizeSettings } from "@/utils/settings-schema"

const findNewConflicts = (currentHotkeys, nextHotkeys) => {
  const currentConflicts = new Set(findDuplicateHotkeys(currentHotkeys))
  return findDuplicateHotkeys(nextHotkeys).filter((key) => !currentConflicts.has(key))
}

const restoreSnapshot = ({ hotkeys, settings }) => {
  replaceSettings(settings)
  replaceHotkeys(hotkeys)
}

const applySettingsChange = (settings) => {
  const previousSnapshot = {
    hotkeys: hotkeysState.get(),
    settings: settingsState.get(),
  }
  const nextSettings = sanitizeSettings(settings, previousSnapshot.settings)
  const directionChanged =
    nextSettings.contentBrowsingDirection !== previousSnapshot.settings.contentBrowsingDirection
  const nextHotkeys = directionChanged
    ? swapDirectionalNavigationHotkeys(previousSnapshot.hotkeys)
    : previousSnapshot.hotkeys
  const conflicts = directionChanged ? findNewConflicts(previousSnapshot.hotkeys, nextHotkeys) : []

  if (conflicts.length > 0) {
    return { conflicts, success: false }
  }

  try {
    replaceSettings(nextSettings)
    if (directionChanged) {
      replaceHotkeys(nextHotkeys)
    }
  } catch (error) {
    try {
      restoreSnapshot(previousSnapshot)
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "Failed to update the browsing direction or restore its previous state",
      )
    }

    throw error
  }

  return { conflicts: [], success: true }
}

export const setContentBrowsingDirection = (contentBrowsingDirection) => {
  const currentSettings = settingsState.get()
  if (contentBrowsingDirection === currentSettings.contentBrowsingDirection) {
    return { conflicts: [], success: true }
  }

  return applySettingsChange({
    ...currentSettings,
    contentBrowsingDirection,
  })
}

export const resetSettings = () => applySettingsChange(getDefaultSettings())
