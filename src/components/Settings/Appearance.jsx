import { InputNumber, Select, Slider, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"
import SettingSection from "./SettingSection"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { settingsState, updateSettings } from "@/store/settingsState"
import { applyColor, colors, getDisplayColorValue } from "@/utils/colors"
import {
  createFontFamilyOptions,
  MAX_ARTICLE_FONT_SIZE,
  MAX_ARTICLE_WIDTH,
  MIN_ARTICLE_FONT_SIZE,
  MIN_ARTICLE_WIDTH,
  THEME_MODE_OPTIONS,
  TITLE_ALIGNMENT_OPTIONS,
} from "@/utils/settings-options"

import "./Appearance.css"

const handleConfigChange = (settingsChanges) => {
  updateSettings(settingsChanges)
  if (settingsChanges.themeColor) {
    applyColor(settingsChanges.themeColor)
  }
}

const Appearance = () => {
  const {
    articleWidth,
    compactSidebarGroups,
    coverDisplayMode,
    edgeToEdgeImages,
    fontFamily,
    fontSize,
    lightboxSlideAnimation,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    summaryLines,
    themeColor,
    themeMode,
    titleAlignment,
  } = useStore(settingsState, {
    keys: [
      "articleWidth",
      "compactSidebarGroups",
      "coverDisplayMode",
      "edgeToEdgeImages",
      "fontFamily",
      "fontSize",
      "lightboxSlideAnimation",
      "showDetailedRelativeTime",
      "showEstimatedReadingTime",
      "showFeedIcon",
      "summaryLines",
      "themeColor",
      "themeMode",
      "titleAlignment",
    ],
  })
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()
  const fontFamilyOptions = createFontFamilyOptions(polyglot)

  return (
    <>
      <SettingSection title={polyglot.t("appearance.section_theme_interface")}>
        <SettingItem
          description={polyglot.t("appearance.theme_mode_description")}
          title={polyglot.t("appearance.theme_mode_label")}
        >
          <Select
            className="input-select"
            value={themeMode}
            onChange={(value) => handleConfigChange({ themeMode: value })}
          >
            {THEME_MODE_OPTIONS.map(({ labelKey, value }) => (
              <Select.Option key={value} value={value}>
                {polyglot.t(labelKey)}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.theme_color_description")}
          title={polyglot.t("appearance.theme_color_label")}
        >
          <fieldset className="theme-color-options">
            <legend className="visually-hidden">
              {polyglot.t("appearance.theme_color_label")}
            </legend>
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

        <SettingItem
          description={polyglot.t("settings.compact_sidebar_groups_description")}
          title={polyglot.t("settings.compact_sidebar_groups_label")}
        >
          <Switch
            checked={compactSidebarGroups}
            onChange={(value) => handleConfigChange({ compactSidebarGroups: value })}
          />
        </SettingItem>
      </SettingSection>

      <SettingSection title={polyglot.t("appearance.section_article_cards")}>
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

        <SettingItem
          description={polyglot.t("appearance.show_feed_icon_description")}
          title={polyglot.t("appearance.show_feed_icon_label")}
        >
          <Switch
            checked={showFeedIcon}
            onChange={(value) => handleConfigChange({ showFeedIcon: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.show_detailed_relative_time_description")}
          title={polyglot.t("appearance.show_detailed_relative_time_label")}
        >
          <Switch
            checked={showDetailedRelativeTime}
            onChange={(value) => handleConfigChange({ showDetailedRelativeTime: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.show_estimated_reading_time_description")}
          title={polyglot.t("appearance.show_estimated_reading_time_label")}
        >
          <Switch
            checked={showEstimatedReadingTime}
            onChange={(value) => handleConfigChange({ showEstimatedReadingTime: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.summary_lines_description")}
          title={polyglot.t("appearance.summary_lines_label")}
        >
          <Slider
            showTicks
            className="input-slider"
            max={4}
            min={0}
            step={1}
            value={summaryLines}
            onChange={(value) => handleConfigChange({ summaryLines: value })}
          />
        </SettingItem>
      </SettingSection>

      <SettingSection title={polyglot.t("appearance.section_article_view")}>
        <SettingItem
          description={polyglot.t("appearance.font_family_description")}
          title={polyglot.t("appearance.font_family_label")}
        >
          <Select
            className="input-select"
            value={fontFamily}
            onChange={(value) => handleConfigChange({ fontFamily: value })}
          >
            {fontFamilyOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.font_size_description")}
          title={polyglot.t("appearance.font_size_label")}
        >
          <InputNumber
            className="input-number"
            max={MAX_ARTICLE_FONT_SIZE}
            min={MIN_ARTICLE_FONT_SIZE}
            mode="button"
            size="small"
            step={0.05}
            suffix="rem"
            value={fontSize}
            onChange={(value) => handleConfigChange({ fontSize: value })}
          />
        </SettingItem>

        {!isBelowMedium && (
          <SettingItem
            description={polyglot.t("appearance.article_width_description")}
            title={polyglot.t("appearance.article_width_label")}
          >
            <InputNumber
              className="input-number"
              max={MAX_ARTICLE_WIDTH}
              min={MIN_ARTICLE_WIDTH}
              mode="button"
              size="small"
              step={5}
              suffix="ch"
              value={articleWidth}
              onChange={(value) => handleConfigChange({ articleWidth: value })}
            />
          </SettingItem>
        )}

        <SettingItem
          description={polyglot.t("appearance.title_alignment_description")}
          title={polyglot.t("appearance.title_alignment_label")}
        >
          <Select
            className="input-select"
            value={titleAlignment}
            onChange={(value) => handleConfigChange({ titleAlignment: value })}
          >
            {TITLE_ALIGNMENT_OPTIONS.map(({ labelKey, value }) => (
              <Select.Option key={value} value={value}>
                {polyglot.t(labelKey)}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>

        {isBelowMedium && (
          <SettingItem
            description={polyglot.t("appearance.edge_to_edge_images_description")}
            title={polyglot.t("appearance.edge_to_edge_images_label")}
          >
            <Switch
              checked={edgeToEdgeImages}
              onChange={(value) => handleConfigChange({ edgeToEdgeImages: value })}
            />
          </SettingItem>
        )}

        <SettingItem
          description={polyglot.t("appearance.lightbox_animation_description")}
          title={polyglot.t("appearance.lightbox_animation_label")}
        >
          <Switch
            checked={lightboxSlideAnimation}
            onChange={(value) => handleConfigChange({ lightboxSlideAnimation: value })}
          />
        </SettingItem>
      </SettingSection>
    </>
  )
}

export default Appearance
