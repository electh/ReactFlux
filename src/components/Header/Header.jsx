import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Menu,
  Message,
  Space,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconCheck,
  IconDesktop,
  IconEye,
  IconEyeInvisible,
  IconGithub,
  IconMenu,
  IconMoonFill,
  IconPlus,
  IconPoweroff,
  IconSettings,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";

import { useAtom, useSetAtom } from "jotai";
import { applyColor } from "../../utils/colors";

import { useEffect, useState } from "react";
import { authAtom } from "../../atoms/authAtom";
import { configAtom } from "../../atoms/configAtom";
import { useConfig } from "../../hooks/useConfig";
import { useModalToggle } from "../../hooks/useModalToggle";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { defaultConfig } from "../../utils/config";
import Sidebar from "../Sidebar/Sidebar";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const { setAddFeedModalVisible, setSettingsModalVisible } = useModalToggle();

  const [config, setConfig] = useAtom(configAtom);
  const setAuth = useSetAtom(authAtom);
  const { showAllFeeds, theme } = config;
  const { updateConfig } = useConfig();
  const { belowLg } = useScreenWidth();
  const [sideVisible, setSideVisible] = useState(false);

  useEffect(() => {
    if (!belowLg) {
      setSideVisible(false);
    }
  }, [belowLg]);

  const toggleShowAllFeeds = () => {
    updateConfig({ showAllFeeds: !showAllFeeds });
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    updateConfig({ theme: newTheme });
  };

  const handleLogout = () => {
    setAuth({});
    setConfig(defaultConfig);
    document.body.removeAttribute("arco-theme");
    applyColor("Blue");
    navigate("/login");
    Message.success("Logout successful");
  };

  const getThemeIcon = (theme) => {
    switch (theme) {
      case "dark":
        return <IconMoonFill />;
      case "system":
        return <IconDesktop />;
      default:
        return <IconSunFill />;
    }
  };

  return (
    <div className="header">
      <div className="brand">
        <Button
          className="trigger"
          onClick={() => setSideVisible(!sideVisible)}
          shape="circle"
          size="small"
        >
          <IconMenu />
        </Button>
      </div>
      <Drawer
        className="sidebar-drawer"
        visible={sideVisible}
        title={null}
        footer={null}
        closable={false}
        onCancel={() => setSideVisible(false)}
        placement="left"
        width={240}
      >
        <Sidebar />
      </Drawer>
      <div className="button-group">
        <Space size={16}>
          <Tooltip content="Add a feed" mini>
            <Button
              shape="circle"
              size="small"
              type="primary"
              icon={<IconPlus />}
              onClick={() => setAddFeedModalVisible(true)}
            />
          </Tooltip>
          <Tooltip
            content={showAllFeeds ? "Hide some feeds" : "Show all feeds"}
            mini
          >
            <Button
              shape="circle"
              size="small"
              icon={showAllFeeds ? <IconEye /> : <IconEyeInvisible />}
              onClick={toggleShowAllFeeds}
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
                {["light", "dark", "system"].map((themeOption) => (
                  <Menu.Item
                    className="theme-menu-item"
                    key={themeOption}
                    onClick={() => updateConfig({ theme: themeOption })}
                  >
                    {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    {theme === themeOption && (
                      <IconCheck style={{ marginLeft: 8 }} />
                    )}
                  </Menu.Item>
                ))}
              </Menu>
            }
            trigger="hover"
            position="bottom"
          >
            <Button
              icon={getThemeIcon(theme)}
              shape="circle"
              size="small"
              onClick={toggleTheme}
            />
          </Dropdown>
          <Dropdown
            droplist={
              <Menu>
                <Menu.Item
                  key="0"
                  onClick={() => setSettingsModalVisible(true)}
                >
                  <IconSettings className="icon-right" />
                  Settings
                </Menu.Item>
                <Menu.Item key="1" onClick={handleLogout}>
                  <IconPoweroff className="icon-right" />
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
