import {
  Divider,
  Radio,
  Switch,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import { IconMoonFill, IconSunFill } from "@arco-design/web-react/icon";
import { useState } from "react";

import { useStore } from "../Store";
import { applyColor, colors, getColorValue } from "../utils/Colors";

export default function Appearance() {
  const theme = localStorage.getItem("theme") || "light";
  const { toggleTheme, toggleLayout, layout } = useStore();
  const [themeColor, setThemeColor] = useState(
    localStorage.getItem("themeColor") || "Blue",
  );

  return (
    <>
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
      <Typography.Title heading={6}>Theme</Typography.Title>
      <Typography.Text type="secondary">
        Customize your UI theme
      </Typography.Text>
      <div>
        <Radio.Group
          size="large"
          type="button"
          style={{ marginTop: "16px" }}
          defaultValue={theme}
          onChange={() => toggleTheme()}
        >
          <Radio value="light">
            <IconSunFill style={{ marginRight: "6px" }} />
            Light
          </Radio>
          <Radio value="dark">
            <IconMoonFill style={{ marginRight: "6px" }} />
            Dark
          </Radio>
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
            Thumbnails
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
