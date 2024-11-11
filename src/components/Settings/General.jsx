import { Divider, InputNumber, Select, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"

const languageOptions = [
  { label: "English", value: "en-US" },
  { label: "Español", value: "es-ES" },
  { label: "Français", value: "fr-FR" },
  { label: "简体中文", value: "zh-CN" },
]

const General = () => {
  const { homePage, language, markReadOnScroll, orderBy, pageSize, removeDuplicates } =
    useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

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
          min={1}
          mode="button"
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
        description={polyglot.t("settings.mark_read_on_scroll_description")}
        title={polyglot.t("settings.mark_read_on_scroll_label")}
      >
        <Switch
          checked={markReadOnScroll}
          onChange={(value) => updateSettings({ markReadOnScroll: value })}
        />
      </SettingItem>
    </>
  )
}

export default General
