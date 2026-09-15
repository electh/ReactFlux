export const CONTENT_BROWSING_DIRECTION_LTR = "ltr"
export const CONTENT_BROWSING_DIRECTION_RTL = "rtl"

export const CONTENT_BROWSING_DIRECTIONS = [
  CONTENT_BROWSING_DIRECTION_LTR,
  CONTENT_BROWSING_DIRECTION_RTL,
]

const DIRECTIONAL_HOTKEY_ACTIONS = new Set([
  "navigateToNextArticle",
  "navigateToNextCategory",
  "navigateToNextUnreadArticle",
  "navigateToPreviousArticle",
  "navigateToPreviousCategory",
  "navigateToPreviousUnreadArticle",
])

export const isRightToLeftBrowsing = (direction) => direction === CONTENT_BROWSING_DIRECTION_RTL

const swapHorizontalDirectionToken = (token) => {
  if (token === "left") {
    return "right"
  }
  if (token === "right") {
    return "left"
  }
  return token
}

const swapHorizontalDirectionInChord = (chord) =>
  chord
    .split("+")
    .map((token) => swapHorizontalDirectionToken(token))
    .join("+")

export const swapDirectionalNavigationHotkeys = (hotkeys) =>
  Object.fromEntries(
    Object.entries(hotkeys).map(([action, keys]) => [
      action,
      DIRECTIONAL_HOTKEY_ACTIONS.has(action)
        ? keys.map((key) => swapHorizontalDirectionInChord(key))
        : [...keys],
    ]),
  )
