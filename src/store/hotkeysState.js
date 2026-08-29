import { persistentAtom } from "@nanostores/persistent"
import { computed } from "nanostores"

import {
  createDefaultHotkeys,
  decodeHotkeys,
  encodeHotkeys,
  sanitizeHotkeys,
} from "@/utils/hotkeys-schema"
import createSetter from "@/utils/nanostores"

const defaultHotkeys = createDefaultHotkeys()

export const hotkeysState = persistentAtom("hotkeys", defaultHotkeys, {
  encode: (hotkeys) => encodeHotkeys(hotkeys, defaultHotkeys),
  decode: (storedHotkeys) => decodeHotkeys(storedHotkeys, defaultHotkeys),
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
