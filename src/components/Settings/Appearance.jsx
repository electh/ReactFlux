import {
  Divider,
  Radio,
  Slider,
  Space,
  Switch,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import React, { useEffect } from "react";

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

  useEffect(() => {
    setConfig("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    setConfig("layout", layout);
  }, [layout]);

  useEffect(() => {
    setConfig("showFeedIcon", showFeedIcon);
  }, [showFeedIcon]);

  useEffect(() => {
    setConfig("theme", theme);
  }, [theme]);

  useEffect(() => {
    setConfig("themeColor", themeColor);
    applyColor(themeColor);
  }, [themeColor]);

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
          name="card-radio-group"
          style={{ marginTop: "16px" }}
          defaultValue={theme}
          onChange={setTheme}
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
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  margin: "2px",
                  backgroundColor: getColorValue(c.name),
                  cursor: "pointer",
                  border: "3px solid var(--color-bg-3)",
                  outline:
                    c.name === themeColor
                      ? `1px solid ${getColorValue(c.name)}`
                      : "none",
                }}
                onClick={() => setThemeColor(c.name)}
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
          <Switch checked={layout === "small"} onChange={toggleLayout} />
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
          <Switch checked={showFeedIcon} onChange={toggleShowFeedIcon} />
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
              value={fontSize}
              showTicks
              min={0.75}
              max={1.25}
              step={0.05}
              formatTooltip={(value) => `${value}rem`}
              onChange={setFontSize}
              style={{ width: 200 }}
            />
            <Typography.Text style={{ fontSize: "1.25rem" }}>A</Typography.Text>
          </Space>
        </div>
      </div>
    </>
  );
};

export default Appearance;
