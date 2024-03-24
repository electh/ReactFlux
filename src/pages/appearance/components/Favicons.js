import { Switch, Typography } from "@arco-design/web-react";
import { useConfigStore } from "../../../store/configStore";
import { setConfig } from "../../../utils/config";

export default function Favicons() {
  const showIcons = useConfigStore((state) => state.showIcons);
  const setShowIcons = useConfigStore((state) => state.setShowIcons);

  const toggleIcons = () => {
    const newShowIcons = showIcons === "off" ? "on" : "off";
    setShowIcons(newShowIcons);
    setConfig("showIcons", newShowIcons);
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
          Favicons
        </Typography.Title>
        <Typography.Text type="secondary">
          Display favicons in sidebar
        </Typography.Text>
      </div>
      <div>
        <Switch checked={showIcons === "on"} onChange={() => toggleIcons()} />
      </div>
    </div>
  );
}
