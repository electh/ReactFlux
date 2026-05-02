export const AI_PROVIDER_KEYS = ["anthropic", "gemini", "perplexity", "ollama", "lmstudio"]

export const AI_SETTINGS_KEYS = [
  "aiApiKey",
  "aiApiKeys",
  "aiModel",
  "aiModels",
  "aiProvider",
  "aiSummaryLanguage",
  "aiSummaryExcludedLanguage",
]

export const THEME_COLOR_NAMES = [
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Blue",
  "YInMn Blue",
  "Violet",
  "OLED",
  "Gray",
]

const ENUM_VALUES = {
  aiProvider: ["none", ...AI_PROVIDER_KEYS],
  coverDisplayMode: ["auto", "banner", "thumbnail"],
  homePage: ["all", "today", "starred", "history"],
  layoutMode: ["classic", "stream"],
  markReadBy: ["view", "manually"],
  orderBy: ["created_at", "published_at"],
  orderDirection: ["desc", "asc"],
  removeDuplicates: ["none", "hash", "title", "url"],
  showStatus: ["unread", "all", "starred"],
  themeColor: THEME_COLOR_NAMES,
  themeMode: ["system", "light", "dark"],
  titleAlignment: ["left", "center"],
}

const BOOLEAN_SETTINGS_KEYS = [
  "animationsEnabled",
  "compactSidebarGroups",
  "edgeToEdgeImages",
  "enableContextMenu",
  "enableSwipeGesture",
  "markReadOnScroll",
  "showDetailedRelativeTime",
  "showEstimatedReadingTime",
  "showFeedIcon",
  "showHiddenFeeds",
  "streamRenderSelectedOnly",
  "showUnreadFeedsOnly",
  "updateContentOnFetch",
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const toFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null

const sanitizeBoundedNumber = (
  value,
  fallback,
  min,
  max,
  { round = false, decimals = null } = {},
) => {
  const numeric = toFiniteNumber(value)
  if (numeric === null) {
    return fallback
  }

  let sanitized = clamp(numeric, min, max)
  if (round) {
    sanitized = Math.round(sanitized)
  } else if (typeof decimals === "number") {
    sanitized = Number(sanitized.toFixed(decimals))
  }

  return sanitized
}

const sanitizePositiveInteger = (value, fallback) => {
  const numeric = toFiniteNumber(value)
  if (numeric === null || numeric < 1) {
    return fallback
  }
  return Math.round(numeric)
}

const sanitizeString = (value, fallback, { trim = false } = {}) => {
  if (typeof value !== "string") {
    return fallback
  }

  const nextValue = trim ? value.trim() : value
  return nextValue
}

const sanitizeEnum = (value, fallback, allowedValues) => {
  if (typeof value !== "string") {
    return fallback
  }

  return allowedValues.includes(value) ? value : fallback
}

const sanitizeProviderMap = (value, defaults) => {
  const nextValue = { ...defaults }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return nextValue
  }

  for (const provider of AI_PROVIDER_KEYS) {
    nextValue[provider] = sanitizeString(value[provider], defaults[provider], { trim: true })
  }

  return nextValue
}

export const createDefaultSettings = (language = "en-CA") => ({
  aiApiKey: "",
  aiApiKeys: {
    anthropic: "",
    gemini: "",
    perplexity: "",
    ollama: "",
    lmstudio: "",
  },
  aiModels: {
    anthropic: "",
    gemini: "",
    perplexity: "",
    ollama: "",
    lmstudio: "",
  },
  aiModel: "",
  aiProvider: "none",
  aiSummaryLanguage: "en-CA",
  aiSummaryExcludedLanguage: "",
  animationsEnabled: true,
  articleWidth: 75,
  sidebarWidth: 240,
  entryListWidth: 420,
  compactSidebarGroups: true,
  coverDisplayMode: "auto",
  edgeToEdgeImages: false,
  enableContextMenu: true,
  enableSwipeGesture: true,
  fontFamily: "system-ui",
  fontSize: 1.05,
  homePage: "all",
  language,
  layoutMode: "classic",
  markReadBy: "view",
  markReadAfterSeconds: 3,
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
  streamRenderSelectedOnly: false,
  showUnreadFeedsOnly: false,
  swipeSensitivity: 1,
  themeColor: "Blue",
  themeMode: "system",
  titleAlignment: "center",
  updateContentOnFetch: false,
})

