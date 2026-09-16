import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"
import { selectStore, shallowEqual } from "@/utils/nanostores"
import {
  createDefaultSettings,
  decodeSettings,
  encodeSettings,
  sanitizeSettings,
} from "@/utils/settings-schema"

const defaultSettings = createDefaultSettings(getBrowserLanguage())

export const settingsState = persistentAtom("settings", defaultSettings, {
  encode: (settings) => encodeSettings(settings, defaultSettings),
  decode: (storedSettings) => decodeSettings(storedSettings, defaultSettings),
})

export const getSettings = (key) => settingsState.get()[key]
export const getDefaultSettings = () => ({ ...defaultSettings })

const selectShallowSettings = (selector) => selectStore(settingsState, selector, shallowEqual)

export const articleCardSettingsState = selectShallowSettings(
  ({
    coverDisplayMode,
    enableContextMenu,
    markReadOnScroll,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    summaryLines,
  }) => ({
    coverDisplayMode,
    enableContextMenu,
    markReadOnScroll,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    summaryLines,
  }),
)

export const articleDetailSettingsState = selectShallowSettings(
  ({
    articleWidth,
    contentBrowsingDirection,
    edgeToEdgeImages,
    fontFamily,
    fontSize,
    lightboxSlideAnimation,
    titleAlignment,
  }) => ({
    articleWidth,
    contentBrowsingDirection,
    edgeToEdgeImages,
    fontFamily,
    fontSize,
    lightboxSlideAnimation,
    titleAlignment,
  }),
)

export const contentGestureSettingsState = selectShallowSettings(
  ({ contentBrowsingDirection, enableSwipeGesture, swipeSensitivity }) => ({
    contentBrowsingDirection,
    enableSwipeGesture,
    swipeSensitivity,
  }),
)

export const articleListRequestSettingsState = selectShallowSettings(
  ({ orderBy, orderDirection, pageSize, showHiddenFeeds, showStatus }) => ({
    orderBy,
    orderDirection,
    pageSize,
    showHiddenFeeds,
    showStatus,
  }),
)

export const articleFontFamilyState = selectStore(settingsState, ({ fontFamily }) => fontFamily)
export const articleFontSizeState = selectStore(settingsState, ({ fontSize }) => fontSize)

export const updateSettings = (settingsChanges) => {
  const currentSettings = settingsState.get()
  const canMergeChanges =
    settingsChanges !== null &&
    typeof settingsChanges === "object" &&
    !Array.isArray(settingsChanges)
  if (canMergeChanges && Object.hasOwn(settingsChanges, "contentBrowsingDirection")) {
    throw new TypeError(
      "Use setContentBrowsingDirection() to keep directional shortcuts synchronized",
    )
  }

  const nextSettings = canMergeChanges
    ? { ...currentSettings, ...settingsChanges }
    : currentSettings

  settingsState.set(sanitizeSettings(nextSettings, currentSettings))
}

export const replaceSettings = (settings) =>
  settingsState.set(sanitizeSettings(settings, defaultSettings))
