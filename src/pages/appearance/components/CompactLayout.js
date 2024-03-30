import { Switch, Typography } from "@arco-design/web-react";
import { useConfigStore } from "../../../store/configStore";
import { setConfig } from "../../../utils/config";

export default function CompactLayout() {
  const layout = useConfigStore((state) => state.layout);
  const setLayout = useConfigStore((state) => state.setLayout);

  const toggleLayout = () => {
    const newLayout = layout === "compact" ? "expensive" : "compact";
    setLayout(newLayout);
    setConfig("layout", newLayout);
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
          Compact article list
        </Typography.Title>
        <Typography.Text type="secondary">
          Small thumbnail in article list
        </Typography.Text>
      </div>
      <div>
        <Switch
          checked={layout === "compact"}
          onChange={() => toggleLayout()}
        />
      </div>
    </div>
  );
}
