import {
  Divider,
  Slider,
  Space,
  Switch,
  Typography,
} from "@arco-design/web-react";

import { polyglotState } from "../../hooks/useLanguage";
import { applyColor, colors, getColorValue } from "../../utils/colors";

import { useStore } from "@nanostores/react";
import { settingsState, updateSettings } from "../../store/settingsState";
import "./Appearance.css";

const Appearance = () => {
  const {
    articleWidth,
    fontSize,
    layout,
    showDetailedRelativeTime,
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
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("appearance.theme_color_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("appearance.theme_color_description")}
          </Typography.Text>
        </div>
        <div style={{ display: "flex" }}>
          {Object.keys(colors).map((colorName) => (
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                margin: "2px",
                backgroundColor: getColorValue(colorName),
                cursor: "pointer",
                border: "3px solid var(--color-bg-3)",
                outline:
                  colorName === themeColor
                    ? `1px solid ${getColorValue(colorName)}`
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
            />
          ))}
        </div>
      </div>

      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("appearance.compact_article_list_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("appearance.compact_article_list_description")}
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={layout === "small"}
            onChange={(value) =>
              handleConfigChange({ layout: value ? "small" : "large" })
            }
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("appearance.show_detailed_relative_time_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("appearance.show_detailed_relative_time_description")}
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={showDetailedRelativeTime}
            onChange={(value) =>
              handleConfigChange({ showDetailedRelativeTime: value })
            }
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("appearance.show_feed_icon_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("appearance.show_feed_icon_description")}
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={showFeedIcon}
            onChange={(value) => handleConfigChange({ showFeedIcon: value })}
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("appearance.font_size_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("appearance.font_size_description")}
          </Typography.Text>
        </div>
        <div>
          <Space>
            <Typography.Text style={{ fontSize: "0.75rem" }}>A</Typography.Text>
            <Slider
              formatTooltip={(value) => `${value}rem`}
              max={1.25}
              min={0.75}
              showTicks
              step={0.05}
              style={{ width: 200 }}
              value={fontSize}
              onChange={(value) => handleConfigChange({ fontSize: value })}
            />
            <Typography.Text style={{ fontSize: "1.25rem" }}>A</Typography.Text>
          </Space>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("appearance.article_width_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("appearance.article_width_description")}
          </Typography.Text>
        </div>
        <div>
          <Space>
            <Typography.Text>60%</Typography.Text>
            <Slider
              formatTooltip={(value) => `${value}%`}
              max={90}
              min={60}
              showTicks
              step={10}
              style={{ width: 160 }}
              value={articleWidth}
              onChange={(value) => handleConfigChange({ articleWidth: value })}
            />
            <Typography.Text>90%</Typography.Text>
          </Space>
        </div>
      </div>
    </>
  );
};

export default Appearance;
