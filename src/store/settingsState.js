import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"
import {
  createDefaultSettings,
  decodeSettings,
  encodeSettings,
  sanitizeSettings,
} from "@/utils/settings-schema"

const defaultSettings = createDefaultSettings(getBrowserLanguage())

export const settingsState = persistentAtom("settings", defaultSettings, {
  encode: (settings) => encodeSettings(settings, defaultSettings),
  decode: (storedSettings) => decodeSettings(storedSettings, defaultSettings),
})

export const getSettings = (key) => settingsState.get()[key]

export const updateSettings = (settingsChanges) => {
  const currentSettings = settingsState.get()
  const canMergeChanges =
    settingsChanges !== null &&
    typeof settingsChanges === "object" &&
    !Array.isArray(settingsChanges)
  const nextSettings = canMergeChanges
    ? { ...currentSettings, ...settingsChanges }
    : currentSettings

  settingsState.set(sanitizeSettings(nextSettings, currentSettings))
}

export const replaceSettings = (settings) =>
  settingsState.set(sanitizeSettings(settings, defaultSettings))

export const resetSettings = () => settingsState.set({ ...defaultSettings })

export { MIN_ARTICLE_FONT_SIZE } from "@/utils/settings-schema"
