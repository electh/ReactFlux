import { Button, Message, Modal, Select, Switch, Tooltip } from "@arco-design/web-react"
import {
  IconDownload,
  IconInfoCircleFill,
  IconRight,
  IconUpload,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useRef, useState } from "react"

import HomePagePicker from "./HomePagePicker"
import SettingItem from "./SettingItem"
import SettingSection from "./SettingSection"

import useHomePage from "@/hooks/useHomePage"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { ensureCurrentHomePage } from "@/store/homePageState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { confirmDialogProps, destructiveConfirmButtonProps } from "@/utils/confirm-dialog"
import { downloadFile, readFileAsText } from "@/utils/file"
import {
  applySettingsBackup,
  buildSettingsBackup,
  formatSettingsBackupFilename,
  MAX_SETTINGS_BACKUP_FILE_SIZE,
  parseSettingsBackup,
  SETTINGS_IMPORT_ERROR_CODES,
} from "@/utils/settings-transfer"

const languageOptions = [
  { label: "Deutsch", value: "de-DE" },
  { label: "English", value: "en-US" },
  { label: "Español", value: "es-ES" },
  { label: "Français", value: "fr-FR" },
  { label: "日本語", value: "ja-JP" },
  { label: "简体中文", value: "zh-CN" },
]

const General = () => {
  const { checkForUpdates, language } = useStore(settingsState, {
    keys: ["checkForUpdates", "language"],
  })
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()
  const importInputRef = useRef(null)
  const [isImportingSettings, setIsImportingSettings] = useState(false)
  const [homePagePickerVisible, setHomePagePickerVisible] = useState(false)
  const { identityError, identityReady, label: homePageLabel } = useHomePage()

  let homePageSummaryLabel = homePageLabel
  if (!identityReady) {
    const statusKey = identityError
      ? "home_page.identity_unavailable"
      : "home_page.identity_loading"
    homePageSummaryLabel = polyglot.t(statusKey)
  }

  const handleSettingsExport = () => {
    try {
      downloadFile(
        buildSettingsBackup(),
        formatSettingsBackupFilename(),
        "application/json;charset=utf-8",
      )
      Message.success(polyglot.t("settings.settings_export_success"))
    } catch {
      Message.error(polyglot.t("settings.settings_export_error"))
    }
  }

  const applyImportedSettings = (snapshot) => {
    try {
      applySettingsBackup(snapshot)
      ensureCurrentHomePage()
      Message.success(polyglot.t("settings.settings_import_success"))
      globalThis.setTimeout(() => globalThis.location.reload(), 600)
    } catch (error) {
      Message.error(polyglot.t("settings.settings_import_error"))
      return Promise.reject(error)
    }
  }

  const getSettingsImportErrorMessage = (error) => {
    if (error?.code === SETTINGS_IMPORT_ERROR_CODES.UNSUPPORTED_VERSION) {
      return polyglot.t("settings.settings_import_unsupported_version")
    }

    if (error?.code === SETTINGS_IMPORT_ERROR_CODES.INVALID_FILE) {
      return polyglot.t("settings.settings_import_invalid_file")
    }

    return polyglot.t("settings.settings_import_error")
  }

  const handleSettingsImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (file.size > MAX_SETTINGS_BACKUP_FILE_SIZE) {
      Message.error(polyglot.t("settings.settings_import_file_too_large"))
      return
    }

    setIsImportingSettings(true)

    try {
      const importedSnapshot = parseSettingsBackup(await readFileAsText(file))

      Modal.confirm({
        ...confirmDialogProps,
        title: polyglot.t("settings.settings_import_confirm"),
        content: <p>{polyglot.t("settings.settings_import_description")}</p>,
        icon: <IconInfoCircleFill aria-hidden="true" />,
        okButtonProps: { ...destructiveConfirmButtonProps, status: "danger" },
        onOk: () => applyImportedSettings(importedSnapshot),
      })
    } catch (error) {
      Message.error(getSettingsImportErrorMessage(error))
    } finally {
      setIsImportingSettings(false)
    }
  }

  return (
    <>
      <SettingSection title={polyglot.t("settings.section_language_startup")}>
        <SettingItem
          description={polyglot.t("settings.language_description")}
          title={polyglot.t("settings.language_label")}
        >
          <Select
            className="input-select"
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

        <SettingItem
          description={polyglot.t("settings.default_home_page_description")}
          title={polyglot.t("settings.default_home_page_label")}
        >
          <Tooltip
            content={homePageSummaryLabel}
            disabled={isBelowMedium || !identityReady}
            trigger={["hover", "focus"]}
          >
            <Button
              aria-expanded={homePagePickerVisible}
              aria-haspopup="dialog"
              className="home-page-summary"
              disabled={!identityReady}
              onClick={() => setHomePagePickerVisible(true)}
            >
              <span>{homePageSummaryLabel}</span>
              <IconRight aria-hidden="true" />
            </Button>
          </Tooltip>
          <HomePagePicker
            visible={homePagePickerVisible}
            onClose={() => setHomePagePickerVisible(false)}
          />
        </SettingItem>
      </SettingSection>

      <SettingSection title={polyglot.t("settings.section_data_maintenance")}>
        <SettingItem
          description={polyglot.t("settings.check_for_updates_description")}
          title={polyglot.t("settings.check_for_updates_label")}
        >
          <Switch
            checked={checkForUpdates}
            onChange={(value) => updateSettings({ checkForUpdates: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.settings_transfer_description")}
          title={polyglot.t("settings.settings_transfer_label")}
        >
          <div className="settings-transfer-actions">
            <Button
              icon={<IconUpload aria-hidden="true" />}
              loading={isImportingSettings}
              onClick={() => importInputRef.current?.click()}
            >
              {polyglot.t("settings.import_settings")}
            </Button>
            <Button icon={<IconDownload aria-hidden="true" />} onClick={handleSettingsExport}>
              {polyglot.t("settings.export_settings")}
            </Button>
            <input
              ref={importInputRef}
              accept=".json,application/json"
              aria-hidden="true"
              style={{ display: "none" }}
              tabIndex={-1}
              type="file"
              onChange={handleSettingsImport}
            />
          </div>
        </SettingItem>
      </SettingSection>
    </>
  )
}

export default General
