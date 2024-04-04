import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Menu,
  Message,
  Space,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import {
  IconBgColors,
  IconMenuFold,
  IconMenuUnfold,
  IconMinusCircle,
  IconPlus,
  IconPoweroff,
  IconRecord,
  IconSettings,
  IconStar,
  IconStarFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { useStore } from "../store/Store";
import { useState } from "react";
import Appearance from "./appearance/Appearance";
import SideDrawer from "./SideDrawer";
import { useNavigate } from "react-router-dom";
import { applyColor } from "../utils/colors";
import { useModalStore } from "../store/modalStore";
import { getAuth } from "../utils/auth";

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
  const loading = useStore((state) => state.loading);
  const setNewFeedVisible = useModalStore((state) => state.setNewFeedVisible);
  const setSettingsVisible = useModalStore((state) => state.setSettingsVisible);
  const listRef = useStore((state) => state.listRef);
  const detailRef = useStore((state) => state.detailRef);

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

  const scrollToTop = () => {
    if (activeEntry) {
      detailRef.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      listRef.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      onClick={() => scrollToTop()}
    >
      <Space>
        <Button
          shape="circle"
          className="trigger"
          onClick={
            isMobile
              ? (event) => {
                  event.stopPropagation(); // 阻止事件传递
                  setVisible(!visible);
                }
              : (event) => {
                  event.stopPropagation(); // 阻止事件传递
                  setCollapsed();
                }
          }
        >
          {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
        </Button>
      </Space>
      <div onClick={(event) => event.stopPropagation()}>
        <SideDrawer visible={visible} setVisible={setVisible} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginRight: "10px",
        }}
      >
        <Button.Group
          style={{ display: isMobile ? "none" : "block", marginRight: 8 }}
        >
          <Button
            shape="round"
            onClick={(event) => {
              event.stopPropagation();
              handelToggleStar(activeEntry);
            }}
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
            onClick={(event) => {
              event.stopPropagation();
              handelToggleUnreadStatus(activeEntry);
            }}
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
        <Tooltip content="Add feed" mini position="bottom">
          <Button
            shape="round"
            disabled={loading}
            icon={<IconPlus />}
            onClick={(event) => {
              event.stopPropagation();
              setNewFeedVisible(true);
            }}
            style={{ marginRight: 8 }}
          />
        </Tooltip>
        <div onClick={(event) => event.stopPropagation()}>
          <Dropdown
            droplist={
              <Menu style={{ width: "160px" }}>
                <div
                  style={{
                    display: "flex",
                    padding: "6px 12px",
                    alignItems: "center",
                  }}
                >
                  <Avatar size={32} style={{ marginRight: "8px" }}>
                    <IconUser />
                  </Avatar>
                  <Typography.Text type="secondary">
                    {getAuth().secret.username}
                  </Typography.Text>
                </div>
                <Divider style={{ margin: "4px 0" }} />
                <Menu.Item
                  key="0"
                  onClick={() => {
                    setDrawVisible(true);
                  }}
                >
                  <IconBgColors
                    style={{
                      marginRight: 8,
                      fontSize: 16,
                      transform: "translateY(1px)",
                    }}
                  />
                  Appearance
                </Menu.Item>
                <Menu.Item
                  key="1"
                  onClick={() => {
                    setSettingsVisible(true);
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
                <Menu.Item key="2" onClick={handleLogout}>
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
            <Avatar size={32} style={{ cursor: "pointer" }}>
              <IconUser />
            </Avatar>
          </Dropdown>
        </div>
        <div onClick={(event) => event.stopPropagation()}>
          <Appearance visible={drawVisible} setVisible={setDrawVisible} />
        </div>
      </div>
    </div>
  );
}
