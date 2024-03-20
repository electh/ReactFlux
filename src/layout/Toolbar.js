import {
  Avatar,
  Button,
  Dropdown,
  Menu,
  Message,
  Space,
} from "@arco-design/web-react";
import {
  IconLeft,
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
  const setActiveEntry = useStore((state) => state.setActiveEntry);
  const handelToggleStar = (entry) => {
    toggleStar(entry);
  };

  const handelToggleUnreadStatus = (entry) => {
    toggleUnreadStatus(entry);
  };

  const handleLogout = () => {
    localStorage.clear();
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
        <Button
          className="back-button"
          shape="round"
          icon={<IconLeft />}
          onClick={() => setActiveEntry(null)}
          style={{
            visibility: isMobile && activeEntry ? "visible" : "hidden",
            opacity: isMobile && activeEntry ? "1" : "0",
            transition: "all 0.2s ease",
          }}
        />
      </Space>
      <SideDrawer visible={visible} setVisible={setVisible} />
      <div style={{ marginRight: 10 }}>
        <Space>
          <Button.Group>
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
            <Avatar
              size={30}
              style={{ cursor: "pointer", position: "relative", top: "-2px" }}
            >
              <IconUser />
            </Avatar>
          </Dropdown>
          <Settings visible={drawVisible} setVisible={setDrawVisible} />
        </Space>
      </div>
    </div>
  );
}
