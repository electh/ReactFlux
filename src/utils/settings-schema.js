import { MAX_ENTRIES_PER_PAGE, MIN_ENTRIES_PER_PAGE } from "@/utils/constants"
import {
  CONTENT_BROWSING_DIRECTION_LTR,
  CONTENT_BROWSING_DIRECTIONS,
} from "@/utils/content-browsing-direction"
import { createDefaultHomePages, sanitizeHomePages } from "@/utils/home-page"
import {
  FONT_FAMILIES,
  MAX_ARTICLE_FONT_SIZE,
  MAX_ARTICLE_WIDTH,
  MIN_ARTICLE_FONT_SIZE,
  MIN_ARTICLE_WIDTH,
  SWIPE_SENSITIVITIES,
  THEME_MODES,
  TITLE_ALIGNMENTS,
} from "@/utils/settings-options"

const FONT_FAMILY_MIGRATIONS = {
  "'Noto Sans SC', sans-serif": "'Noto Sans', 'Noto Sans SC', sans-serif",
  "'Noto Serif SC', serif": "'Noto Serif', 'Noto Serif SC', serif",
}

const LANGUAGE_BY_BASE = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  ja: "ja-JP",
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

const nearestNumberSetting = (defaultValue, values) => ({
  defaultValue,
  sanitize: (value, fallback) => {
    const fallbackValue = values.includes(fallback) ? fallback : defaultValue
    if (!Number.isFinite(value)) {
      return fallbackValue
    }

    let nearest = values[0]
    for (const candidate of values.slice(1)) {
      const candidateDistance = Math.abs(candidate - value)
      const nearestDistance = Math.abs(nearest - value)
      if (
        candidateDistance < nearestDistance ||
        (candidateDistance === nearestDistance &&
          Math.abs(candidate - defaultValue) < Math.abs(nearest - defaultValue))
      ) {
        nearest = candidate
      }
    }
    return nearest
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
  articleWidth: numberSetting(75, MIN_ARTICLE_WIDTH, MAX_ARTICLE_WIDTH, { precision: 2 }),
  checkForUpdates: booleanSetting(false),
  compactSidebarGroups: booleanSetting(true),
  contentBrowsingDirection: enumSetting(
    CONTENT_BROWSING_DIRECTION_LTR,
    CONTENT_BROWSING_DIRECTIONS,
  ),
  coverDisplayMode: enumSetting("auto", ["auto", "banner", "thumbnail", "none"]),
  edgeToEdgeImages: booleanSetting(false),
  enableContextMenu: booleanSetting(true),
  enableSwipeGesture: booleanSetting(true),
  fontFamily: enumSetting("system-ui", FONT_FAMILIES, FONT_FAMILY_MIGRATIONS),
  fontSize: numberSetting(1.05, MIN_ARTICLE_FONT_SIZE, MAX_ARTICLE_FONT_SIZE, {
    precision: 2,
  }),
  // Retained for local data and v1/v2 backup migration. New settings use homePages.
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
  swipeSensitivity: nearestNumberSetting(1, SWIPE_SENSITIVITIES),
  themeColor: enumSetting("Blue", ["Red", "Orange", "Yellow", "Green", "Blue", "Violet"]),
  themeMode: enumSetting("system", THEME_MODES),
  titleAlignment: enumSetting("center", TITLE_ALIGNMENTS),
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
