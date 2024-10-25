import {
  Button,
  Divider,
  Dropdown,
  Menu,
  Message,
  Modal,
} from "@arco-design/web-react";
import {
  IconCheck,
  IconDesktop,
  IconEye,
  IconEyeInvisible,
  IconLink,
  IconMoonFill,
  IconPoweroff,
  IconRefresh,
  IconSettings,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { useStore } from "@nanostores/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { polyglotState } from "../../hooks/useLanguage.js";
import { useModalToggle } from "../../hooks/useModalToggle.js";
import { authState, resetAuth } from "../../store/authState.js";
import { resetContent } from "../../store/contentState.js";
import { resetData } from "../../store/dataState.js";
import {
  resetSettings,
  settingsState,
  updateSettings,
} from "../../store/settingsState.js";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const { server } = useStore(authState);
  const { polyglot } = useStore(polyglotState);

  const handleToggleFeedsVisibility = () => {
    updateSettings({ showAllFeeds: !showAllFeeds });
    Message.success(
      showAllFeeds
        ? polyglot.t("header.hide_some_feeds")
        : polyglot.t("header.show_all_feeds"),
    );
  };

  const { themeMode, showAllFeeds } = useStore(settingsState);

  const themeOptions = [
    { label: polyglot.t("header.theme_option_light"), value: "light" },
    { label: polyglot.t("header.theme_option_dark"), value: "dark" },
    { label: polyglot.t("header.theme_option_system"), value: "system" },
  ];

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { setSettingsModalVisible } = useModalToggle();

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
      return <IconMoonFill className="icon-right" />;
    }
    if (themeMode === "system") {
      return <IconDesktop className="icon-right" />;
    }
    return <IconSunFill className="icon-right" />;
  };

  return (
    <div className="user-profile-container">
      <div>
        <Dropdown
          position="br"
          trigger="click"
          droplist={
            <Menu>
              <Menu.SubMenu
                key="theme"
                title={
                  <span>
                    {getThemeIcon()}
                    {polyglot.t("header.theme")}
                  </span>
                }
              >
                {themeOptions.map(({ label, value }) => (
                  <Menu.Item
                    key={value}
                    onClick={() => updateSettings({ themeMode: value })}
                    className="theme-menu-item"
                  >
                    {label}
                    {themeMode === value && (
                      <IconCheck style={{ marginLeft: 8 }} />
                    )}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
              <Menu.Item key="4" onClick={handleToggleFeedsVisibility}>
                {showAllFeeds ? (
                  <IconEyeInvisible className="icon-right" />
                ) : (
                  <IconEye className="icon-right" />
                )}
                {showAllFeeds
                  ? polyglot.t("header.hide_some_feeds")
                  : polyglot.t("header.show_all_feeds")}
              </Menu.Item>
              <Menu.Item key="0" onClick={() => setSettingsModalVisible(true)}>
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
          <Button
            icon={<IconUser />}
            shape="circle"
            size="small"
            style={{ marginRight: 8 }}
          />
        </Dropdown>
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
}
