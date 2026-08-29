const DEFAULT_HOTKEYS = {
  exitDetailView: ["esc"],
  fetchOriginalArticle: ["d"],
  navigateToNextArticle: ["n", "j", "right"],
  navigateToNextCategory: [],
  navigateToNextUnreadArticle: ["shift+n", "shift+j", "ctrl+right"],
  navigateToPreviousArticle: ["p", "k", "left"],
  navigateToPreviousCategory: [],
  navigateToPreviousUnreadArticle: ["shift+p", "shift+k", "ctrl+left"],
  openLinkExternally: ["v"],
  openPhotoSlider: ["i"],
  refreshArticleList: ["r"],
  saveToThirdPartyServices: ["s"],
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

export const createDefaultHotkeys = () =>
  Object.fromEntries(Object.entries(DEFAULT_HOTKEYS).map(([action, keys]) => [action, [...keys]]))

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
