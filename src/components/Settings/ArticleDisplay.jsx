import { Divider, InputNumber, Select, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"

const ArticleDisplay = () => {
  const {
    articleWidth,
    coverDisplayMode,
    fontSize,
    layoutMode,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    titleAlignment,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const isCombinedLayout = layoutMode === "stream"

  return (
    <>
      <SettingItem
        description={polyglot.t("settings.content.title_alignment_description")}
        title={polyglot.t("appearance.title_alignment_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          value={titleAlignment}
          onChange={(value) => updateSettings({ titleAlignment: value })}
        >
          <Select.Option value="left">
            {polyglot.t("appearance.title_alignment_left") || "Left"}
          </Select.Option>
          <Select.Option value="center">
            {polyglot.t("appearance.title_alignment_center") || "Center"}
          </Select.Option>
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        title={
          polyglot.t("settings.content.article_font_size_label") ||
          polyglot.t("appearance.font_size_label")
        }
      >
        <InputNumber
          className="input-select"
          max={1.25}
          min={0.75}
          size="small"
          step={0.05}
          style={{ width: 120 }}
          suffix="rem"
          value={fontSize}
          onChange={(value) => updateSettings({ fontSize: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem title={polyglot.t("appearance.article_width_label")}>
        <InputNumber
          className="input-select"
          max={100}
          min={50}
          size="small"
          step={2}
          style={{ width: 120 }}
          suffix="%"
          value={articleWidth}
          onChange={(value) => updateSettings({ articleWidth: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.cover_display_mode_description")}
        disabled={isCombinedLayout}
        disabledLabel={polyglot.t("settings.disabled_label")}
        title={polyglot.t("appearance.cover_display_mode_label")}
        disabledReason={polyglot.t("settings.only_available_in_layout", {
          layout: polyglot.t("appearance.layout_mode_classic"),
        })}
      >
        <Select
          className="input-select"
          disabled={isCombinedLayout}
          getPopupContainer={() => document.body}
          value={coverDisplayMode}
          onChange={(value) => updateSettings({ coverDisplayMode: value })}
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
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.show_detailed_relative_time_description")}
        title={polyglot.t("appearance.show_detailed_relative_time_label")}
      >
        <Switch
          checked={showDetailedRelativeTime}
          onChange={(value) => updateSettings({ showDetailedRelativeTime: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.show_estimated_reading_time_description")}
        title={polyglot.t("appearance.show_estimated_reading_time_label")}
      >
        <Switch
          checked={showEstimatedReadingTime}
          onChange={(value) => updateSettings({ showEstimatedReadingTime: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.show_feed_icon_description")}
        title={polyglot.t("appearance.show_feed_icon_label")}
      >
        <Switch
          checked={showFeedIcon}
          onChange={(value) => updateSettings({ showFeedIcon: value })}
        />
      </SettingItem>
    </>
  )
}

export default ArticleDisplay
