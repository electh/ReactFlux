import { Button, Drawer } from "@arco-design/web-react";
import { IconMenu } from "@arco-design/web-react/icon";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useScreenWidth } from "../../hooks/useScreenWidth.js";
import Sidebar from "../Sidebar/Sidebar.jsx";
import "./SidebarTrigger.css";

export default function SidebarTrigger() {
  const currentPath = useLocation().pathname;
  const { isBelowLarge } = useScreenWidth();

  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    if (!isBelowLarge) {
      setSidebarVisible(false);
    }
  }, [isBelowLarge]);

  useEffect(() => {
    if (currentPath) {
      setSidebarVisible(false);
    }
  }, [currentPath]);

  return (
    <div>
      <div className="brand">
        <Button
          className="trigger"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          shape="circle"
          size="small"
        >
          <IconMenu />
        </Button>
      </div>
      <Drawer
        className="sidebar-drawer"
        visible={sidebarVisible}
        title={null}
        footer={null}
        closable={false}
        onCancel={() => setSidebarVisible(false)}
        placement="left"
        width={240}
      >
        <Sidebar />
      </Drawer>
    </div>
  );
}
