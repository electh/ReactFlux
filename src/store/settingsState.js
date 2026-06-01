import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"
import { prefersReducedMotion } from "@/utils/scroll"
import {
  createDefaultSettings,
  mergeImportedSettingsPreservingAi,
  sanitizeSettings,
} from "@/utils/settingsTransfer/settings-config"

// First-run only: seed `animationsEnabled` from the OS reduced-motion hint. The
// base default stays pure (`true`); once the user toggles it, the persisted
// value wins (decode/sanitize respect stored values). `resetSettings()` reuses
// this module-load value, so reset does not re-query the OS.
export const defaultValue = {
  ...createDefaultSettings(getBrowserLanguage()),
  animationsEnabled: !prefersReducedMotion(),
}

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
