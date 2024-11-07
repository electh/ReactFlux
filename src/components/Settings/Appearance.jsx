import { Divider, Switch } from "@arco-design/web-react";

import { polyglotState } from "../../hooks/useLanguage";
import { applyColor, colors, getDisplayColorValue } from "../../utils/colors";

import { useStore } from "@nanostores/react";
import { settingsState, updateSettings } from "../../store/settingsState";
import SettingItem from "./SettingItem";
import "./Appearance.css";

const Appearance = () => {
  const {
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    themeColor,
  } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const handleConfigChange = (settingsChanges) => {
    updateSettings(settingsChanges);
    if (settingsChanges.themeColor) {
      applyColor(settingsChanges.themeColor);
    }
  };

  return (
    <>
      <SettingItem
        title={polyglot.t("appearance.theme_color_label")}
        description={polyglot.t("appearance.theme_color_description")}
      >
        <div style={{ display: "flex" }}>
          {Object.keys(colors).map((colorName) => (
            <div
              key={colorName}
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
                  handleConfigChange({ themeColor: colorName });
                }
              }}
              aria-label={polyglot.t("appearance.theme_color_aria_label", {
                color: colorName,
              })}
              role="button"
              tabIndex={0}
            />
          ))}
        </div>
      </SettingItem>

      <Divider />

      <SettingItem
        title={polyglot.t("appearance.show_detailed_relative_time_label")}
        description={polyglot.t(
          "appearance.show_detailed_relative_time_description",
        )}
      >
        <Switch
          checked={showDetailedRelativeTime}
          onChange={(value) =>
            handleConfigChange({ showDetailedRelativeTime: value })
          }
        />
      </SettingItem>

      <Divider />

      <SettingItem
        title={polyglot.t("appearance.show_estimated_reading_time_label")}
        description={polyglot.t(
          "appearance.show_estimated_reading_time_description",
        )}
      >
        <Switch
          checked={showEstimatedReadingTime}
          onChange={(value) =>
            handleConfigChange({ showEstimatedReadingTime: value })
          }
        />
      </SettingItem>

      <Divider />

      <SettingItem
        title={polyglot.t("appearance.show_feed_icon_label")}
        description={polyglot.t("appearance.show_feed_icon_description")}
      >
        <Switch
          checked={showFeedIcon}
          onChange={(value) => handleConfigChange({ showFeedIcon: value })}
        />
      </SettingItem>
    </>
  );
};

export default Appearance;
