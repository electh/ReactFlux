import { MAX_ENTRIES_PER_PAGE, MIN_ENTRIES_PER_PAGE } from "@/utils/constants"
import { createDefaultHomePages, sanitizeHomePages } from "@/utils/home-page"

export const MIN_ARTICLE_FONT_SIZE = 1
const MAX_ARTICLE_FONT_SIZE = 1.5

const FONT_FAMILIES = [
  "system-ui",
  "sans-serif",
  "serif",
  "'Fira Sans', sans-serif",
  "'Open Sans', sans-serif",
  "'Source Sans Pro', sans-serif",
  "'Source Serif Pro', serif",
  "'Noto Sans', 'Noto Sans SC', sans-serif",
  "'Noto Serif', 'Noto Serif SC', serif",
  "'LXGW WenKai Screen', sans-serif",
]

const FONT_FAMILY_MIGRATIONS = {
  "'Noto Sans SC', sans-serif": "'Noto Sans', 'Noto Sans SC', sans-serif",
  "'Noto Serif SC', serif": "'Noto Serif', 'Noto Serif SC', serif",
}

const LANGUAGE_BY_BASE = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  zh: "zh-CN",
}

const booleanSetting = (defaultValue) => ({
  defaultValue,
  sanitize: (value, fallback) => (typeof value === "boolean" ? value : fallback),
})

const enumSetting = (defaultValue, values, migrations) => {
  const allowedValues = new Set(values)

  return {
    defaultValue,
    sanitize: (value, fallback) => {
      if (typeof value !== "string") {
        return fallback
      }

      const migratedValue = migrations?.[value] ?? value
      return allowedValues.has(migratedValue) ? migratedValue : fallback
    },
  }
}

const numberSetting = (defaultValue, min, max, { integer = false, precision = null } = {}) => ({
  defaultValue,
  sanitize: (value, fallback) => {
    if (!Number.isFinite(value)) {
      return fallback
    }

    const clampedValue = Math.min(max, Math.max(min, value))

    if (integer) {
      return Math.trunc(clampedValue)
    }
    if (precision === null) {
      return clampedValue
    }
    return Number(clampedValue.toFixed(precision))
  },
})

const sanitizeLanguage = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback
  }

  const [baseLanguage] = value.trim().toLowerCase().split("-", 1)
  return LANGUAGE_BY_BASE[baseLanguage] ?? fallback
}

const SETTINGS_SCHEMA = {
  articleWidth: numberSetting(75, 50, 100, { precision: 2 }),
  checkForUpdates: booleanSetting(false),
  compactSidebarGroups: booleanSetting(true),
  coverDisplayMode: enumSetting("auto", ["auto", "banner", "thumbnail"]),
  edgeToEdgeImages: booleanSetting(false),
  enableContextMenu: booleanSetting(true),
  enableSwipeGesture: booleanSetting(true),
  fontFamily: enumSetting("system-ui", FONT_FAMILIES, FONT_FAMILY_MIGRATIONS),
  fontSize: numberSetting(1.05, MIN_ARTICLE_FONT_SIZE, MAX_ARTICLE_FONT_SIZE, {
    precision: 2,
  }),
  homePage: enumSetting("all", ["all", "today", "starred", "history"]),
  homePages: {
    defaultValue: createDefaultHomePages(),
    sanitize: sanitizeHomePages,
  },
  language: {
    defaultValue: "en-US",
    sanitize: sanitizeLanguage,
  },
  lightboxSlideAnimation: booleanSetting(true),
  markAllReadJumpToNext: booleanSetting(false),
  markReadBy: enumSetting("view", ["view", "manually"]),
  markReadOnScroll: booleanSetting(false),
  orderBy: enumSetting("created_at", ["created_at", "published_at"]),
  orderDirection: enumSetting("desc", ["desc", "asc"]),
  pageSize: numberSetting(100, MIN_ENTRIES_PER_PAGE, MAX_ENTRIES_PER_PAGE, {
    integer: true,
  }),
  removeDuplicates: enumSetting("none", ["none", "hash", "title", "url"]),
  showDetailedRelativeTime: booleanSetting(false),
  summaryLines: numberSetting(4, 0, 4, { integer: true }),
  showEstimatedReadingTime: booleanSetting(false),
  showFeedIcon: booleanSetting(true),
  showHiddenFeeds: booleanSetting(false),
  showStatus: enumSetting("unread", ["unread", "all", "starred"]),
  showUnreadFeedsOnly: booleanSetting(false),
  skipMarkAllReadConfirmation: booleanSetting(false),
  swipeSensitivity: numberSetting(1, 0.5, 1.5, { precision: 2 }),
  themeColor: enumSetting("Blue", ["Red", "Orange", "Yellow", "Green", "Blue", "Violet"]),
  themeMode: enumSetting("system", ["system", "light", "dark"]),
  titleAlignment: enumSetting("center", ["left", "center"]),
  updateContentOnFetch: booleanSetting(false),
}

const DEFAULT_SETTINGS = Object.fromEntries(
  Object.entries(SETTINGS_SCHEMA).map(([key, definition]) => [key, definition.defaultValue]),
)

const isSettingsObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const createDefaultSettings = (language = DEFAULT_SETTINGS.language) => ({
  ...DEFAULT_SETTINGS,
  language: sanitizeLanguage(language, DEFAULT_SETTINGS.language),
})

export const sanitizeSettings = (value, fallbackSettings = DEFAULT_SETTINGS) => {
  const settings = isSettingsObject(value) ? value : {}
  const fallbacks = isSettingsObject(fallbackSettings) ? fallbackSettings : DEFAULT_SETTINGS
  const sanitizedSettings = {}

  for (const [key, { defaultValue, sanitize }] of Object.entries(SETTINGS_SCHEMA)) {
    const fallback = sanitize(fallbacks[key], defaultValue)
    sanitizedSettings[key] = sanitize(settings[key], fallback)
  }

  return sanitizedSettings
}

export const decodeSettings = (storedSettings, fallbackSettings = DEFAULT_SETTINGS) => {
  try {
    return sanitizeSettings(JSON.parse(storedSettings), fallbackSettings)
  } catch {
    return sanitizeSettings(fallbackSettings)
  }
}

export const encodeSettings = (settings, fallbackSettings = DEFAULT_SETTINGS) =>
  JSON.stringify(sanitizeSettings(settings, fallbackSettings))
