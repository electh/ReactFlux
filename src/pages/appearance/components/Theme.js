import { Radio, Tooltip, Typography } from "@arco-design/web-react";
import "./Theme.css";
import darkThemePreview from "../../../assets/dark.png";
import lightThemePreview from "../../../assets/light.png";
import systemThemePreview from "../../../assets/system.png";
import { useConfigStore } from "../../../store/configStore";
import { setConfig } from "../../../utils/config";

export default function Theme() {
  const theme = useConfigStore((state) => state.theme);
  const setTheme = useConfigStore((state) => state.setTheme);
  return (
    <div>
      <Typography.Title heading={6} style={{ marginTop: "0.5em" }}>
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
          onChange={(value) => {
            setTheme(value);
            setConfig("theme", value);
          }}
        >
          {["light", "dark", "system"].map((mode) => {
            return (
              <Tooltip
                key={mode}
                mini
                content={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                <Radio value={mode}>
                  {({ checked }) => {
                    return (
                      <div
                        className={`custom-radio-card ${checked ? "custom-radio-card-checked" : ""}`}
                      >
                        <div className="custom-radio-card-mask">
                          <div className="custom-radio-card-mask-dot"></div>
                        </div>
                        <img
                          className="theme-preview"
                          src={
                            mode === "light"
                              ? lightThemePreview
                              : mode === "dark"
                                ? darkThemePreview
                                : systemThemePreview
                          }
                          alt={mode}
                        />
                      </div>
                    );
                  }}
                </Radio>
              </Tooltip>
            );
          })}
        </Radio.Group>
      </div>
    </div>
  );
}
