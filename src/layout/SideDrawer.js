import { Avatar, Drawer, Typography } from "@arco-design/web-react";
import Sidebar from "./Sidebar";
import { IconBook } from "@arco-design/web-react/icon";
import "./SideDrawer.css";
import { useStore } from "../store/Store";
import { useEffect } from "react";

export default function SideDrawer({ visible, setVisible }) {
  const isMobile = useStore((state) => state.isMobile);
  useEffect(() => {
    !isMobile && setVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);
  return (
    <Drawer
      className="side-drawer"
      width={220}
      height={220}
      title={null}
      footer={null}
      visible={visible}
      placement="left"
      onCancel={() => {
        setVisible(false);
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", margin: "8px 12px" }}
      >
        <Avatar
          size={32}
          style={{
            marginRight: "10px",
            backgroundColor: "var(--color-text-1)",
          }}
        >
          <IconBook style={{ color: "var(--color-bg-1)" }} />
        </Avatar>
        <Typography.Title heading={6} style={{ margin: "0" }}>
          ReactFlux
        </Typography.Title>
      </div>
      <Sidebar />
    </Drawer>
  );
}