const DEFAULT_SETTINGS_FOR_EXPORT_KEYS = createDefaultSettings("en-CA")

export const EXPORTABLE_SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS_FOR_EXPORT_KEYS).filter(
  (key) => !AI_SETTINGS_KEYS.includes(key),
)

export const pickSettings = (settings, keys) =>
  Object.fromEntries(keys.map((key) => [key, settings[key]]))

export const pickAiSettings = (settings) => pickSettings(settings, AI_SETTINGS_KEYS)

export const pickExportableSettings = (settings) => pickSettings(settings, EXPORTABLE_SETTINGS_KEYS)

export const sanitizeSettings = (value, defaultSettings = createDefaultSettings("en-CA")) => {
  const storedValue =
    value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {}

  if (
    typeof storedValue.animationsEnabled !== "boolean" &&
    typeof storedValue.lightboxSlideAnimation === "boolean"
  ) {
    storedValue.animationsEnabled = storedValue.lightboxSlideAnimation
  }

  const sanitizedSettings = { ...defaultSettings, ...storedValue }

  for (const key of BOOLEAN_SETTINGS_KEYS) {
    sanitizedSettings[key] =
      typeof storedValue[key] === "boolean" ? storedValue[key] : defaultSettings[key]
  }

  sanitizedSettings.aiApiKey = sanitizeString(storedValue.aiApiKey, defaultSettings.aiApiKey, {
    trim: true,
  })
  sanitizedSettings.aiProvider = sanitizeEnum(
    storedValue.aiProvider,
    defaultSettings.aiProvider,
    ENUM_VALUES.aiProvider,
  )
  sanitizedSettings.aiModel = sanitizeString(storedValue.aiModel, defaultSettings.aiModel, {
    trim: true,
  })
  sanitizedSettings.aiApiKeys = sanitizeProviderMap(
    storedValue.aiApiKeys,
    defaultSettings.aiApiKeys,
  )
  sanitizedSettings.aiModels = sanitizeProviderMap(storedValue.aiModels, defaultSettings.aiModels)
  sanitizedSettings.aiSummaryLanguage = sanitizeString(
    storedValue.aiSummaryLanguage,
    defaultSettings.aiSummaryLanguage,
    { trim: true },
  )
  sanitizedSettings.aiSummaryExcludedLanguage = sanitizeString(
    storedValue.aiSummaryExcludedLanguage,
    defaultSettings.aiSummaryExcludedLanguage,
    { trim: true },
  )

  sanitizedSettings.articleWidth = sanitizeBoundedNumber(
    storedValue.articleWidth,
    defaultSettings.articleWidth,
    50,
    100,
    { round: true },
  )
  sanitizedSettings.sidebarWidth = sanitizeBoundedNumber(
    storedValue.sidebarWidth,
    defaultSettings.sidebarWidth,
    180,
    480,
    { round: true },
  )
  sanitizedSettings.entryListWidth = sanitizeBoundedNumber(
    storedValue.entryListWidth,
    defaultSettings.entryListWidth,
    280,
    900,
    { round: true },
  )
  sanitizedSettings.fontSize = sanitizeBoundedNumber(
    storedValue.fontSize,
    defaultSettings.fontSize,
    0.75,
    1.25,
    { decimals: 2 },
  )
  sanitizedSettings.markReadAfterSeconds = sanitizeBoundedNumber(
    storedValue.markReadAfterSeconds,
    defaultSettings.markReadAfterSeconds,
    1,
    5,
    { round: true },
  )
  sanitizedSettings.pageSize = sanitizePositiveInteger(
    storedValue.pageSize,
    defaultSettings.pageSize,
  )
  sanitizedSettings.swipeSensitivity = sanitizeBoundedNumber(
    storedValue.swipeSensitivity,
    defaultSettings.swipeSensitivity,
    0.5,
    1.5,
    { decimals: 2 },
  )

  sanitizedSettings.coverDisplayMode = sanitizeEnum(
    storedValue.coverDisplayMode,
    defaultSettings.coverDisplayMode,
    ENUM_VALUES.coverDisplayMode,
  )
  sanitizedSettings.homePage = sanitizeEnum(
    storedValue.homePage,
    defaultSettings.homePage,
    ENUM_VALUES.homePage,
  )
  sanitizedSettings.layoutMode = sanitizeEnum(
    storedValue.layoutMode,
    defaultSettings.layoutMode,
    ENUM_VALUES.layoutMode,
  )
  sanitizedSettings.markReadBy = sanitizeEnum(
    storedValue.markReadBy,
    defaultSettings.markReadBy,
    ENUM_VALUES.markReadBy,
  )
  sanitizedSettings.orderBy = sanitizeEnum(
    storedValue.orderBy,
    defaultSettings.orderBy,
    ENUM_VALUES.orderBy,
  )
  sanitizedSettings.orderDirection = sanitizeEnum(
    storedValue.orderDirection,
    defaultSettings.orderDirection,
    ENUM_VALUES.orderDirection,
  )
  sanitizedSettings.removeDuplicates = sanitizeEnum(
    storedValue.removeDuplicates,
    defaultSettings.removeDuplicates,
    ENUM_VALUES.removeDuplicates,
  )
  sanitizedSettings.showStatus = sanitizeEnum(
    storedValue.showStatus,
    defaultSettings.showStatus,
    ENUM_VALUES.showStatus,
  )
  sanitizedSettings.themeColor = sanitizeEnum(
    storedValue.themeColor,
    defaultSettings.themeColor,
    ENUM_VALUES.themeColor,
  )
  sanitizedSettings.themeMode = sanitizeEnum(
    storedValue.themeMode,
    defaultSettings.themeMode,
    ENUM_VALUES.themeMode,
  )
  sanitizedSettings.titleAlignment = sanitizeEnum(
    storedValue.titleAlignment,
    defaultSettings.titleAlignment,
    ENUM_VALUES.titleAlignment,
  )

  sanitizedSettings.fontFamily = sanitizeString(storedValue.fontFamily, defaultSettings.fontFamily)
  sanitizedSettings.language = sanitizeString(storedValue.language, defaultSettings.language, {
    trim: true,
  })

  if (
    sanitizedSettings.aiApiKey &&
    sanitizedSettings.aiProvider !== "none" &&
    !sanitizedSettings.aiApiKeys[sanitizedSettings.aiProvider]
  ) {
    sanitizedSettings.aiApiKeys[sanitizedSettings.aiProvider] = sanitizedSettings.aiApiKey
  }

  if (
    sanitizedSettings.aiModel &&
    sanitizedSettings.aiProvider !== "none" &&
    !sanitizedSettings.aiModels[sanitizedSettings.aiProvider]
  ) {
    sanitizedSettings.aiModels[sanitizedSettings.aiProvider] = sanitizedSettings.aiModel
  }

  return sanitizedSettings
}

export const mergeImportedSettingsPreservingAi = (
  importedSettings,
  currentSettings,
  defaultSettings = createDefaultSettings("en-CA"),
) => {
  const nextSettings = {
    ...defaultSettings,
    ...pickAiSettings(currentSettings),
    ...pickExportableSettings(importedSettings),
  }

  return sanitizeSettings(nextSettings, defaultSettings)
}
