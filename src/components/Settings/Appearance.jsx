import {
  Divider,
  Radio,
  Select,
  Slider,
  Space,
  Switch,
  Typography,
} from "@arco-design/web-react";
import { IconAlignCenter, IconAlignLeft } from "@arco-design/web-react/icon";

import { polyglotState } from "../../hooks/useLanguage";
import { applyColor, colors, getDisplayColorValue } from "../../utils/colors";

import { useStore } from "@nanostores/react";
import { settingsState, updateSettings } from "../../store/settingsState";
import SettingItem from "./SettingItem";
import "./Appearance.css";

const Appearance = () => {
  const {
    articleWidth,
    fontSize,
    fontFamily,
    layout,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    themeColor,
    titleAlignment,
  } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const fontFamilyOptions = [
    { label: polyglot.t("appearance.font_family_system"), value: "system-ui" },
    { label: "Sans-serif", value: "sans-serif" },
    { label: "Serif", value: "serif" },
    { label: "Fira Sans", value: "'Fira Sans', sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
    { label: "Source Serif Pro", value: "'Source Serif Pro', serif" },
    {
      label: polyglot.t("appearance.font_family_noto_sans"),
      value: "'Noto Sans SC', sans-serif",
    },
    {
      label: polyglot.t("appearance.font_family_noto_serif"),
      value: "'Noto Serif SC', serif",
    },
    {
      label: polyglot.t("appearance.font_family_lxgw_wenkai"),
      value: "'LXGW WenKai Screen', sans-serif",
    },
  ];

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
        title={polyglot.t("appearance.compact_article_card_label")}
        description={polyglot.t("appearance.compact_article_card_description")}
      >
        <Switch
          checked={layout === "small"}
          onChange={(value) =>
            handleConfigChange({ layout: value ? "small" : "large" })
          }
        />
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

      <Divider />

      <SettingItem
        title={polyglot.t("appearance.title_alignment_label")}
        description={polyglot.t("appearance.title_alignment_description")}
      >
        <Radio.Group
          type="button"
          name="title-alignment"
          value={titleAlignment}
          onChange={(value) => handleConfigChange({ titleAlignment: value })}
        >
          <Radio value="left">
            <IconAlignLeft />
          </Radio>
          <Radio value="center">
            <IconAlignCenter />
          </Radio>
        </Radio.Group>
      </SettingItem>

      <Divider />

      <SettingItem
        title={polyglot.t("appearance.font_family_label")}
        description={polyglot.t("appearance.font_family_description")}
      >
        <Select
          style={{ width: 166 }}
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

      <Divider />

      <SettingItem
        title={polyglot.t("appearance.font_size_label")}
        description={polyglot.t("appearance.font_size_description")}
      >
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
      </SettingItem>

      <Divider />

      <SettingItem
        title={polyglot.t("appearance.article_width_label")}
        description={polyglot.t("appearance.article_width_description")}
      >
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
      </SettingItem>
    </>
  );
};

export default Appearance;
