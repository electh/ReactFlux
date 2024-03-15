import {
  Avatar,
  Divider,
  Layout,
  Menu,
  Skeleton,
  Typography,
} from "@arco-design/web-react";
import { IconApps, IconBook, IconList } from "@arco-design/web-react/icon";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useStore } from "../Store";

const MenuItem = Menu.Item;
const { Sider } = Layout;
const { SubMenu } = Menu;

const GroupTitle = ({ group }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <Typography.Ellipsis
      expandable={false}
      showTooltip={true}
      style={{ width: group.unread !== 0 ? "80%" : "100%" }}
    >
      {group.title.toUpperCase()}
    </Typography.Ellipsis>
    {group.unread !== 0 && (
      <Typography.Ellipsis
        expandable={false}
        showTooltip={true}
        style={{
          width: "20%",
          color: "var(--color-text-4)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {group.unread}
      </Typography.Ellipsis>
    )}
  </div>
);

const FeedItem = ({ feed, navigate }) => (
  <MenuItem
    key={`/feed/${feed.id}`}
    onClick={() => navigate(`/feed/${feed.id}`)}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography.Ellipsis
        expandable={false}
        showTooltip={true}
        style={{ width: feed.unread !== 0 ? "80%" : "100%" }}
      >
        {feed.title.toUpperCase()}{" "}
      </Typography.Ellipsis>
      {feed.unread !== 0 && (
        <Typography.Ellipsis
          expandable={false}
          showTooltip={true}
          style={{
            width: "20%",
            color: "var(--color-text-4)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {feed.unread}
        </Typography.Ellipsis>
      )}
    </div>
  </MenuItem>
);

export default function Sidebar({ location }) {
  const navigate = useNavigate();
  const collapsed = useStore((state) => state.collapsed);
  const feeds = useStore((state) => state.feeds);
  const groups = useStore((state) => state.groups);
  const loading = useStore((state) => state.loading);
  const setCollapsed = useStore((state) => state.setCollapsed);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const path = location.pathname;

  const feedsGroupedById = feeds.reduce((groupedFeeds, feed) => {
    const { id: groupId } = feed.category;
    groupedFeeds[groupId] = groupedFeeds[groupId] || [];
    groupedFeeds[groupId].push(feed);
    return groupedFeeds;
  }, {});

  useEffect(() => {
    setSelectedKeys([location.pathname]);
  }, [location]);

  return (
    <Sider
      className="sidebar"
      trigger={null}
      width={240}
      collapsedWidth={0}
      breakpoint="lg"
      onCollapse={setCollapsed}
      collapsed={collapsed}
      collapsible
      style={{
        height: "100%",
        borderRight: collapsed ? "none" : "1px solid var(--color-border-2)",
        position: "fixed",
        top: 0,
        zIndex: "999",
      }}
    >
      <Menu
        selectedKeys={selectedKeys}
        style={{ width: "240px", height: "100%" }}
        onCollapseChange={() => setCollapsed(!collapsed)}
        collapse={collapsed}
        hasCollapseButton
        defaultOpenKeys={[
          path.substring(1).indexOf("/") === -1
            ? "/"
            : path.substring(0, path.substring(1).indexOf("/") + 1),
        ]}
        defaultSelectedKeys={[path]}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 28px 0 10px",
            height: "48px",
            marginTop: "-4px",
            visibility: collapsed ? "hidden" : "visible",
          }}
        >
          <Avatar
            size={32}
            style={{
              marginRight: "10px",
              backgroundColor: "var(--color-text-1)",
            }}
          >
            <IconBook style={{ color: "var(--color-bg-1)" }} />
          </Avatar>
          <Typography.Title heading={6} style={{ margin: "0" }}>
            Reactflux
          </Typography.Title>
        </div>
        <Divider style={{ marginTop: 0, marginBottom: "4px" }} />
        <SubMenu
          key={`/`}
          title={
            <span style={{ fontWeight: 500 }}>
              <IconList />
              ARTICLES
            </span>
          }
        >
          <Skeleton loading={loading} animation text={{ rows: 3 }}>
            <MenuItem key={`/`} onClick={() => navigate("/")}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>ALL</span>
                <Typography.Ellipsis
                  expandable={false}
                  showTooltip={true}
                  style={{
                    width: "50%",
                    color: "var(--color-text-4)",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  {feeds.reduce((sum, feed) => sum + feed.unread, 0) === 0
                    ? ""
                    : feeds.reduce((sum, feed) => sum + feed.unread, 0)}
                </Typography.Ellipsis>
              </div>
            </MenuItem>
            <MenuItem key={`/starred`} onClick={() => navigate("/starred")}>
              <span>STARRED</span>
            </MenuItem>
            <MenuItem key={"/history"} onClick={() => navigate("/history")}>
              <span>HISTORY</span>
            </MenuItem>
          </Skeleton>
        </SubMenu>
        {/*{collapsed ? null : <Divider style={{ margin: "4px" }} />}*/}
        <SubMenu
          key={`/group`}
          title={
            <span style={{ fontWeight: 500 }}>
              <IconApps />
              GROUPS
            </span>
          }
        >
          <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
          {loading
            ? null
            : groups.map((group) => (
                <SubMenu
                  selectable={true}
                  key={`/group/${group.id}`}
                  title={<GroupTitle group={group} />}
                >
                  {feedsGroupedById[group.id]?.map((feed) => (
                    <FeedItem
                      key={`/feed/${feed.id}`}
                      feed={feed}
                      navigate={navigate}
                    />
                  ))}
                </SubMenu>
              ))}
        </SubMenu>
      </Menu>
    </Sider>
  );
}
