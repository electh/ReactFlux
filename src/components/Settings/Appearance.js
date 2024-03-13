import {
  Divider,
  Radio,
  Switch,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import { useState } from "react";

import { useStore } from "../../Store";
import dark from "../../imgs/dark.png";
import light from "../../imgs/light.png";
import { applyColor, colors, getColorValue } from "../../utils/Colors";
import "./Appearance.css";

export default function Appearance() {
  const theme = localStorage.getItem("theme") || "light";
  const { toggleTheme, toggleLayout, layout } = useStore();
  const [themeColor, setThemeColor] = useState(
    localStorage.getItem("themeColor") || "Blue",
  );

  return (
    <>
      <Typography.Title heading={6} style={{ marginTop: 0 }}>
        Theme
      </Typography.Title>
      <Typography.Text type="secondary">
        Customize your UI theme
      </Typography.Text>
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
                        borderRadius: "6px 6px 0 0",
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
                  localStorage.setItem("themeColor", c.name);
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
    </>
  );
}
