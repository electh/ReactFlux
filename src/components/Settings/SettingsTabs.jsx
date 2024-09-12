import { Tabs } from "@arco-design/web-react";
import {
  IconCommand,
  IconFile,
  IconFolder,
  IconSkin,
  IconStorage,
} from "@arco-design/web-react/icon";

import { useStore } from "@nanostores/react";
import { polyglotState } from "../../hooks/useLanguage";
import Appearance from "./Appearance";
import CategoryList from "./CategoryList";
import FeedList from "./FeedList";
import General from "./General";
import Hotkeys from "./Hotkeys";
import "./SettingsTabs.css";

const SettingsTabs = () => {
  const { polyglot } = useStore(polyglotState);

  const CustomTabTitle = (icon, title) => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {icon}
        <div style={{ fontSize: "12px" }}>{title}</div>
      </div>
    );
  };

  return (
    <Tabs
      className="custom-tabs"
      defaultActiveTab="1"
      tabPosition="top"
      animation
    >
      <Tabs.TabPane
        key="1"
        title={CustomTabTitle(
          <IconFile style={{ fontSize: "20px" }} />,
          polyglot.t("settings.feeds"),
        )}
      >
        <FeedList />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="2"
        title={CustomTabTitle(
          <IconFolder style={{ fontSize: "20px" }} />,
          polyglot.t("settings.categories"),
        )}
      >
        <CategoryList />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="3"
        title={CustomTabTitle(
          <IconStorage style={{ fontSize: "20px" }} />,
          polyglot.t("settings.general"),
        )}
      >
        <General />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="4"
        title={CustomTabTitle(
          <IconSkin style={{ fontSize: "20px" }} />,
          polyglot.t("settings.appearance"),
        )}
      >
        <Appearance />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="5"
        title={CustomTabTitle(
          <IconCommand style={{ fontSize: "20px" }} />,
          polyglot.t("settings.hotkeys"),
        )}
      >
        <Hotkeys />
      </Tabs.TabPane>
    </Tabs>
  );
};

export default SettingsTabs;
