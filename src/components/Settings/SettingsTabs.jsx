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
import { useScreenWidth } from "../../hooks/useScreenWidth";
import Appearance from "./Appearance";
import CategoryList from "./CategoryList";
import FeedList from "./FeedList";
import General from "./General";
import Hotkeys from "./Hotkeys";
import "./SettingsTabs.css";

const CustomTabTitle = ({ icon, title }) => (
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

const SettingsTabs = ({ activeTab, onTabChange }) => {
  const { polyglot } = useStore(polyglotState);
  const { isBelowMedium } = useScreenWidth();

  return (
    <Tabs
      activeTab={activeTab}
      animation
      className="custom-tabs"
      onChange={onTabChange}
      tabPosition="top"
    >
      <Tabs.TabPane
        key="1"
        title={
          <CustomTabTitle
            icon={<IconFile style={{ fontSize: "20px" }} />}
            title={polyglot.t("settings.feeds")}
          />
        }
      >
        <FeedList />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="2"
        title={
          <CustomTabTitle
            icon={<IconFolder style={{ fontSize: "20px" }} />}
            title={polyglot.t("settings.categories")}
          />
        }
      >
        <CategoryList />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="3"
        title={
          <CustomTabTitle
            icon={<IconStorage style={{ fontSize: "20px" }} />}
            title={polyglot.t("settings.general")}
          />
        }
      >
        <General />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="4"
        title={
          <CustomTabTitle
            icon={<IconSkin style={{ fontSize: "20px" }} />}
            title={polyglot.t("settings.appearance")}
          />
        }
      >
        <Appearance />
      </Tabs.TabPane>
      {!isBelowMedium && (
        <Tabs.TabPane
          key="5"
          title={
            <CustomTabTitle
              icon={<IconCommand style={{ fontSize: "20px" }} />}
              title={polyglot.t("settings.hotkeys")}
            />
          }
        >
          <Hotkeys />
        </Tabs.TabPane>
      )}
    </Tabs>
  );
};

export default SettingsTabs;
