import "@arco-design/web-react/dist/css/arco.css";
import { useStore } from "../Store";
import { Radio, Divider, Tooltip } from "@arco-design/web-react";
import { useState } from "react";
import { IconMoonFill, IconSunFill } from "@arco-design/web-react/icon";
import { applyColor, colors, getColorValue } from "../utils/Colors";

export default function Appearance() {
  const theme = localStorage.getItem("theme") || "light";
  const { toggleTheme } = useStore();
  const [themeColor, setThemeColor] = useState(
    localStorage.getItem("themeColor") || "Blue",
  );

  return (
    <>
      <div style={{ fontWeight: 500, fontSize: "14px", marginBottom: "16px" }}>
        Color
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
      <Divider />
      <div style={{ fontWeight: 500, fontSize: "14px", marginBottom: "16px" }}>
        Theme
      </div>
      <Radio.Group
        size="large"
        type="button"
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
    </>
  );
}
