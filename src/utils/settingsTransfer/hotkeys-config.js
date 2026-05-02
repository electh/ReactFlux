export const defaultHotkeys = {
  exitDetailView: ["esc"],
  fetchOriginalArticle: ["d"],
  navigateToNextArticle: ["n", "j", "right"],
  navigateToNextUnreadArticle: ["shift+n", "shift+j", "ctrl+right"],
  navigateToPreviousArticle: ["p", "k", "left"],
  navigateToPreviousUnreadArticle: ["shift+p", "shift+k", "ctrl+left"],
  openLinkExternally: ["v"],
  openPhotoSlider: ["i"],
  refreshArticleList: ["r"],
  saveToThirdPartyServices: ["s"],
  showHotkeysSettings: ["shift+?"],
  toggleReadStatus: ["m"],
  toggleStarStatus: ["f"],
}

export const HOTKEY_ACTIONS = Object.keys(defaultHotkeys)

export const sanitizeHotkeys = (value, defaults = defaultHotkeys) => {
  const storedValue = value && typeof value === "object" && !Array.isArray(value) ? value : {}
  const sanitizedHotkeys = {}

  for (const action of HOTKEY_ACTIONS) {
    const nextKeys = Array.isArray(storedValue[action])
      ? storedValue[action]
          .filter((key) => typeof key === "string")
          .map((key) => key.trim())
          .filter(Boolean)
      : defaults[action]

    sanitizedHotkeys[action] = [...new Set(nextKeys)]
  }

  return sanitizedHotkeys
}
