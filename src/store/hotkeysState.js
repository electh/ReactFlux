import { persistentAtom } from "@nanostores/persistent"
import { computed } from "nanostores"

import createSetter from "@/utils/nanostores"
import { defaultHotkeys, sanitizeHotkeys } from "@/utils/settingsTransfer/hotkeys-config"

export const hotkeysState = persistentAtom("hotkeys", defaultHotkeys, {
  encode: (value) => {
    const filteredValue = {}

    for (const key of Object.keys(value)) {
      if (key in defaultHotkeys) {
        filteredValue[key] = value[key]
      }
    }

    return JSON.stringify(filteredValue)
  },
  decode: (str) => sanitizeHotkeys(JSON.parse(str), defaultHotkeys),
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
export const resetHotkey = (action) => updateHotkey(action, defaultHotkeys[action])
export const replaceHotkeys = (hotkeys) =>
  hotkeysState.set(sanitizeHotkeys(hotkeys, defaultHotkeys))

export { defaultHotkeys, sanitizeHotkeys } from "@/utils/settingsTransfer/hotkeys-config"
