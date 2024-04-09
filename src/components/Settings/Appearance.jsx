import {
  Divider,
  Radio,
  Slider,
  Space,
  Switch,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import React from "react";

import useStore from "../../Store";
import darkThemePreview from "../../assets/dark.png";
import lightThemePreview from "../../assets/light.png";
import systemThemePreview from "../../assets/system.png";
import { applyColor, colors, getColorValue } from "../../utils/colors";
import { setConfig } from "../../utils/config";
import "./Appearance.css";

const Appearance = () => {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const toggleLayout = useStore((state) => state.toggleLayout);
  const layout = useStore((state) => state.layout);
  const fontSize = useStore((state) => state.fontSize);
  const setFontSize = useStore((state) => state.setFontSize);
  const showFeedIcon = useStore((state) => state.showFeedIcon);
  const toggleShowFeedIcon = useStore((state) => state.toggleShowFeedIcon);
  const themeColor = useStore((state) => state.themeColor);
  const setThemeColor = useStore((state) => state.setThemeColor);

  return (
    <>
      <Typography.Title heading={6} style={{ marginTop: 0 }}>
        Theme
      </Typography.Title>
      <Typography.Text type="secondary">
        Customize your UI theme
      </Typography.Text>
      <div>
        <Radio.Group
          className="theme-selector"
          defaultValue={theme}
          name="card-radio-group"
          onChange={(value) => {
            setTheme(value);
            setConfig("theme", value);
          }}
        >
          {["light", "dark", "system"].map((mode) => (
            <Tooltip
              key={mode}
              content={mode.charAt(0).toUpperCase() + mode.slice(1)}
            >
              <Radio value={mode}>
                {({ checked }) => {
                  const themePreviewSrc = {
                    light: lightThemePreview,
                    dark: darkThemePreview,
                    system: systemThemePreview,
                  }[mode];

                  return (
                    <div
                      className={`custom-radio-card ${
                        checked ? "custom-radio-card-checked" : ""
                      }`}
                    >
                      <img
                        className="theme-preview"
                        src={themePreviewSrc}
                        alt={mode}
                      />
                    </div>
                  );
                }}
              </Radio>
            </Tooltip>
          ))}
        </Radio.Group>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Accent color
          </Typography.Title>
          <Typography.Text type="secondary">
            Choose your accent color
          </Typography.Text>
        </div>
        <div style={{ display: "flex" }}>
          {colors.map((c) => (
            <Tooltip content={c.name} key={c.name}>
              <button
                type="button"
                className="accent-color-button"
                style={{
                  backgroundColor: getColorValue(c.name),
                  outline:
                    c.name === themeColor
                      ? `1px solid ${getColorValue(c.name)}`
                      : "none",
                }}
                onClick={() => {
                  setThemeColor(c.name);
                  setConfig("themeColor", c.name);
                  applyColor(c.name);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setThemeColor(c.name);
                  }
                }}
              />
            </Tooltip>
          ))}
        </div>
      </div>

      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Compact article list
          </Typography.Title>
          <Typography.Text type="secondary">
            Use small thumbnail in article list
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={layout === "small"}
            onChange={(value) => {
              toggleLayout();
              setConfig("layout", value ? "small" : "large");
            }}
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Show feed icon
          </Typography.Title>
          <Typography.Text type="secondary">
            Show feed icon in feed list and article list
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={showFeedIcon}
            onChange={(value) => {
              toggleShowFeedIcon();
              setConfig("showFeedIcon", value);
            }}
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Font size
          </Typography.Title>
          <Typography.Text type="secondary">
            Adjust article text size
          </Typography.Text>
        </div>
        <div>
          <Space>
            <Typography.Text style={{ fontSize: "0.75rem" }}>A</Typography.Text>
            <Slider
              className="font-size-slider"
              formatTooltip={(value) => `${value}rem`}
              max={1.25}
              min={0.75}
              showTicks
              step={0.05}
              value={fontSize}
              onChange={(value) => {
                setFontSize(value);
                setConfig("fontSize", value);
              }}
            />
            <Typography.Text style={{ fontSize: "1.25rem" }}>A</Typography.Text>
          </Space>
        </div>
      </div>
    </>
  );
};

export default Appearance;
