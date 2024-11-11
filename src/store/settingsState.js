import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"

const defaultValue = {
  articleWidth: 90,
  edgeToEdgeImages: false,
  fontFamily: "system-ui",
  fontSize: 1.05,
  homePage: "all",
  language: getBrowserLanguage(),
  markReadOnScroll: false,
  orderBy: "created_at",
  orderDirection: "desc",
  pageSize: 100,
  removeDuplicates: "none",
  showDetailedRelativeTime: false,
  showEstimatedReadingTime: false,
  showFeedIcon: true,
  showHiddenFeeds: false,
  showStatus: "unread",
  showUnreadFeedsOnly: false,
  themeColor: "Blue",
  themeMode: "system",
  titleAlignment: "center",
}

export const settingsState = persistentAtom("settings", defaultValue, {
  encode: (value) => {
    const filteredValue = Object.keys(value).reduce((acc, key) => {
      if (key in defaultValue) {
        acc[key] = value[key]
      }
      return acc
    }, {})
    return JSON.stringify(filteredValue)
  },
  decode: (str) => {
    const storedValue = JSON.parse(str)
    return { ...defaultValue, ...storedValue }
  },
})

export const getSettings = (key) => settingsState.get()[key]

export const updateSettings = (settingsChanges) =>
  settingsState.set({ ...settingsState.get(), ...settingsChanges })

export const resetSettings = () => settingsState.set(defaultValue)
