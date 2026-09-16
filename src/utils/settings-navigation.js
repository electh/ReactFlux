export const SETTINGS_TAB_KEYS = Object.freeze({
  GENERAL: "general",
  READING: "reading",
  APPEARANCE: "appearance",
  FEEDS: "feeds",
  CATEGORIES: "categories",
  HOTKEYS: "hotkeys",
})

export const DEFAULT_SETTINGS_TAB = SETTINGS_TAB_KEYS.GENERAL

const SETTINGS_TAB_DEFINITIONS = Object.freeze([
  {
    key: SETTINGS_TAB_KEYS.GENERAL,
    labelKey: "settings.general",
    availableBelowMedium: true,
  },
  {
    key: SETTINGS_TAB_KEYS.READING,
    labelKey: "settings.reading",
    availableBelowMedium: true,
  },
  {
    key: SETTINGS_TAB_KEYS.APPEARANCE,
    labelKey: "settings.appearance",
    availableBelowMedium: true,
  },
  {
    key: SETTINGS_TAB_KEYS.FEEDS,
    labelKey: "settings.feeds",
    availableBelowMedium: false,
  },
  {
    key: SETTINGS_TAB_KEYS.CATEGORIES,
    labelKey: "settings.categories",
    availableBelowMedium: true,
  },
  {
    key: SETTINGS_TAB_KEYS.HOTKEYS,
    labelKey: "settings.hotkeys",
    availableBelowMedium: false,
  },
])

export const getVisibleSettingsTabs = (isBelowMedium) =>
  SETTINGS_TAB_DEFINITIONS.filter(
    ({ availableBelowMedium }) => !isBelowMedium || availableBelowMedium,
  )

export const isSettingsTabAvailable = (tabKey, isBelowMedium) =>
  getVisibleSettingsTabs(isBelowMedium).some(({ key }) => key === tabKey)

export const resolveSettingsTab = (tabKey, isBelowMedium) =>
  isSettingsTabAvailable(tabKey, isBelowMedium) ? tabKey : DEFAULT_SETTINGS_TAB
