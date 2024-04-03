import { Modal, Tabs, Typography } from "@arco-design/web-react";
import { useModalStore } from "../../store/modalStore";
import { IconSettings, IconUser } from "@arco-design/web-react/icon";

export default function Settings() {
  const settingsVisible = useModalStore((state) => state.settingsVisible);
  const setSettingsVisible = useModalStore((state) => state.setSettingsVisible);

  const style = {
    textAlign: "center",
    marginTop: 20,
  };

  function CustomTabTitle(icon, title) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {icon}
        <div style={{ fontSize: "12px" }}>{title}</div>
      </div>
    );
  }

  return (
    <Modal
      visible={settingsVisible}
      onCancel={() => setSettingsVisible(false)}
      title={null}
      footer={null}
      style={{
        width: "calc(100% - 20px)",
        maxWidth: "520px",
        margin: "0 10px",
      }}
    >
      <Tabs defaultActiveTab="1" animation>
        <Tabs.TabPane
          key="1"
          title={CustomTabTitle(
            <IconSettings style={{ fontSize: "20px" }} />,
            "General",
          )}
        >
          <Typography.Paragraph style={style}>
            Nothing here yet
          </Typography.Paragraph>
        </Tabs.TabPane>
        <Tabs.TabPane
          key="2"
          title={CustomTabTitle(
            <IconUser style={{ fontSize: "20px" }} />,
            "Account",
          )}
        >
          <Typography.Paragraph style={style}>
            Nothing here yet
          </Typography.Paragraph>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
}
