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

import { useStore } from "../../Store";
import dark from "../../imgs/dark.png";
import light from "../../imgs/light.png";
import { applyColor, colors, getColorValue } from "../../utils/Colors";
import { getConfig, setConfig } from "../../utils/Config";
import "./Appearance.css";

export default function Appearance() {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const toggleLayout = useStore((state) => state.toggleLayout);
  const layout = useStore((state) => state.layout);
  const fontSize = useStore((state) => state.fontSize);
  const setFontSize = useStore((state) => state.setFontSize);
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
          {["light", "dark"].map((item) => {
            return (
              <Radio key={item} value={item}>
                {({ checked }) => {
                  return (
                    <div
                      className={`custom-radio-card ${checked ? "custom-radio-card-checked" : ""}`}
                    >
                      <img
                        src={item === "light" ? light : dark}
                        alt={item}
                        style={{
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "4px 4px 0 0",
                          borderLeft: "1px solid var(--color-border-2)",
                          borderTop: "1px solid var(--color-border-2)",
                          borderRight: "1px solid var(--color-border-2)",
                        }}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
              <div
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
              ></div>
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
}
