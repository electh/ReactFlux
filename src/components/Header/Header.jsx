import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Menu,
  Message,
  Modal,
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
  IconRefresh,
  IconSettings,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { useLocation, useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import { useModalToggle } from "../../hooks/useModalToggle";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { resetAuth } from "../../store/authState";
import {
  configState,
  resetConfig,
  updateConfig,
} from "../../store/configState";
import { setIsAppDataReady } from "../../store/dataState";
import Sidebar from "../Sidebar/Sidebar";
import "./Header.css";

const Header = () => {
  const { showAllFeeds, theme } = useSnapshot(configState);

  const navigate = useNavigate();
  const currentPath = useLocation().pathname;
  const { setAddFeedModalVisible, setSettingsModalVisible } = useModalToggle();
  const { isBelowLarge } = useScreenWidth();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

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

  const handleToggleFeedsVisibility = () => {
    updateConfig({ showAllFeeds: !showAllFeeds });
  };

  const handleToggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    updateConfig({ theme: newTheme });
  };

  const handleResetSettings = () => {
    resetConfig();
    setResetModalVisible(false);
  };

  const handleLogout = () => {
    resetAuth();
    setIsAppDataReady(false);
    navigate("/login");
    Message.success("Successfully logged out");
  };

  const getThemeIcon = () => {
    if (theme === "dark") return <IconMoonFill />;
    if (theme === "system") return <IconDesktop />;
    return <IconSunFill />;
  };

  return (
    <div className="header">
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
              onClick={handleToggleFeedsVisibility}
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
              icon={getThemeIcon()}
              shape="circle"
              size="small"
              onClick={handleToggleTheme}
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
                <Menu.Item key="1" onClick={() => setResetModalVisible(true)}>
                  <IconRefresh className="icon-right" />
                  Reset Settings
                </Menu.Item>
                <Menu.Item key="2" onClick={() => setLogoutModalVisible(true)}>
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

      <Modal
        title="Confirm Reset"
        visible={resetModalVisible}
        onOk={handleResetSettings}
        onCancel={() => setResetModalVisible(false)}
      >
        <p>
          Are you sure you want to reset your settings? This action cannot be
          undone.
        </p>
      </Modal>

      <Modal
        title="Confirm Logout"
        visible={logoutModalVisible}
        onOk={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      >
        <p>Are you sure you want to logout?</p>
      </Modal>
    </div>
  );
};

export default Header;
