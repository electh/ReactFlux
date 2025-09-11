import { persistentAtom } from "@nanostores/persistent"
import { computed } from "nanostores"

import createSetter from "@/utils/nanostores"

const defaultValue = {
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

export const hotkeysState = persistentAtom("hotkeys", defaultValue, {
  encode: (value) => {
    const filteredValue = {}

    for (const key of Object.keys(value)) {
      if (key in defaultValue) {
        filteredValue[key] = value[key]
      }
    }

    return JSON.stringify(filteredValue)
  },
  decode: (str) => {
    const storedValue = JSON.parse(str)
    return { ...defaultValue, ...storedValue }
  },
})

export const duplicateHotkeysState = computed(hotkeysState, (hotkeys) => {
  const allKeys = Object.values(hotkeys).flat()
  const keyCount = {}

  for (const key of allKeys) {
    keyCount[key] = (keyCount[key] || 0) + 1
  }

  return Object.entries(keyCount)
    .filter(([_key, count]) => count > 1)
    .map(([key]) => key)
})

export const updateHotkey = (action, keys) => {
  const setter = createSetter(hotkeysState, action)
  setter(keys)
}
export const resetHotkey = (action) => updateHotkey(action, defaultValue[action])
