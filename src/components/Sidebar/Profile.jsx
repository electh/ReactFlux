import {
  Button,
  Divider,
  Dropdown,
  Menu,
  Message,
  Modal,
  Radio,
} from "@arco-design/web-react";
import {
  IconDesktop,
  IconExclamationCircle,
  IconInfoCircleFill,
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

  const { themeMode } = useStore(settingsState);

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
    Message.success(polyglot.t("sidebar.logout_success"));
  };

  return (
    <div className="user-profile-container">
      <div>
        <Dropdown
          position="br"
          trigger="click"
          droplist={
            <Menu>
              <Radio.Group
                type="button"
                name="theme"
                size="small"
                value={themeMode}
                onChange={(value) => updateSettings({ themeMode: value })}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "8px",
                }}
              >
                <Radio value="system">
                  <IconDesktop />
                </Radio>
                <Radio value="light">
                  <IconSunFill />
                </Radio>
                <Radio value="dark">
                  <IconMoonFill />
                </Radio>
              </Radio.Group>
              <Divider style={{ margin: "4px 0" }} />
              <Menu.Item key="0" onClick={() => setSettingsModalVisible(true)}>
                <IconSettings className="icon-right" />
                {polyglot.t("sidebar.settings")}
              </Menu.Item>
              <Menu.Item
                key="1"
                onClick={() => window.open(`${server}/settings`, "_blank")}
              >
                <IconLink className="icon-right" />
                {polyglot.t("sidebar.miniflux_settings")}
              </Menu.Item>
              <Menu.Item
                key="2"
                onClick={() =>
                  window.open(
                    "https://github.com/electh/ReactFlux/issues/new",
                    "_blank",
                  )
                }
              >
                <IconExclamationCircle className="icon-right" />
                {polyglot.t("sidebar.report_issue")}
              </Menu.Item>
              <Divider style={{ margin: "4px 0" }} />
              <Menu.Item key="3" onClick={() => setResetModalVisible(true)}>
                <IconRefresh className="icon-right" />
                {polyglot.t("sidebar.reset_settings")}
              </Menu.Item>
              <Menu.Item key="4" onClick={() => setLogoutModalVisible(true)}>
                <IconPoweroff className="icon-right" />
                {polyglot.t("sidebar.logout")}
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
        title={
          <div>
            <IconInfoCircleFill />
            <span>{polyglot.t("sidebar.settings_reset_confirm")}</span>
          </div>
        }
        simple
        closable
        okButtonProps={{ status: "danger" }}
        visible={resetModalVisible}
        style={{ maxWidth: "95%" }}
      >
        <p>{polyglot.t("sidebar.settings_reset_description")}</p>
      </Modal>

      <Modal
        onCancel={() => setLogoutModalVisible(false)}
        onOk={handleLogout}
        title={
          <div>
            <IconInfoCircleFill />
            <span>{polyglot.t("sidebar.logout_confirm")}</span>
          </div>
        }
        simple
        closable
        okButtonProps={{ status: "danger" }}
        visible={logoutModalVisible}
        style={{ maxWidth: "95%" }}
      >
        <p>{polyglot.t("sidebar.logout_description")}</p>
      </Modal>
    </div>
  );
}
