import { hotkeysState, replaceHotkeys } from "@/store/hotkeysState"
import { replaceSettings, settingsState } from "@/store/settingsState"
import { expandedCategoriesState, replaceExpandedCategories } from "@/store/sidebarState"
import { CONTENT_BROWSING_DIRECTION_LTR } from "@/utils/content-browsing-direction"
import { createDefaultHomePages } from "@/utils/home-page"
import { createDefaultHotkeys, sanitizeHotkeys } from "@/utils/hotkeys-schema"
import { createDefaultSettings, sanitizeSettings } from "@/utils/settings-schema"
import { sanitizeExpandedCategories } from "@/utils/sidebar-schema"

const SETTINGS_BACKUP_FORMAT = "reactflux-settings"
const SETTINGS_BACKUP_SCHEMA_VERSION = 3
const HOTKEYS_REPRESENTATION_SCHEMA_VERSION = 3
const HOTKEYS_REPRESENTATION = "physical"
const SUPPORTED_SETTINGS_BACKUP_SCHEMA_VERSIONS = new Set([1, 2, SETTINGS_BACKUP_SCHEMA_VERSION])

export const MAX_SETTINGS_BACKUP_FILE_SIZE = 1024 * 1024

export const SETTINGS_IMPORT_ERROR_CODES = {
  INVALID_FILE: "invalid-file",
  UNSUPPORTED_VERSION: "unsupported-version",
}

class SettingsImportError extends Error {
  constructor(code) {
    super(code)
    this.code = code
    this.name = "SettingsImportError"
  }
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value)

const padNumber = (value) => String(value).padStart(2, "0")

export const formatSettingsBackupFilename = (date = new Date()) => {
  const year = date.getFullYear()
  const month = padNumber(date.getMonth() + 1)
  const day = padNumber(date.getDate())
  const hours = padNumber(date.getHours())
  const minutes = padNumber(date.getMinutes())

  return `reactflux-settings-${year}${month}${day}-${hours}${minutes}.json`
}

const sanitizeSnapshot = (
  { settings, hotkeys, expandedCategories },
  schemaVersion = SETTINGS_BACKUP_SCHEMA_VERSION,
) => {
  const fallbackSettings = createDefaultSettings(settings?.language)
  const settingsWithHomePages =
    schemaVersion === 1 ? { ...settings, homePages: createDefaultHomePages() } : settings
  const settingsWithBrowsingDirection =
    schemaVersion < HOTKEYS_REPRESENTATION_SCHEMA_VERSION
      ? {
          ...settingsWithHomePages,
          contentBrowsingDirection: CONTENT_BROWSING_DIRECTION_LTR,
        }
      : settingsWithHomePages
  const sanitizedSettings = sanitizeSettings(settingsWithBrowsingDirection, fallbackSettings)
  const fallbackHotkeys = createDefaultHotkeys(sanitizedSettings.contentBrowsingDirection)

  return {
    settings: sanitizedSettings,
    hotkeys: sanitizeHotkeys(hotkeys, fallbackHotkeys),
    expandedCategories: sanitizeExpandedCategories(expandedCategories),
  }
}

const getCurrentSnapshot = () =>
  sanitizeSnapshot({
    settings: settingsState.get(),
    hotkeys: hotkeysState.get(),
    expandedCategories: expandedCategoriesState.get(),
  })

const replaceSnapshot = ({ settings, hotkeys, expandedCategories }) => {
  replaceSettings(settings)
  replaceHotkeys(hotkeys)
  replaceExpandedCategories(expandedCategories)
}

const getExportableSettings = ({ homePage: _legacyHomePage, ...exportableSettings }) =>
  exportableSettings

export const buildSettingsBackup = () => {
  const { settings, hotkeys, expandedCategories } = getCurrentSnapshot()
  const backup = {
    format: SETTINGS_BACKUP_FORMAT,
    schemaVersion: SETTINGS_BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      settings: getExportableSettings(settings),
      hotkeys,
      hotkeysRepresentation: HOTKEYS_REPRESENTATION,
      sidebar: { expandedCategories },
    },
  }

  return `${JSON.stringify(backup, null, 2)}\n`
}

export const parseSettingsBackup = (value) => {
  let backup

  try {
    backup = JSON.parse(value)
  } catch {
    throw new SettingsImportError(SETTINGS_IMPORT_ERROR_CODES.INVALID_FILE)
  }

  if (!isObject(backup) || backup.format !== SETTINGS_BACKUP_FORMAT) {
    throw new SettingsImportError(SETTINGS_IMPORT_ERROR_CODES.INVALID_FILE)
  }

  if (!SUPPORTED_SETTINGS_BACKUP_SCHEMA_VERSIONS.has(backup.schemaVersion)) {
    throw new SettingsImportError(SETTINGS_IMPORT_ERROR_CODES.UNSUPPORTED_VERSION)
  }

  const { data } = backup
  if (
    !isObject(data) ||
    !isObject(data.settings) ||
    !isObject(data.hotkeys) ||
    !isObject(data.sidebar) ||
    !Array.isArray(data.sidebar.expandedCategories) ||
    (backup.schemaVersion >= HOTKEYS_REPRESENTATION_SCHEMA_VERSION &&
      data.hotkeysRepresentation !== HOTKEYS_REPRESENTATION)
  ) {
    throw new SettingsImportError(SETTINGS_IMPORT_ERROR_CODES.INVALID_FILE)
  }

  return sanitizeSnapshot(
    {
      settings: data.settings,
      hotkeys: data.hotkeys,
      expandedCategories: data.sidebar.expandedCategories,
    },
    backup.schemaVersion,
  )
}

export const applySettingsBackup = (snapshot) => {
  const sanitizedSnapshot = sanitizeSnapshot(snapshot)
  const previousSnapshot = getCurrentSnapshot()

  try {
    replaceSnapshot(sanitizedSnapshot)
  } catch (error) {
    try {
      replaceSnapshot(previousSnapshot)
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "Failed to import or restore settings")
    }

    throw error
  }
}
