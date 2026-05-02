import { Button, Divider, Modal, Select, Switch } from "@arco-design/web-react"
import { IconDownload, IconUpload } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useRef, useState } from "react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import { dataState } from "@/store/dataState"
import { replaceHotkeys } from "@/store/hotkeysState"
import { replaceSettingsPreservingAi, settingsState, updateSettings } from "@/store/settingsState"
import { replaceExpandedCategories } from "@/store/sidebarState"
import { Notification } from "@/utils/feedback"
import { downloadFile, readFileAsText } from "@/utils/file"
import {
  buildSettingsExportXml,
  formatSettingsExportFilename,
  parseSettingsImportXml,
} from "@/utils/settings-transfer"
import compareVersions from "@/utils/version"

const languageOptions = [
  { label: "English", value: "en-CA" },
  { label: "Deutsch", value: "de-DE" },
  { label: "Español", value: "es-ES" },
  { label: "Français", value: "fr-FR" },
  { label: "简体中文", value: "zh-CN" },
  { label: "Ελληνικά", value: "el-GR" },
]

const General = () => {
  const { version } = useStore(dataState)
  const { homePage, language, updateContentOnFetch } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const [importingSettings, setImportingSettings] = useState(false)
  const importInputRef = useRef(null)

  const homePageOptions = [
    { label: polyglot.t("settings.default_home_page_option_all"), value: "all" },
    { label: polyglot.t("settings.default_home_page_option_today"), value: "today" },
    { label: polyglot.t("settings.default_home_page_option_starred"), value: "starred" },
    { label: polyglot.t("settings.default_home_page_option_history"), value: "history" },
  ]

  const handleSettingsExport = () => {
    try {
      const xmlContent = buildSettingsExportXml()
      downloadFile(xmlContent, formatSettingsExportFilename(), "application/xml")
      Notification.success({ title: polyglot.t("settings.settings_export_success") })
    } catch (error) {
      Notification.error({
        title: polyglot.t("settings.settings_export_error"),
        content: error.message,
      })
    }
  }

  const applyImportedSettings = ({ settings, hotkeys, expandedCategories }) => {
    replaceSettingsPreservingAi(settings)
    replaceHotkeys(hotkeys)
    replaceExpandedCategories(expandedCategories)

    Notification.success({
      title: polyglot.t("settings.settings_import_success"),
      content: polyglot.t("settings.settings_import_reload_notice"),
    })

    globalThis.setTimeout(() => {
      globalThis.location.reload()
    }, 250)
  }

  const handleSettingsImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    setImportingSettings(true)

    try {
      const fileContent = await readFileAsText(file)
      const importedSnapshot = parseSettingsImportXml(fileContent)

      Modal.confirm({
        title: polyglot.t("settings.settings_import_confirm"),
        content: (
          <div>
            <p>{polyglot.t("settings.settings_import_description")}</p>
            <p>{polyglot.t("settings.settings_import_ai_notice")}</p>
          </div>
        ),
        okButtonProps: { status: "danger" },
        onOk: () => applyImportedSettings(importedSnapshot),
      })
    } catch (error) {
      Notification.error({
        title: polyglot.t("settings.settings_import_error"),
        content: error.message,
      })
    } finally {
      setImportingSettings(false)
    }
  }

  return (
    <>
      <SettingItem
        description={polyglot.t("appearance.language_description")}
        title={polyglot.t("appearance.language_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          value={language}
          onChange={(value) => updateSettings({ language: value })}
        >
          {languageOptions.map(({ label, value }) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.default_home_page_description")}
        title={polyglot.t("settings.default_home_page_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          value={homePage}
          onChange={(value) => updateSettings({ homePage: value })}
        >
          {homePageOptions.map(({ label, value }) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      {compareVersions(version, "2.2.8") >= 0 && (
        <>
          <Divider />

          <SettingItem
            description={polyglot.t("settings.update_content_on_fetch_description")}
            title={polyglot.t("settings.update_content_on_fetch_label")}
          >
            <Switch
              checked={updateContentOnFetch}
              onChange={(value) => updateSettings({ updateContentOnFetch: value })}
            />
          </SettingItem>
        </>
      )}

      <Divider />

      <SettingItem
        description={polyglot.t("settings.settings_transfer_description")}
        title={polyglot.t("settings.settings_transfer_label")}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            disabled={importingSettings}
            icon={<IconUpload />}
            onClick={() => importInputRef.current?.click()}
          >
            {polyglot.t("settings.import_settings")}
          </Button>
          <input
            ref={importInputRef}
            accept=".xml"
            disabled={importingSettings}
            style={{ display: "none" }}
            type="file"
            onChange={handleSettingsImport}
          />
          <Button icon={<IconDownload />} onClick={handleSettingsExport}>
            {polyglot.t("settings.export_settings")}
          </Button>
        </div>
      </SettingItem>
    </>
  )
}

export default General
