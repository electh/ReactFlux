/* eslint-disable import/extensions */
import { HOTKEY_ACTIONS, sanitizeHotkeys } from "./hotkeys-config.js"
import {
  EXPORTABLE_SETTINGS_KEYS,
  pickExportableSettings,
  sanitizeSettings,
} from "./settings-config.js"
import sanitizeExpandedCategories from "./sidebar-config.js"

export const SETTINGS_TRANSFER_SCHEMA_VERSION = "1"

const SETTINGS_TRANSFER_ROOT = "reloadedflux-settings"

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'

const XML_ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
}

const XML_ENTITY_PATTERN = /[&<>"']/g
const WHITESPACE_ONLY_PATTERN = /^\s*$/
const XML_DECLARATION_PATTERN = /^\s*<\?xml[\s\S]*?\?>\s*/g
const padNumber = (value) => String(value).padStart(2, "0")

const escapeXml = (value) =>
  String(value).replaceAll(XML_ENTITY_PATTERN, (match) => XML_ENTITY_MAP[match])

const unescapeXml = (value) =>
  value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")

const stripXmlDeclaration = (xmlText) =>
  xmlText.replaceAll("\uFEFF", "").replaceAll(XML_DECLARATION_PATTERN, "").trim()

const parseAttributes = (attributesText) => {
  const attributes = {}
  const attributePattern = /([A-Za-z0-9:_-]+)\s*=\s*"([^"]*)"/g

  for (const match of attributesText.matchAll(attributePattern)) {
    attributes[match[1]] = unescapeXml(match[2])
  }

  return attributes
}

const extractSectionContent = (xmlText, tagName) => {
  const sectionPattern = new RegExp(String.raw`<${tagName}>([\s\S]*?)<\/${tagName}>`, "i")
  const match = xmlText.match(sectionPattern)
  return match ? match[1] : ""
}

const parseTypedValue = (rawValue, type) => {
  if (type === "boolean") {
    if (rawValue === "true") {
      return true
    }
    if (rawValue === "false") {
      return false
    }
    return null
  }

  if (type === "number") {
    const parsedValue = Number(rawValue)
    return Number.isFinite(parsedValue) ? parsedValue : null
  }

  if (type === "string") {
    return rawValue
  }

  return null
}

const serializeSettingValue = (value) => {
  if (typeof value === "boolean") {
    return { type: "boolean", value: String(value) }
  }

  if (typeof value === "number") {
    return { type: "number", value: String(value) }
  }

  return { type: "string", value: value ?? "" }
}

export const formatSettingsExportFilename = (date = new Date()) => {
  const year = date.getFullYear()
  const month = padNumber(date.getMonth() + 1)
  const day = padNumber(date.getDate())
  const hours = padNumber(date.getHours())
  const minutes = padNumber(date.getMinutes())

  return `reloadedflux-export-${year}${month}${day}-${hours}${minutes}.xml`
}

const normalizeSnapshot = ({ settings = {}, hotkeys = {}, expandedCategories = [] } = {}) => {
  const sanitizedSettings = pickExportableSettings(sanitizeSettings(settings))
  const sanitizedHotkeys = sanitizeHotkeys(hotkeys)
  const sanitizedExpandedCategories = sanitizeExpandedCategories(expandedCategories)

  return {
    settings: sanitizedSettings,
    hotkeys: sanitizedHotkeys,
    expandedCategories: sanitizedExpandedCategories,
  }
}

