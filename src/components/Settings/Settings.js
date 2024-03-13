import { Tabs } from "@arco-design/web-react";
import {
  IconCommand,
  IconFile,
  IconFolder,
  IconSkin,
} from "@arco-design/web-react/icon";
import _ from "lodash";
import { useEffect, useState } from "react";

import { getFeeds, getGroups } from "../../apis";
import Appearance from "./Appearance";
import FeedList from "./FeedList";
import GroupList from "./GroupList";
import "./Settings.css";
import Shortcuts from "./Shortcuts";

export default function Settings() {
  const [feeds, setFeeds] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showFeeds, setShowFeeds] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    const feedResponse = await getFeeds();
    const groupResponse = await getGroups();

    if (feedResponse && groupResponse) {
      const feeds = feedResponse.data;
      const groupsWithFeedCount = groupResponse.data.map((group) => {
        const feedCount = feeds.reduce((total, feed) => {
          if (feed.category.id === group.id) {
            return total + 1;
          } else {
            return total;
          }
        }, 0);

        return {
          ...group,
          feedCount: feedCount,
        };
      });
      setFeeds(_.orderBy(feeds, ["title"], ["asc"]));
      setGroups(_.orderBy(groupsWithFeedCount, ["title"], ["asc"]));
      setShowFeeds(feeds);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <Tabs
      defaultActiveTab="1"
      tabPosition="left"
      onChange={refreshData}
      style={{ marginLeft: "-20px" }}
    >
      <Tabs.TabPane
        key="1"
        title={
          <span>
            <IconFile style={{ marginRight: 6 }} />
            Feeds
          </span>
        }
      >
        <FeedList
          feeds={feeds}
          groups={groups}
          loading={loading}
          setFeeds={setFeeds}
          setShowFeeds={setShowFeeds}
          showFeeds={showFeeds}
        />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="2"
        title={
          <span>
            <IconFolder style={{ marginRight: 6 }} />
            Groups
          </span>
        }
      >
        <GroupList groups={groups} loading={loading} setGroups={setGroups} />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="3"
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
        key="4"
        title={
          <span>
            <IconCommand style={{ marginRight: 6 }} />
            Shortcuts
          </span>
        }
      >
        <Shortcuts />
      </Tabs.TabPane>
    </Tabs>
  );
}
