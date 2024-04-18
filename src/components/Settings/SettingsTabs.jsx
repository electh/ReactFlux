import { Tabs } from "@arco-design/web-react";
import {
  IconCommand,
  IconFile,
  IconFolder,
  IconSkin,
  IconStorage,
} from "@arco-design/web-react/icon";

import Appearance from "./Appearance";
import CategoryList from "./CategoryList";
import FeedList from "./FeedList";
import General from "./General";
import Hotkeys from "./Hotkeys";
import "./SettingsTabs.css";

const SettingsTabs = () => (
  <Tabs className="custom-tabs" defaultActiveTab="1" tabPosition="top">
    <Tabs.TabPane
      key="1"
      title={
        <span>
          <IconFile style={{ marginRight: 6 }} />
          Feeds
        </span>
      }
    >
      <FeedList />
    </Tabs.TabPane>
    <Tabs.TabPane
      key="2"
      title={
        <span>
          <IconFolder style={{ marginRight: 6 }} />
          Categories
        </span>
      }
    >
      <CategoryList />
    </Tabs.TabPane>
    <Tabs.TabPane
      key="3"
      title={
        <span>
          <IconStorage style={{ marginRight: 6 }} />
          General
        </span>
      }
    >
      <General />
    </Tabs.TabPane>
    <Tabs.TabPane
      key="4"
      title={
        <span>
          <IconSkin style={{ marginRight: 6 }} />
          Appearance
        </span>
      }
    >
      <Appearance />
    </Tabs.TabPane>
    <Tabs.TabPane
      key="5"
      title={
        <span>
          <IconCommand style={{ marginRight: 6 }} />
          Hotkeys
        </span>
      }
    >
      <Hotkeys />
    </Tabs.TabPane>
  </Tabs>
);

export default SettingsTabs;
