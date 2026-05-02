import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"
import {
  createDefaultSettings,
  mergeImportedSettingsPreservingAi,
  sanitizeSettings,
} from "@/utils/settingsTransfer/settings-config"

export const defaultValue = createDefaultSettings(getBrowserLanguage())

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
  decode: (str) => sanitizeSettings(JSON.parse(str), defaultValue),
})

export const getSettings = (key) => settingsState.get()[key]

export const replaceSettingsPreservingAi = (importedSettings) =>
  settingsState.set(
    mergeImportedSettingsPreservingAi(importedSettings, settingsState.get(), defaultValue),
  )

export const updateSettings = (settingsChanges) =>
  settingsState.set(sanitizeSettings({ ...settingsState.get(), ...settingsChanges }, defaultValue))

export const resetSettings = () => settingsState.set(defaultValue)

export { sanitizeSettings } from "@/utils/settingsTransfer/settings-config"
