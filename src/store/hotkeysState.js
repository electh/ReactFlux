import { persistentAtom } from "@nanostores/persistent"
import { computed } from "nanostores"

import { getSettings } from "@/store/settingsState"
import {
  createDefaultHotkeys,
  decodeHotkeys,
  encodeHotkeys,
  findDuplicateHotkeys,
  sanitizeHotkeys,
} from "@/utils/hotkeys-schema"
import createSetter from "@/utils/nanostores"

const getDefaultHotkeys = () => createDefaultHotkeys(getSettings("contentBrowsingDirection"))
const defaultHotkeys = getDefaultHotkeys()

export const hotkeysState = persistentAtom("hotkeys", defaultHotkeys, {
  encode: (hotkeys) => encodeHotkeys(hotkeys, getDefaultHotkeys()),
  decode: (storedHotkeys) => decodeHotkeys(storedHotkeys, getDefaultHotkeys()),
})

export const duplicateHotkeysState = computed(hotkeysState, findDuplicateHotkeys)

export const updateHotkey = (action, keys) => {
  const setter = createSetter(hotkeysState, action)
  setter(keys)
}
export const resetHotkey = (action) => updateHotkey(action, getDefaultHotkeys()[action])
export const replaceHotkeys = (hotkeys) =>
  hotkeysState.set(sanitizeHotkeys(hotkeys, getDefaultHotkeys()))
