import {
  CONTENT_BROWSING_DIRECTION_LTR,
  isRightToLeftBrowsing,
  swapDirectionalNavigationHotkeys,
} from "@/utils/content-browsing-direction"

const DEFAULT_HOTKEYS = {
  exitDetailView: ["esc"],
  fetchOriginalArticle: ["d"],
  navigateToNextArticle: ["n", "l", "right"],
  navigateToNextCategory: [],
  navigateToNextUnreadArticle: ["shift+n", "shift+l", "ctrl+right"],
  navigateToPreviousArticle: ["p", "h", "left"],
  navigateToPreviousCategory: [],
  navigateToPreviousUnreadArticle: ["shift+p", "shift+h", "ctrl+left"],
  openLinkExternally: ["v"],
  openPhotoSlider: ["i"],
  openSearchModal: ["/"],
  refreshArticleList: ["r"],
  saveToThirdPartyServices: ["s"],
  scrollArticleDown: ["j", "down", "space"],
  scrollArticleUp: ["k", "up", "shift+space"],
  showHotkeysSettings: ["shift+?"],
  toggleReadStatus: ["m"],
  toggleStarStatus: ["f"],
}

const HOTKEY_ACTIONS = Object.keys(DEFAULT_HOTKEYS)

const isHotkeysObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const sanitizeKeys = (value, fallback) => {
  if (!Array.isArray(value)) {
    return [...fallback]
  }

  const sanitizedKeys = value
    .filter((key) => typeof key === "string")
    .map((key) => key.trim())
    .filter(Boolean)

  return [...new Set(sanitizedKeys)]
}

export const createDefaultHotkeys = (contentBrowsingDirection = CONTENT_BROWSING_DIRECTION_LTR) => {
  const hotkeys = Object.fromEntries(
    Object.entries(DEFAULT_HOTKEYS).map(([action, keys]) => [action, [...keys]]),
  )

  return isRightToLeftBrowsing(contentBrowsingDirection)
    ? swapDirectionalNavigationHotkeys(hotkeys)
    : hotkeys
}

export const findDuplicateHotkeys = (hotkeys) => {
  const keyCounts = {}

  for (const key of Object.values(hotkeys).flat()) {
    keyCounts[key] = (keyCounts[key] ?? 0) + 1
  }

  return Object.entries(keyCounts)
    .filter(([, count]) => count > 1)
    .map(([key]) => key)
}

export const sanitizeHotkeys = (value, fallbackHotkeys = DEFAULT_HOTKEYS) => {
  const hotkeys = isHotkeysObject(value) ? value : {}
  const fallbacks = isHotkeysObject(fallbackHotkeys) ? fallbackHotkeys : DEFAULT_HOTKEYS
  const sanitizedHotkeys = {}

  for (const action of HOTKEY_ACTIONS) {
    const fallbackKeys = sanitizeKeys(fallbacks[action], DEFAULT_HOTKEYS[action])
    sanitizedHotkeys[action] = sanitizeKeys(hotkeys[action], fallbackKeys)
  }

  return sanitizedHotkeys
}

export const decodeHotkeys = (value, fallbackHotkeys = DEFAULT_HOTKEYS) => {
  try {
    return sanitizeHotkeys(JSON.parse(value), fallbackHotkeys)
  } catch {
    return sanitizeHotkeys(fallbackHotkeys)
  }
}

export const encodeHotkeys = (value, fallbackHotkeys = DEFAULT_HOTKEYS) =>
  JSON.stringify(sanitizeHotkeys(value, fallbackHotkeys))
