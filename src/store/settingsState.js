import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"

const defaultValue = {
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
  language: getBrowserLanguage(),
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
}

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

    if (
      typeof storedValue.animationsEnabled !== "boolean" &&
      typeof storedValue.lightboxSlideAnimation === "boolean"
    ) {
      storedValue.animationsEnabled = storedValue.lightboxSlideAnimation
    }

    // Keep the saved article width within the supported percentage range.
    if (typeof storedValue.articleWidth === "number") {
      const clamped = Math.min(100, Math.max(50, storedValue.articleWidth))
      storedValue.articleWidth = Math.round(clamped)
    }

    if (typeof storedValue.sidebarWidth === "number") {
      storedValue.sidebarWidth = Math.min(480, Math.max(180, storedValue.sidebarWidth))
    }

    if (typeof storedValue.entryListWidth === "number") {
      storedValue.entryListWidth = Math.min(900, Math.max(280, storedValue.entryListWidth))
    }

    if (typeof storedValue.markReadAfterSeconds === "number") {
      storedValue.markReadAfterSeconds = Math.min(
        5,
        Math.max(1, Math.round(storedValue.markReadAfterSeconds)),
      )
    }

    if (storedValue.layoutMode && !["classic", "stream"].includes(storedValue.layoutMode)) {
      storedValue.layoutMode = "classic"
    }

    if (
      storedValue.aiProvider &&
      !["none", "anthropic", "gemini", "perplexity", "ollama", "lmstudio"].includes(
        storedValue.aiProvider,
      )
    ) {
      storedValue.aiProvider = "none"
      storedValue.aiModel = ""
    }

    if (!storedValue.aiApiKeys || typeof storedValue.aiApiKeys !== "object") {
      storedValue.aiApiKeys = {}
    }

    if (
      storedValue.aiApiKey &&
      storedValue.aiProvider &&
      storedValue.aiProvider !== "none" &&
      !storedValue.aiApiKeys[storedValue.aiProvider]
    ) {
      storedValue.aiApiKeys[storedValue.aiProvider] = storedValue.aiApiKey
    }

    if (!storedValue.aiModels || typeof storedValue.aiModels !== "object") {
      storedValue.aiModels = {}
    }

    if (
      storedValue.aiModel &&
      storedValue.aiProvider &&
      storedValue.aiProvider !== "none" &&
      !storedValue.aiModels[storedValue.aiProvider]
    ) {
      storedValue.aiModels[storedValue.aiProvider] = storedValue.aiModel
    }

    return { ...defaultValue, ...storedValue }
  },
})

export const getSettings = (key) => settingsState.get()[key]

export const updateSettings = (settingsChanges) =>
  settingsState.set({ ...settingsState.get(), ...settingsChanges })

export const resetSettings = () => settingsState.set(defaultValue)
