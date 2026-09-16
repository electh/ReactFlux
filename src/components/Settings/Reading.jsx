import { InputNumber, Message, Select, Slider, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"
import SettingSection from "./SettingSection"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { setContentBrowsingDirection } from "@/store/contentBrowsingDirectionState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { MAX_ENTRIES_PER_PAGE, MIN_ENTRIES_PER_PAGE } from "@/utils/constants"
import {
  CONTENT_BROWSING_DIRECTION_LTR,
  CONTENT_BROWSING_DIRECTION_RTL,
} from "@/utils/content-browsing-direction"

const REMOVE_DUPLICATES_OPTIONS = [
  { labelKey: "settings.remove_duplicates_option_none", value: "none" },
  { labelKey: "settings.remove_duplicates_option_hash", value: "hash" },
  { labelKey: "settings.remove_duplicates_option_title", value: "title" },
  { labelKey: "settings.remove_duplicates_option_url", value: "url" },
]

const Reading = () => {
  const {
    contentBrowsingDirection,
    enableContextMenu,
    enableSwipeGesture,
    markAllReadJumpToNext,
    markReadBy,
    markReadOnScroll,
    orderBy,
    pageSize,
    removeDuplicates,
    skipMarkAllReadConfirmation,
    swipeSensitivity,
    updateContentOnFetch,
  } = useStore(settingsState, {
    keys: [
      "contentBrowsingDirection",
      "enableContextMenu",
      "enableSwipeGesture",
      "markAllReadJumpToNext",
      "markReadBy",
      "markReadOnScroll",
      "orderBy",
      "pageSize",
      "removeDuplicates",
      "skipMarkAllReadConfirmation",
      "swipeSensitivity",
      "updateContentOnFetch",
    ],
  })
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

  const handleContentBrowsingDirectionChange = (value) => {
    const { conflicts } = setContentBrowsingDirection(value)
    if (conflicts.length > 0) {
      Message.error(
        polyglot.t("settings.content_browsing_direction_conflict_description", {
          keys: conflicts.join(", "),
        }),
      )
    }
  }

  return (
    <>
      <SettingSection title={polyglot.t("settings.section_article_list")}>
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

        <SettingItem
          description={polyglot.t("settings.entries_per_page_description")}
          title={polyglot.t("settings.entries_per_page_label")}
        >
          <InputNumber
            className="input-number input-number-compact"
            max={MAX_ENTRIES_PER_PAGE}
            min={MIN_ENTRIES_PER_PAGE}
            mode="button"
            precision={0}
            size="small"
            value={pageSize}
            onChange={(value) => updateSettings({ pageSize: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.remove_duplicates_description")}
          title={polyglot.t("settings.remove_duplicates_label")}
        >
          <Select
            className="input-select"
            value={removeDuplicates}
            onChange={(value) => updateSettings({ removeDuplicates: value })}
          >
            {REMOVE_DUPLICATES_OPTIONS.map(({ labelKey, value }) => (
              <Select.Option key={value} value={value}>
                {polyglot.t(labelKey)}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>
      </SettingSection>

      <SettingSection title={polyglot.t("settings.section_read_status")}>
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

        <SettingItem
          description={polyglot.t("settings.mark_read_on_scroll_description")}
          title={polyglot.t("settings.mark_read_on_scroll_label")}
        >
          <Switch
            checked={markReadOnScroll}
            onChange={(value) => updateSettings({ markReadOnScroll: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.skip_mark_all_read_confirmation_description")}
          title={polyglot.t("settings.skip_mark_all_read_confirmation_label")}
        >
          <Switch
            checked={skipMarkAllReadConfirmation}
            onChange={(value) => updateSettings({ skipMarkAllReadConfirmation: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.mark_all_read_jump_to_next_description")}
          title={polyglot.t("settings.mark_all_read_jump_to_next_label")}
        >
          <Switch
            checked={markAllReadJumpToNext}
            onChange={(value) => updateSettings({ markAllReadJumpToNext: value })}
          />
        </SettingItem>
      </SettingSection>

      <SettingSection title={polyglot.t("settings.section_content_interaction")}>
        <SettingItem
          description={polyglot.t("settings.content_browsing_direction_description")}
          title={polyglot.t("settings.content_browsing_direction_label")}
        >
          <Select
            className="input-select"
            value={contentBrowsingDirection}
            onChange={handleContentBrowsingDirectionChange}
          >
            <Select.Option value={CONTENT_BROWSING_DIRECTION_LTR}>
              {polyglot.t("settings.content_browsing_direction_option_ltr")}
            </Select.Option>
            <Select.Option value={CONTENT_BROWSING_DIRECTION_RTL}>
              {polyglot.t("settings.content_browsing_direction_option_rtl")}
            </Select.Option>
          </Select>
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.update_content_on_fetch_description")}
          title={polyglot.t("settings.update_content_on_fetch_label")}
        >
          <Switch
            checked={updateContentOnFetch}
            onChange={(value) => updateSettings({ updateContentOnFetch: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.enable_context_menu_description")}
          title={polyglot.t("settings.enable_context_menu_label")}
        >
          <Switch
            checked={enableContextMenu}
            onChange={(value) => updateSettings({ enableContextMenu: value })}
          />
        </SettingItem>

        {isBelowMedium && (
          <SettingItem
            description={polyglot.t("settings.enable_swipe_gesture_description")}
            title={polyglot.t("settings.enable_swipe_gesture_label")}
          >
            <Switch
              checked={enableSwipeGesture}
              onChange={(value) => updateSettings({ enableSwipeGesture: value })}
            />
          </SettingItem>
        )}

        {isBelowMedium && enableSwipeGesture && (
          <SettingItem
            description={polyglot.t("settings.swipe_sensitivity_description")}
            title={polyglot.t("settings.swipe_sensitivity_label")}
          >
            <Slider
              showTicks
              className="input-slider"
              max={1.5}
              min={0.5}
              step={0.25}
              value={swipeSensitivity}
              onChange={(value) => updateSettings({ swipeSensitivity: value })}
            />
          </SettingItem>
        )}
      </SettingSection>
    </>
  )
}

export default Reading
