let settingsTabsModulePromise

export const loadSettingsTabs = () => {
  settingsTabsModulePromise ??= import("@/components/Settings/SettingsTabs").catch((error) => {
    settingsTabsModulePromise = undefined
    throw error
  })

  return settingsTabsModulePromise
}

export const preloadSettingsTabs = () => {
  if (navigator.connection?.saveData !== true) {
    loadSettingsTabs().catch(() => null)
  }
}
