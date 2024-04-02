import { Radio, Tooltip, Typography } from "@arco-design/web-react";
import { useConfigStore } from "../../../store/configStore";
import { setConfig } from "../../../utils/config";
import { IconAlignCenter, IconAlignLeft } from "@arco-design/web-react/icon";

export default function TextAlignment() {
  const align = useConfigStore((state) => state.align);
  const setAlign = useConfigStore((state) => state.setAlign);

  const toggleAlign = () => {
    const newAlign = align === "justify" ? "left" : "justify";
    setAlign(newAlign);
    setConfig("align", newAlign);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <Typography.Title heading={6} style={{ marginTop: 0 }}>
          Text alignment
        </Typography.Title>
        <Typography.Text type="secondary">
          Within article content
        </Typography.Text>
      </div>
      <div>
        <Radio.Group type="button" value={align} onChange={() => toggleAlign()}>
          <Tooltip content="Left" mini>
            <Radio value="left">
              <IconAlignLeft />
            </Radio>
          </Tooltip>
          <Tooltip content="Justify" mini>
            <Radio value="justify">
              <IconAlignCenter />
            </Radio>
          </Tooltip>
        </Radio.Group>
      </div>
    </div>
  );
}
