import {
  Divider,
  Radio,
  Slider,
  Space,
  Switch,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import { useState } from "react";

import useStore from "../../Store";
import darkThemePreview from "../../assets/dark.png";
import lightThemePreview from "../../assets/light.png";
import { applyColor, colors, getColorValue } from "../../utils/Colors";
import { getConfig, setConfig } from "../../utils/Config";
import "./Appearance.css";

const Appearance = () => {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const toggleLayout = useStore((state) => state.toggleLayout);
  const layout = useStore((state) => state.layout);
  const fontSize = useStore((state) => state.fontSize);
  const setFontSize = useStore((state) => state.setFontSize);
  const showFeedIcon = useStore((state) => state.showFeedIcon);
  const setShowFeedIcon = useStore((state) => state.setShowFeedIcon);
  const [themeColor, setThemeColor] = useState(
    getConfig("themeColor") || "Blue",
  );

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
          onChange={() => toggleTheme()}
        >
          {["light", "dark"].map((mode) => {
            return (
              <Radio key={mode} value={mode}>
                {({ checked }) => {
                  return (
                    <div
                      className={`custom-radio-card ${checked ? "custom-radio-card-checked" : ""}`}
                    >
                      <img
                        className="theme-preview"
                        src={
                          mode === "light"
                            ? lightThemePreview
                            : darkThemePreview
                        }
                        alt={mode}
                      />
                    </div>
                  );
                }}
              </Radio>
            );
          })}
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
                onClick={() => {
                  setThemeColor(c.name);
                  setConfig("themeColor", c.name);
                  applyColor(c.name);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setThemeColor(c.name);
                    setConfig("themeColor", c.name);
                    applyColor(c.name);
                  }
                }}
              />
            </Tooltip>
          ))}
        </div>
      </div>

      <Divider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
            onChange={() => toggleLayout()}
          />
        </div>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
            onChange={() => setShowFeedIcon(!showFeedIcon)}
          />
        </div>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
