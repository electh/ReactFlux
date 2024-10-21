import {
  Button,
  Divider,
  Drawer,
  Dropdown,
  Menu,
  Message,
  Modal,
  Space,
} from "@arco-design/web-react";
import {
  IconCheck,
  IconDesktop,
  IconEye,
  IconEyeInvisible,
  IconGithub,
  IconLink,
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

import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { polyglotState } from "../../hooks/useLanguage";
import { useModalToggle } from "../../hooks/useModalToggle";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { resetAuth } from "../../store/authState";
import { authState } from "../../store/authState";
import { resetContent } from "../../store/contentState";
import { resetData } from "../../store/dataState";
import {
  resetSettings,
  settingsState,
  updateSettings,
} from "../../store/settingsState";
import Sidebar from "../Sidebar/Sidebar";
import CustomTooltip from "../ui/CustomTooltip";
import "./Header.css";

const Header = () => {
  const { server } = useStore(authState);
  const { showAllFeeds, themeMode } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const themeOptions = [
    { label: polyglot.t("header.theme_option_light"), value: "light" },
    { label: polyglot.t("header.theme_option_dark"), value: "dark" },
    { label: polyglot.t("header.theme_option_system"), value: "system" },
  ];

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
    updateSettings({ showAllFeeds: !showAllFeeds });
  };

  const handleToggleTheme = () => {
    const newThemeMode = themeMode === "light" ? "dark" : "light";
    updateSettings({ themeMode: newThemeMode });
  };

  const handleResetSettings = () => {
    resetSettings();
    setResetModalVisible(false);
  };

  const handleLogout = () => {
    resetAuth();
    resetContent();
    resetData();
    navigate("/login");
    Message.success(polyglot.t("header.logout_success"));
  };

  const getThemeIcon = () => {
    if (themeMode === "dark") {
      return <IconMoonFill />;
    }
    if (themeMode === "system") {
      return <IconDesktop />;
    }
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
          <CustomTooltip content={polyglot.t("header.add_feed")} mini>
            <Button
              shape="circle"
              size="small"
              type="primary"
              icon={<IconPlus />}
              onClick={() => setAddFeedModalVisible(true)}
            />
          </CustomTooltip>
          <CustomTooltip
            mini
            content={
              showAllFeeds
                ? polyglot.t("header.hide_some_feeds")
                : polyglot.t("header.show_all_feeds")
            }
          >
            <Button
              shape="circle"
              size="small"
              icon={showAllFeeds ? <IconEye /> : <IconEyeInvisible />}
              onClick={handleToggleFeedsVisibility}
            />
          </CustomTooltip>
          <Button
            shape="circle"
            size="small"
            icon={<IconGithub />}
            onClick={() =>
              window.open("https://github.com/electh/ReactFlux", "_blank")
            }
          />
          <Dropdown
            position="bottom"
            droplist={
              <Menu defaultSelectedKeys={[themeMode]} className="theme-menu">
                {themeOptions.map(({ label, value }) => (
                  <Menu.Item
                    className="theme-menu-item"
                    key={value}
                    onClick={() => updateSettings({ themeMode: value })}
                  >
                    {label}
                    {themeMode === value && <IconCheck />}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <Button
              icon={getThemeIcon()}
              shape="circle"
              size="small"
              onClick={handleToggleTheme}
            />
          </Dropdown>
          <Dropdown
            position="br"
            trigger="click"
            droplist={
              <Menu>
                <Menu.Item
                  key="0"
                  onClick={() => setSettingsModalVisible(true)}
                >
                  <IconSettings className="icon-right" />
                  {polyglot.t("header.settings")}
                </Menu.Item>
                <Menu.Item
                  key="1"
                  onClick={() => window.open(`${server}/settings`, "_blank")}
                >
                  <IconLink className="icon-right" />
                  {polyglot.t("header.miniflux_settings")}
                </Menu.Item>
                <Menu.Item key="2" onClick={() => setResetModalVisible(true)}>
                  <IconRefresh className="icon-right" />
                  {polyglot.t("header.reset_settings")}
                </Menu.Item>
                <Divider style={{ margin: "4px 0" }} />
                <Menu.Item key="3" onClick={() => setLogoutModalVisible(true)}>
                  <IconPoweroff className="icon-right" />
                  {polyglot.t("header.logout")}
                </Menu.Item>
              </Menu>
            }
          >
            <Button icon={<IconUser />} shape="circle" size="small" />
          </Dropdown>
        </Space>
      </div>

      <Modal
        onCancel={() => setResetModalVisible(false)}
        onOk={handleResetSettings}
        title={polyglot.t("header.settings_reset_confirm")}
        visible={resetModalVisible}
      >
        <p>{polyglot.t("header.settings_reset_description")}</p>
      </Modal>

      <Modal
        onCancel={() => setLogoutModalVisible(false)}
        onOk={handleLogout}
        title={polyglot.t("header.logout_confirm")}
        visible={logoutModalVisible}
      >
        <p>{polyglot.t("header.logout_description")}</p>
      </Modal>
    </div>
  );
};

export default Header;
