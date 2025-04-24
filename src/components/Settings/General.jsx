import { Divider, InputNumber, Select, Slider, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { dataState } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import compareVersions from "@/utils/version"

const languageOptions = [
  { label: "Deutsch", value: "de-DE" },
  { label: "English", value: "en-US" },
  { label: "Español", value: "es-ES" },
  { label: "Français", value: "fr-FR" },
  { label: "简体中文", value: "zh-CN" },
]

const General = () => {
  const { version } = useStore(dataState)
  const {
    enableSwipeGesture,
    homePage,
    language,
    markReadBy,
    markReadOnScroll,
    orderBy,
    pageSize,
    removeDuplicates,
    swipeSensitivity,
    updateContentOnFetch,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

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
    </>
  )
}

export default General
