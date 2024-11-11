import { Divider, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"
import { applyColor, colors, getDisplayColorValue } from "@/utils/colors"

import "./Appearance.css"

const Appearance = () => {
  const { showDetailedRelativeTime, showEstimatedReadingTime, showFeedIcon, themeColor } =
    useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const handleConfigChange = (settingsChanges) => {
    updateSettings(settingsChanges)
    if (settingsChanges.themeColor) {
      applyColor(settingsChanges.themeColor)
    }
  }

  return (
    <>
      <SettingItem
        description={polyglot.t("appearance.theme_color_description")}
        title={polyglot.t("appearance.theme_color_label")}
      >
        <div style={{ display: "flex" }}>
          {Object.keys(colors).map((colorName) => (
            <div
              key={colorName}
              role="button"
              tabIndex={0}
              aria-label={polyglot.t("appearance.theme_color_aria_label", {
                color: colorName,
              })}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                margin: "2px",
                backgroundColor: getDisplayColorValue(colorName),
                cursor: "pointer",
                border: "3px solid var(--color-bg-3)",
                outline:
                  colorName === themeColor
                    ? `1px solid ${getDisplayColorValue(colorName)}`
                    : "none",
              }}
              onClick={() => handleConfigChange({ themeColor: colorName })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleConfigChange({ themeColor: colorName })
                }
              }}
            />
          ))}
        </div>
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
    </>
  )
}

export default Appearance
