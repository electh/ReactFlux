import { Button, Dropdown, Menu, Message, Space } from "@arco-design/web-react";
import {
  IconMenuFold,
  IconMenuUnfold,
  IconMinusCircle,
  IconPoweroff,
  IconRecord,
  IconSettings,
  IconStar,
  IconStarFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { useStore } from "../store/Store";
import { useState } from "react";
import Settings from "../pages/settings/Settings";
import SideDrawer from "./SideDrawer";
import { useNavigate } from "react-router-dom";
import { applyColor } from "../utils/colors";

export default function Toolbar() {
  const navigate = useNavigate();
  const collapsed = useStore((state) => state.collapsed);
  const setCollapsed = useStore((state) => state.setCollapsed);
  const activeEntry = useStore((state) => state.activeEntry);
  const toggleStar = useStore((state) => state.toggleStar);
  const toggleUnreadStatus = useStore((state) => state.toggleUnreadStatus);
  const [drawVisible, setDrawVisible] = useState(false);
  const isMobile = useStore((state) => state.isMobile);
  const [visible, setVisible] = useState(false);
  const setEntries = useStore((state) => state.setEntries);

  const handelToggleStar = (entry) => {
    toggleStar(entry);
  };

  const handelToggleUnreadStatus = (entry) => {
    toggleUnreadStatus(entry);
  };

  const handleLogout = () => {
    localStorage.clear();
    setEntries([]);
    document.body.removeAttribute("arco-theme");

    applyColor("Blue");
    navigate("/login");
    Message.success("Logout");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Space>
        <Button
          shape="circle"
          className="trigger"
          onClick={isMobile ? () => setVisible(!visible) : setCollapsed}
        >
          {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
        </Button>
      </Space>
      <SideDrawer visible={visible} setVisible={setVisible} />
      <div
        style={{ display: "flex", alignItems: "center", marginRight: "10px" }}
      >
        <Button.Group
          style={{ display: isMobile ? "none" : "block", marginRight: "8px" }}
        >
          <Button
            shape="round"
            onClick={() => handelToggleStar(activeEntry)}
            icon={
              activeEntry?.starred ? (
                <IconStarFill style={{ color: "#ffcd00" }} />
              ) : (
                <IconStar />
              )
            }
            disabled={!activeEntry}
          />
          <Button
            shape="round"
            onClick={() => handelToggleUnreadStatus(activeEntry)}
            icon={
              activeEntry?.status === "read" ? (
                <IconMinusCircle />
              ) : (
                <IconRecord />
              )
            }
            disabled={!activeEntry}
          />
        </Button.Group>
        <Dropdown
          droplist={
            <Menu>
              <Menu.Item
                key="0"
                onClick={() => {
                  setDrawVisible(true);
                }}
              >
                <IconSettings
                  style={{
                    marginRight: 8,
                    fontSize: 16,
                    transform: "translateY(1px)",
                  }}
                />
                Settings
              </Menu.Item>
              <Menu.Item key="1" onClick={handleLogout}>
                <IconPoweroff
                  style={{
                    marginRight: 8,
                    fontSize: 16,
                    transform: "translateY(1px)",
                  }}
                />
                Logout
              </Menu.Item>
            </Menu>
          }
          trigger="click"
          position="br"
        >
          <Button shape="circle" icon={<IconUser />}></Button>
        </Dropdown>
        <Settings visible={drawVisible} setVisible={setDrawVisible} />
      </div>
    </div>
  );
}
