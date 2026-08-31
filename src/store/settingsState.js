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
    edgeToEdgeImages,
    fontFamily,
    fontSize,
    lightboxSlideAnimation,
    titleAlignment,
  }) => ({
    articleWidth,
    edgeToEdgeImages,
    fontFamily,
    fontSize,
    lightboxSlideAnimation,
    titleAlignment,
  }),
)

export const contentGestureSettingsState = selectShallowSettings(
  ({ enableSwipeGesture, swipeSensitivity }) => ({ enableSwipeGesture, swipeSensitivity }),
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
  const nextSettings = canMergeChanges
    ? { ...currentSettings, ...settingsChanges }
    : currentSettings

  settingsState.set(sanitizeSettings(nextSettings, currentSettings))
}

export const replaceSettings = (settings) =>
  settingsState.set(sanitizeSettings(settings, defaultSettings))

export const resetSettings = () => settingsState.set({ ...defaultSettings })

export { MIN_ARTICLE_FONT_SIZE } from "@/utils/settings-schema"
