import { Divider, Select, Slider, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"
import { applyColor, colors, getDisplayColorValue } from "@/utils/colors"

import "./Appearance.css"

const handleConfigChange = (settingsChanges) => {
  updateSettings(settingsChanges)
  if (settingsChanges.themeColor) {
    applyColor(settingsChanges.themeColor)
  }
}

const Appearance = () => {
  const {
    coverDisplayMode,
    lightboxSlideAnimation,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    summaryLines,
    themeColor,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  return (
    <>
      <SettingItem
        description={polyglot.t("appearance.theme_color_description")}
        title={polyglot.t("appearance.theme_color_label")}
      >
        <fieldset className="theme-color-options">
          <legend className="visually-hidden">{polyglot.t("appearance.theme_color_label")}</legend>
          {Object.keys(colors).map((colorName) => {
            const localizedColorName = polyglot.t(
              `appearance.theme_color_${colorName.toLowerCase()}`,
            )

            return (
              <label key={colorName} className="theme-color-option">
                <input
                  checked={colorName === themeColor}
                  className="theme-color-input visually-hidden"
                  name="theme-color"
                  type="radio"
                  value={colorName}
                  onChange={() => handleConfigChange({ themeColor: colorName })}
                />
                <span
                  aria-hidden="true"
                  className="theme-color-swatch"
                  style={{ "--theme-color": getDisplayColorValue(colorName) }}
                />
                <span className="visually-hidden">
                  {polyglot.t("appearance.theme_color_aria_label", {
                    color: localizedColorName,
                  })}
                </span>
              </label>
            )
          })}
        </fieldset>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.cover_display_mode_description")}
        title={polyglot.t("appearance.cover_display_mode_label")}
      >
        <Select
          className="input-select"
          value={coverDisplayMode}
          onChange={(value) => handleConfigChange({ coverDisplayMode: value })}
        >
          <Select.Option value="auto">
            {polyglot.t("appearance.cover_display_mode_auto")}
          </Select.Option>
          <Select.Option value="banner">
            {polyglot.t("appearance.cover_display_mode_banner")}
          </Select.Option>
          <Select.Option value="thumbnail">
            {polyglot.t("appearance.cover_display_mode_thumbnail")}
          </Select.Option>
          <Select.Option value="none">
            {polyglot.t("appearance.cover_display_mode_none")}
          </Select.Option>
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.lightbox_animation_description")}
        title={polyglot.t("appearance.lightbox_animation_label")}
      >
        <Switch
          checked={lightboxSlideAnimation}
          onChange={(checked) =>
            handleConfigChange({
              lightboxSlideAnimation: checked,
            })
          }
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.show_detailed_relative_time_description")}
        title={polyglot.t("appearance.show_detailed_relative_time_label")}
      >
        <Switch
          checked={showDetailedRelativeTime}
          onChange={(value) => handleConfigChange({ showDetailedRelativeTime: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.show_estimated_reading_time_description")}
        title={polyglot.t("appearance.show_estimated_reading_time_label")}
      >
        <Switch
          checked={showEstimatedReadingTime}
          onChange={(value) => handleConfigChange({ showEstimatedReadingTime: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.show_feed_icon_description")}
        title={polyglot.t("appearance.show_feed_icon_label")}
      >
        <Switch
          checked={showFeedIcon}
          onChange={(value) => handleConfigChange({ showFeedIcon: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.summary_lines_description")}
        title={polyglot.t("appearance.summary_lines_label")}
      >
        <Slider
          className="input-slider"
          max={4}
          min={0}
          showTicks={true}
          step={1}
          value={summaryLines}
          onChange={(value) => handleConfigChange({ summaryLines: value })}
        />
      </SettingItem>
    </>
  )
}

export default Appearance
