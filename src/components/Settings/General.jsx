import { Divider, Select, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import { dataState } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
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

  const homePageOptions = [
    { label: polyglot.t("settings.default_home_page_option_all"), value: "all" },
    { label: polyglot.t("settings.default_home_page_option_today"), value: "today" },
    { label: polyglot.t("settings.default_home_page_option_starred"), value: "starred" },
    { label: polyglot.t("settings.default_home_page_option_history"), value: "history" },
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
    </>
  )
}

export default General
