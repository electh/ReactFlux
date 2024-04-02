import { Slider, Typography } from "@arco-design/web-react";
import { useConfigStore } from "../../../store/configStore";
import { setConfig } from "../../../utils/config";

export default function FontSize() {
  const titleSize = useConfigStore((state) => state.titleSize);
  const setTitleSize = useConfigStore((state) => state.setTitleSize);
  const contentSize = useConfigStore((state) => state.contentSize);
  const setContentSize = useConfigStore((state) => state.setContentSize);

  return (
    <div>
      <Typography.Title heading={6} style={{ margin: 0 }}>
        Font size
      </Typography.Title>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography.Text style={{ fontSize: "0.75rem" }}>T</Typography.Text>
        <Slider
          className="font-size-slider"
          value={7 - titleSize}
          showTicks
          min={1}
          max={6}
          step={1}
          formatTooltip={(value) => `H${7 - value}`}
          onChange={(value) => {
            setTitleSize(7 - value);
            setConfig("titleSize", 7 - value);
          }}
          style={{ width: 260 }}
        />
        <Typography.Text style={{ fontSize: "1.25rem" }}>T</Typography.Text>
      </div>
      <div>
        <Typography.Text type="secondary">
          Adjust article title text size
        </Typography.Text>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography.Text style={{ fontSize: "0.75rem" }}>A</Typography.Text>
        <Slider
          className="font-size-slider"
          value={contentSize}
          showTicks
          min={0.75}
          max={1.25}
          step={0.05}
          formatTooltip={(value) => `${value}rem`}
          onChange={(value) => {
            setContentSize(value);
            setConfig("contentSize", value);
          }}
          style={{ width: 260 }}
        />
        <Typography.Text style={{ fontSize: "1.25rem" }}>A</Typography.Text>
      </div>
      <div>
        <Typography.Text type="secondary">
          Adjust article content text size
        </Typography.Text>
      </div>
    </div>
  );
}
