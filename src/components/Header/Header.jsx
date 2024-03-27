import {
  Avatar,
  Button,
  Dropdown,
  Menu,
  Message,
  Space,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconCheck,
  IconDesktop,
  IconGithub,
  IconMenu,
  IconMoonFill,
  IconPlus,
  IconPoweroff,
  IconSettings,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon";
import React from "react";
import { useNavigate } from "react-router-dom";

import useStore from "../../Store";
import { applyColor } from "../../utils/Colors";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const setVisible = useStore((state) => state.setVisible);
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const collapsed = useStore((state) => state.collapsed);
  const setCollapsed = useStore((state) => state.setCollapsed);

  const handleLogout = () => {
    localStorage.clear();
    document.body.removeAttribute("arco-theme");
    applyColor("Blue");
    navigate("/login");
    Message.success("logout");
  };

  return (
    <div className="header">
      <div
        className="brand"
        style={{ marginLeft: "10px", display: "flex", alignItems: "center" }}
      >
        <Button
          shape="circle"
          size="small"
          className="trigger"
          style={{ marginRight: "5px", display: "none" }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {<IconMenu />}
        </Button>
      </div>
      <div className="button-group" style={{ marginRight: "10px" }}>
        <Space size={16}>
          <Tooltip content="Add feed" mini>
            <Button
              shape="circle"
              size="small"
              type="primary"
              icon={<IconPlus />}
              onClick={() => setVisible("addFeed", true)}
            />
          </Tooltip>
          <Button
            shape="circle"
            size="small"
            icon={<IconGithub />}
            onClick={() =>
              window.open("https://github.com/electh/ReactFlux", "_blank")
            }
          />
          <Dropdown
            droplist={
              <Menu defaultSelectedKeys={[theme]} className="theme-menu">
                {["light", "dark", "system"].map((item) => (
                  <Menu.Item
                    className={theme === item ? "selected-menu" : ""}
                    key={item}
                    onClick={() => toggleTheme(item)}
                    style={{
                      display: "flex",
                      width: 100,
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                    {theme === item && <IconCheck style={{ marginLeft: 8 }} />}
                  </Menu.Item>
                ))}
              </Menu>
            }
            trigger="hover"
            position="bottom"
          >
            <Button
              shape="circle"
              size="small"
              icon={
                theme === "dark" ? (
                  <IconMoonFill />
                ) : theme === "light" ? (
                  <IconSunFill />
                ) : (
                  <IconDesktop />
                )
              }
            />
          </Dropdown>
          <Dropdown
            droplist={
              <Menu>
                <Menu.Item key="0" onClick={() => setVisible("settings", true)}>
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
            <Avatar size={28} style={{ cursor: "pointer" }}>
              <IconUser />
            </Avatar>
          </Dropdown>
        </Space>
      </div>
    </div>
  );
};

export default Header;
