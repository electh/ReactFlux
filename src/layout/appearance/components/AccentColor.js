import { Space, Tooltip, Typography } from "@arco-design/web-react";
import { colors, getColorValue } from "../../../utils/colors";
import { setConfig } from "../../../utils/config";
import { useConfigStore } from "../../../store/configStore";

export default function AccentColor() {
  const color = useConfigStore((state) => state.color);
  const setColor = useConfigStore((state) => state.setColor);
  return (
    <Space direction="vertical">
      <Typography.Title heading={6} style={{ margin: 0 }}>
        Accent color
      </Typography.Title>
      <div style={{ display: "flex" }}>
        {colors.map((c) => (
          <Tooltip content={c.name} key={c.name} mini>
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
                  c.name === color
                    ? `1px solid ${getColorValue(c.name)}`
                    : "none",
              }}
              onClick={() => {
                setColor(c.name);
                setConfig("color", c.name);
                // applyColor(c.name);
              }}
            ></div>
          </Tooltip>
        ))}
      </div>
      <Typography.Text type="secondary">
        Choose your accent color
      </Typography.Text>
    </Space>
  );
}