export const buildSettingsExportXmlFromSnapshot = (snapshot, metadata = {}) => {
  const normalizedSnapshot = normalizeSnapshot(snapshot)
  const exportedAt = metadata.exportedAt ?? new Date().toISOString()

  const settingsLines = EXPORTABLE_SETTINGS_KEYS.map((key) => {
    const { type, value } = serializeSettingValue(normalizedSnapshot.settings[key])
    return `    <setting key="${escapeXml(key)}" type="${type}">${escapeXml(value)}</setting>`
  })

  const hotkeyLines = HOTKEY_ACTIONS.map((action) => {
    const keys = normalizedSnapshot.hotkeys[action]
      .map((key) => `      <key>${escapeXml(key)}</key>`)
      .join("\n")

    return [`    <hotkey action="${escapeXml(action)}">`, keys, "    </hotkey>"].join("\n")
  })

  const expandedCategoryLines = normalizedSnapshot.expandedCategories.map(
    (categoryKey) => `    <expandedCategory key="${escapeXml(categoryKey)}" />`,
  )

  return [
    XML_DECLARATION,
    `<${SETTINGS_TRANSFER_ROOT} schemaVersion="${SETTINGS_TRANSFER_SCHEMA_VERSION}">`,
    `  <metadata exportedAt="${escapeXml(exportedAt)}" />`,
    "  <settings>",
    ...settingsLines,
    "  </settings>",
    "  <hotkeys>",
    ...hotkeyLines,
    "  </hotkeys>",
    "  <sidebar>",
    ...expandedCategoryLines,
    "  </sidebar>",
    `</${SETTINGS_TRANSFER_ROOT}>`,
  ].join("\n")
}

export const parseSettingsImportXml = (xmlText) => {
  if (typeof xmlText !== "string" || WHITESPACE_ONLY_PATTERN.test(xmlText)) {
    throw new Error("Empty settings file")
  }

  const normalizedXml = stripXmlDeclaration(xmlText)
  const rootMatch = normalizedXml.match(
    new RegExp(
      String.raw`^<${SETTINGS_TRANSFER_ROOT}\b([^>]*)>([\s\S]*)<\/${SETTINGS_TRANSFER_ROOT}>$`,
      "i",
    ),
  )

  if (!rootMatch) {
    throw new Error("Invalid settings file")
  }

  const rootAttributes = parseAttributes(rootMatch[1] ?? "")
  if (rootAttributes.schemaVersion !== SETTINGS_TRANSFER_SCHEMA_VERSION) {
    throw new Error("Unsupported settings file version")
  }

  const rootContent = rootMatch[2] ?? ""
  const settingsSection = extractSectionContent(rootContent, "settings")
  const hotkeysSection = extractSectionContent(rootContent, "hotkeys")
  const sidebarSection = extractSectionContent(rootContent, "sidebar")

  const parsedSettings = {}
  const settingPattern = /<setting\b([^>]*)>([\s\S]*?)<\/setting>/gi

  for (const match of settingsSection.matchAll(settingPattern)) {
    const attributes = parseAttributes(match[1] ?? "")
    const { key, type } = attributes

    if (!key || !EXPORTABLE_SETTINGS_KEYS.includes(key)) {
      continue
    }

    const parsedValue = parseTypedValue(unescapeXml(match[2] ?? ""), type)
    if (parsedValue !== null) {
      parsedSettings[key] = parsedValue
    }
  }

  const parsedHotkeys = {}
  const hotkeyPattern = /<hotkey\b([^>]*)>([\s\S]*?)<\/hotkey>/gi

  for (const match of hotkeysSection.matchAll(hotkeyPattern)) {
    const attributes = parseAttributes(match[1] ?? "")
    const { action } = attributes

    if (!action || !HOTKEY_ACTIONS.includes(action)) {
      continue
    }

    const keys = [...match[2].matchAll(/<key>([\s\S]*?)<\/key>/gi)].map((keyMatch) =>
      unescapeXml(keyMatch[1] ?? "").trim(),
    )
    parsedHotkeys[action] = keys.filter(Boolean)
  }

  const expandedCategories = [...sidebarSection.matchAll(/<expandedCategory\b([^>]*)\/>/gi)]
    .map((match) => {
      const attributes = parseAttributes(match[1] ?? "")
      if (attributes.key) {
        return attributes.key
      }
      if (attributes.id) {
        return `/category/${attributes.id}`
      }
      return null
    })
    .filter(Boolean)

  return normalizeSnapshot({
    settings: parsedSettings,
    hotkeys: parsedHotkeys,
    expandedCategories,
  })
}
