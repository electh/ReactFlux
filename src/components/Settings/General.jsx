import {
  Button,
  Divider,
  InputNumber,
  Message,
  Modal,
  Select,
  Slider,
  Switch,
} from "@arco-design/web-react"
import { IconDownload, IconInfoCircleFill, IconUpload } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useRef, useState } from "react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { settingsState, updateSettings } from "@/store/settingsState"
import { confirmDialogProps, destructiveConfirmButtonProps } from "@/utils/confirm-dialog"
import { MAX_ENTRIES_PER_PAGE, MIN_ENTRIES_PER_PAGE } from "@/utils/constants"
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
  { label: "简体中文", value: "zh-CN" },
]

const General = () => {
  const {
    checkForUpdates,
    compactSidebarGroups,
    enableContextMenu,
    enableSwipeGesture,
    homePage,
    language,
    markAllReadJumpToNext,
    markReadBy,
    markReadOnScroll,
    orderBy,
    pageSize,
    removeDuplicates,
    skipMarkAllReadConfirmation,
    swipeSensitivity,
    updateContentOnFetch,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()
  const importInputRef = useRef(null)
  const [isImportingSettings, setIsImportingSettings] = useState(false)

  const homePageOptions = [
    {
      label: polyglot.t("settings.default_home_page_option_all"),
      value: "all",
    },
    {
      label: polyglot.t("settings.default_home_page_option_today"),
      value: "today",
    },
    {
      label: polyglot.t("settings.default_home_page_option_starred"),
      value: "starred",
    },
    {
      label: polyglot.t("settings.default_home_page_option_history"),
      value: "history",
    },
  ]
  const removeDuplicatesOptions = [
    {
      label: polyglot.t("settings.remove_duplicates_option_none"),
      value: "none",
    },
    {
      label: polyglot.t("settings.remove_duplicates_option_hash"),
      value: "hash",
    },
    {
      label: polyglot.t("settings.remove_duplicates_option_title"),
      value: "title",
    },
    {
      label: polyglot.t("settings.remove_duplicates_option_url"),
      value: "url",
    },
  ]

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
      <SettingItem
        description={polyglot.t("appearance.language_description")}
        title={polyglot.t("appearance.language_label")}
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

      <Divider />

      <SettingItem
        description={polyglot.t("settings.default_home_page_description")}
        title={polyglot.t("settings.default_home_page_label")}
      >
        <Select
          className="input-select"
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

      <Divider />

      <SettingItem
        description={polyglot.t("settings.entries_order_description")}
        title={polyglot.t("settings.entries_order_label")}
      >
        <Select
          className="input-select"
          value={orderBy}
          onChange={(value) => updateSettings({ orderBy: value })}
        >
          <Select.Option value="published_at">
            {polyglot.t("settings.entries_order_option_published_at")}
          </Select.Option>
          <Select.Option value="created_at">
            {polyglot.t("settings.entries_order_option_created_at")}
          </Select.Option>
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.entries_per_page_description")}
        title={polyglot.t("settings.entries_per_page_label")}
      >
        <InputNumber
          className="input-select"
          defaultValue={pageSize}
          max={MAX_ENTRIES_PER_PAGE}
          min={MIN_ENTRIES_PER_PAGE}
          mode="button"
          precision={0}
          size="small"
          onChange={(value) => updateSettings({ pageSize: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.remove_duplicates_description")}
        title={polyglot.t("settings.remove_duplicates_label")}
      >
        <Select
          className="input-select"
          value={removeDuplicates}
          onChange={(value) => updateSettings({ removeDuplicates: value })}
        >
          {removeDuplicatesOptions.map(({ label, value }) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.mark_read_by_description")}
        title={polyglot.t("settings.mark_read_by_label")}
      >
        <Select
          className="input-select"
          value={markReadBy}
          onChange={(value) => updateSettings({ markReadBy: value })}
        >
          <Select.Option value="view">{polyglot.t("settings.mark_read_on_view")}</Select.Option>
          <Select.Option value="manually">
            {polyglot.t("settings.mark_read_manually")}
          </Select.Option>
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.mark_read_on_scroll_description")}
        title={polyglot.t("settings.mark_read_on_scroll_label")}
      >
        <Switch
          checked={markReadOnScroll}
          onChange={(value) => updateSettings({ markReadOnScroll: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.skip_mark_all_read_confirmation_description")}
        title={polyglot.t("settings.skip_mark_all_read_confirmation_label")}
      >
        <Switch
          checked={skipMarkAllReadConfirmation}
          onChange={(value) => updateSettings({ skipMarkAllReadConfirmation: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.mark_all_read_jump_to_next_description")}
        title={polyglot.t("settings.mark_all_read_jump_to_next_label")}
      >
        <Switch
          checked={markAllReadJumpToNext}
          onChange={(value) => updateSettings({ markAllReadJumpToNext: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.enable_context_menu_description")}
        title={polyglot.t("settings.enable_context_menu_label")}
      >
        <Switch
          checked={enableContextMenu}
          onChange={(value) => updateSettings({ enableContextMenu: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.compact_sidebar_groups_description")}
        title={polyglot.t("settings.compact_sidebar_groups_label")}
      >
        <Switch
          checked={compactSidebarGroups}
          onChange={(value) => updateSettings({ compactSidebarGroups: value })}
        />
      </SettingItem>

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

      <Divider />

      <SettingItem
        description={polyglot.t("settings.check_for_updates_description")}
        title={polyglot.t("settings.check_for_updates_label")}
      >
        <Switch
          checked={checkForUpdates}
          onChange={(value) => updateSettings({ checkForUpdates: value })}
        />
      </SettingItem>

      {isBelowMedium && (
        <>
          <Divider />

          <SettingItem
            description={polyglot.t("settings.enable_swipe_gesture_description")}
            title={polyglot.t("settings.enable_swipe_gesture_label")}
          >
            <Switch
              checked={enableSwipeGesture}
              onChange={(value) => updateSettings({ enableSwipeGesture: value })}
            />
          </SettingItem>

          {enableSwipeGesture && (
            <>
              <Divider />

              <SettingItem
                description={polyglot.t("settings.swipe_sensitivity_description")}
                title={polyglot.t("settings.swipe_sensitivity_label")}
              >
                <Slider
                  className="input-slider"
                  max={1.5}
                  min={0.5}
                  showTicks={true}
                  step={0.25}
                  value={swipeSensitivity}
                  onChange={(value) => updateSettings({ swipeSensitivity: value })}
                />
              </SettingItem>
            </>
          )}
        </>
      )}

      <Divider />

      <SettingItem
        description={polyglot.t("settings.settings_transfer_description")}
        title={polyglot.t("settings.settings_transfer_label")}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
    </>
  )
}

export default General
