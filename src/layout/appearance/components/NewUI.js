import { Switch, Typography } from "@arco-design/web-react";
import { useConfigStore } from "../../../store/configStore";
import { setConfig } from "../../../utils/config";

export default function NewUI() {
  const newUI = useConfigStore((state) => state.newUI);
  const setNewUI = useConfigStore((state) => state.setNewUI);

  const toggleUI = () => {
    const isNewUI = newUI === "off" ? "on" : "off";
    setNewUI(isNewUI);
    setConfig("newUI", isNewUI);
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
          New UI
        </Typography.Title>
        <Typography.Text type="secondary">Enable new UI</Typography.Text>
      </div>
      <div>
        <Switch checked={newUI === "on"} onChange={() => toggleUI()} />
      </div>
    </div>
  );
}
