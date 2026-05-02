/* eslint-disable import/extensions */
import assert from "node:assert/strict"
import test from "node:test"

import { defaultHotkeys, sanitizeHotkeys } from "./settingsTransfer/hotkeys-config.js"
import {
  AI_SETTINGS_KEYS,
  createDefaultSettings,
  mergeImportedSettingsPreservingAi,
  pickExportableSettings,
  sanitizeSettings,
} from "./settingsTransfer/settings-config.js"
import {
  buildSettingsExportXmlFromSnapshot,
  formatSettingsExportFilename,
  parseSettingsImportXml,
} from "./settingsTransfer/settings-transfer-core.js"
import { sanitizeExpandedCategories } from "./settingsTransfer/sidebar-config.js"

test("sanitizeSettings clamps numeric values and falls back on invalid enums", () => {
  const defaults = createDefaultSettings("en-CA")
  const sanitizedSettings = sanitizeSettings(
    {
      articleWidth: 200,
      sidebarWidth: 100,
      entryListWidth: 1000,
      fontSize: 5,
      markReadAfterSeconds: 0,
      pageSize: 0,
      swipeSensitivity: -1,
      layoutMode: "grid",
      themeColor: "Magenta",
      showStatus: "done",
    },
    defaults,
  )

  assert.equal(sanitizedSettings.articleWidth, 100)
  assert.equal(sanitizedSettings.sidebarWidth, 180)
  assert.equal(sanitizedSettings.entryListWidth, 900)
  assert.equal(sanitizedSettings.fontSize, 1.25)
  assert.equal(sanitizedSettings.markReadAfterSeconds, 1)
  assert.equal(sanitizedSettings.pageSize, defaults.pageSize)
  assert.equal(sanitizedSettings.swipeSensitivity, 0.5)
  assert.equal(sanitizedSettings.layoutMode, defaults.layoutMode)
  assert.equal(sanitizedSettings.themeColor, defaults.themeColor)
  assert.equal(sanitizedSettings.showStatus, defaults.showStatus)
})

test("pickExportableSettings removes all AI settings", () => {
  const settings = sanitizeSettings({
    ...createDefaultSettings("en-CA"),
    aiProvider: "anthropic",
    aiApiKeys: { anthropic: "secret" },
    aiModels: { anthropic: "claude" },
  })

  const exportableSettings = pickExportableSettings(settings)

  for (const key of AI_SETTINGS_KEYS) {
    assert.equal(key in exportableSettings, false)
  }

  assert.equal(exportableSettings.themeColor, settings.themeColor)
  assert.equal(exportableSettings.homePage, settings.homePage)
})

test("sanitizeHotkeys keeps known actions and sanitizeExpandedCategories deduplicates ids", () => {
  const sanitizedHotkeys = sanitizeHotkeys({
    navigateToNextArticle: ["j", "j", " right ", "", 5],
    unknownAction: ["x"],
  })

  assert.deepEqual(sanitizedHotkeys.navigateToNextArticle, ["j", "right"])
  assert.deepEqual(sanitizedHotkeys.toggleReadStatus, defaultHotkeys.toggleReadStatus)

  const expandedCategories = sanitizeExpandedCategories([
    1,
    "2",
    "/category/02",
    "  /category/3  ",
    -3,
    "",
    1,
  ])
  assert.deepEqual(expandedCategories, [
    "/category/1",
    "/category/2",
    "/category/02",
    "/category/3",
  ])
})

test("formatSettingsExportFilename uses local timestamp segments", () => {
  const filename = formatSettingsExportFilename(new Date(2026, 4, 2, 22, 34))

  assert.equal(filename, "reloadedflux-export-20260502-2234.xml")
})

test("build and parse settings transfer XML round-trip exportable settings", () => {
  const xmlContent = buildSettingsExportXmlFromSnapshot({
    settings: {
      ...createDefaultSettings("en-CA"),
      themeColor: "Red",
      homePage: "starred",
      aiProvider: "anthropic",
    },
    hotkeys: {
      ...defaultHotkeys,
      navigateToNextArticle: ["j", "n"],
    },
    expandedCategories: ["/category/5", "2", "/category/5"],
  })

  assert.equal(xmlContent.includes("aiProvider"), false)

  const parsedSnapshot = parseSettingsImportXml(xmlContent)

  assert.equal(parsedSnapshot.settings.themeColor, "Red")
  assert.equal(parsedSnapshot.settings.homePage, "starred")
  assert.deepEqual(parsedSnapshot.hotkeys.navigateToNextArticle, ["j", "n"])
  assert.deepEqual(parsedSnapshot.expandedCategories, ["/category/5", "/category/2"])
})

test("mergeImportedSettingsPreservingAi overwrites non-AI scope and keeps local AI settings", () => {
  const defaults = createDefaultSettings("en-CA")
  const currentSettings = sanitizeSettings(
    {
      ...defaults,
      themeColor: "Red",
      homePage: "history",
      aiProvider: "gemini",
      aiApiKeys: {
        ...defaults.aiApiKeys,
        gemini: "secret-key",
      },
      aiModels: {
        ...defaults.aiModels,
        gemini: "gemini-2.5-pro",
      },
      aiSummaryLanguage: "fr-FR",
    },
    defaults,
  )

  const mergedSettings = mergeImportedSettingsPreservingAi(
    {
      themeMode: "dark",
      homePage: "today",
    },
    currentSettings,
    defaults,
  )

  assert.equal(mergedSettings.themeMode, "dark")
  assert.equal(mergedSettings.homePage, "today")
  assert.equal(mergedSettings.themeColor, defaults.themeColor)
  assert.equal(mergedSettings.aiProvider, currentSettings.aiProvider)
  assert.equal(mergedSettings.aiApiKeys.gemini, currentSettings.aiApiKeys.gemini)
  assert.equal(mergedSettings.aiModels.gemini, currentSettings.aiModels.gemini)
  assert.equal(mergedSettings.aiSummaryLanguage, currentSettings.aiSummaryLanguage)
})

test("parseSettingsImportXml ignores unknown and AI keys and rejects unsupported versions", () => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<reloadedflux-settings schemaVersion="1">
  <metadata exportedAt="2026-05-02T00:00:00.000Z" />
  <settings>
    <setting key="themeColor" type="string">Orange</setting>
    <setting key="aiProvider" type="string">anthropic</setting>
    <setting key="unknownKey" type="string">ignored</setting>
  </settings>
  <hotkeys>
    <hotkey action="navigateToNextArticle">
      <key>j</key>
    </hotkey>
  </hotkeys>
  <sidebar>
    <expandedCategory key="/category/7" />
  </sidebar>
</reloadedflux-settings>`

  const parsedSnapshot = parseSettingsImportXml(xmlContent)
  assert.equal(parsedSnapshot.settings.themeColor, "Orange")
  assert.equal("aiProvider" in parsedSnapshot.settings, false)
  assert.deepEqual(parsedSnapshot.hotkeys.navigateToNextArticle, ["j"])
  assert.deepEqual(parsedSnapshot.expandedCategories, ["/category/7"])

  assert.throws(
    () => parseSettingsImportXml(xmlContent.replace('schemaVersion="1"', 'schemaVersion="99"')),
    /Unsupported settings file version/,
  )
})
