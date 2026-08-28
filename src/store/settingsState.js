import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"

export const MIN_ARTICLE_FONT_SIZE = 1

const fontFamilyMigrations = {
  "'Noto Sans SC', sans-serif": "'Noto Sans', 'Noto Sans SC', sans-serif",
  "'Noto Serif SC', serif": "'Noto Serif', 'Noto Serif SC', serif",
}

const defaultValue = {
  articleWidth: 75,
  checkForUpdates: false,
  compactSidebarGroups: true,
  coverDisplayMode: "auto",
  edgeToEdgeImages: false,
  enableContextMenu: true,
  enableSwipeGesture: true,
  fontFamily: "system-ui",
  fontSize: 1.05,
  homePage: "all",
  language: getBrowserLanguage(),
  lightboxSlideAnimation: true,
  markAllReadJumpToNext: false,
  markReadBy: "view",
  markReadOnScroll: false,
  orderBy: "created_at",
  orderDirection: "desc",
  pageSize: 100,
  removeDuplicates: "none",
  showDetailedRelativeTime: false,
  summaryLines: 4,
  showEstimatedReadingTime: false,
  showFeedIcon: true,
  showHiddenFeeds: false,
  showStatus: "unread",
  showUnreadFeedsOnly: false,
  skipMarkAllReadConfirmation: false,
  swipeSensitivity: 1,
  themeColor: "Blue",
  themeMode: "system",
  titleAlignment: "center",
  updateContentOnFetch: false,
}

const normalizeSettings = (settings) => ({
  ...settings,
  fontFamily: fontFamilyMigrations[settings.fontFamily] ?? settings.fontFamily,
  fontSize: Number.isFinite(settings.fontSize)
    ? Math.max(settings.fontSize, MIN_ARTICLE_FONT_SIZE)
    : defaultValue.fontSize,
})

export const settingsState = persistentAtom("settings", defaultValue, {
  encode: (value) => {
    const filteredValue = {}

    for (const key in value) {
      if (key in defaultValue) {
        filteredValue[key] = value[key]
      }
    }

    return JSON.stringify(filteredValue)
  },
  decode: (str) => {
    const storedValue = JSON.parse(str)
    return normalizeSettings({ ...defaultValue, ...storedValue })
  },
})

export const getSettings = (key) => settingsState.get()[key]

export const updateSettings = (settingsChanges) =>
  settingsState.set(normalizeSettings({ ...settingsState.get(), ...settingsChanges }))

export const resetSettings = () => settingsState.set(defaultValue)
