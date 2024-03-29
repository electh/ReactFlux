import {
  Avatar,
  Divider,
  Layout,
  Menu,
  Skeleton,
  Typography,
} from "@arco-design/web-react";
import {
  IconBook,
  IconCalendar,
  IconDown,
  IconHistory,
  IconRight,
  IconStar,
  IconUnorderedList,
} from "@arco-design/web-react/icon";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import isURL from "validator/es/lib/isURL";

import useStore from "../../Store";
import { extractProtocolAndHostname } from "../../utils/url";
import "./Sidebar.css";

const MenuItem = Menu.Item;
const { Sider } = Layout;

const GroupTitle = ({ group, isOpen }) => (
  <div className="group-title">
    <Typography.Ellipsis
      expandable={false}
      showTooltip={true}
      style={{ width: group.unreadCount ? "80%" : "100%" }}
    >
      {isOpen ? <IconDown /> : <IconRight />}
      {group.title}
    </Typography.Ellipsis>
    {group.unreadCount > 0 && (
      <Typography.Ellipsis className="unread-count" expandable={false}>
        {group.unreadCount}
      </Typography.Ellipsis>
    )}
  </div>
);

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useStore((state) => state.collapsed);
  const feeds = useStore((state) => state.feeds);
  const groups = useStore((state) => state.groups);
  const loading = useStore((state) => state.loading);
  const unreadTotal = useStore((state) => state.unreadTotal);
  const unreadToday = useStore((state) => state.unreadToday);
  const starredCount = useStore((state) => state.starredCount);
  const readCount = useStore((state) => state.readCount);
  const showFeedIcon = useStore((state) => state.showFeedIcon);
  const toggleCollapsed = useStore((state) => state.toggleCollapsed);
  const hiddenFeedIds = useStore((state) => state.hiddenFeedIds);
  const hiddenGroupIds = useStore((state) => state.hiddenGroupIds);
  const showAllFeeds = useStore((state) => state.showAllFeeds);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  const path = location.pathname;

  const handleClickSubMenu = (key, currentOpenKeys) => {
    setOpenKeys(currentOpenKeys);
  };

  const feedsGroupedById = feeds.reduce((groupedFeeds, feed) => {
    if (!showAllFeeds && hiddenFeedIds.includes(feed.id)) {
      return groupedFeeds;
    }

    if (!isURL(feed.site_url)) {
      feed.site_url = extractProtocolAndHostname(feed.feed_url);
    }

    const { id: groupId } = feed.category;
    groupedFeeds[groupId] = groupedFeeds[groupId] || [];
    groupedFeeds[groupId].push(feed);
    return groupedFeeds;
  }, {});

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setSelectedKeys([path]);
    if (!collapsed) {
      const viewportWidth = window.innerWidth;
      if (viewportWidth <= 992) {
        toggleCollapsed(true);
      }
    }
  }, [path]);

  useEffect(() => {
    if (!loading) {
      setOpenKeys([]);
    }
  }, [loading]);

  return (
    <Sider
      className="sidebar"
      trigger={null}
      width={240}
      collapsedWidth={0}
      breakpoint="lg"
      onCollapse={toggleCollapsed}
      collapsed={collapsed}
      collapsible
      style={{
        height: "100%",
        borderRight: collapsed ? "none" : "1px solid var(--color-border-2)",
        position: "fixed",
        top: 0,
        zIndex: 999,
      }}
    >
      <Menu
        autoScrollIntoView={true}
        collapse={collapsed}
        defaultSelectedKeys={[path]}
        hasCollapseButton
        onClickSubMenu={handleClickSubMenu}
        onCollapseChange={toggleCollapsed}
        selectedKeys={selectedKeys}
        style={{ width: "240px", height: "100%" }}
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
            ReactFlux
          </Typography.Title>
        </div>
        <Divider style={{ marginTop: 0, marginBottom: "4px" }} />
        <Typography.Title
          heading={6}
          style={{ fontStyle: "italic", color: "var(--color-text-3)" }}
        >
          Articles
        </Typography.Title>
        <Skeleton loading={loading} animation={true} text={{ rows: 3 }} />
        {loading ? null : (
          <div>
            <MenuItem key={"/all"} onClick={() => navigate("/all")}>
              <div className="custom-menu-item">
                <span>
                  <IconUnorderedList />
                  All
                </span>
                <Typography.Ellipsis className="item-count" expandable={false}>
                  {unreadTotal || ""}
                </Typography.Ellipsis>
              </div>
            </MenuItem>
            <MenuItem key={"/today"} onClick={() => navigate("/today")}>
              <div className="custom-menu-item">
                <span>
                  <IconCalendar />
                  Today
                </span>
                <Typography.Ellipsis className="item-count" expandable={false}>
                  {unreadToday || ""}
                </Typography.Ellipsis>
              </div>
            </MenuItem>
            <MenuItem key={"/starred"} onClick={() => navigate("/starred")}>
              <div className="custom-menu-item">
                <span>
                  <IconStar />
                  Starred
                </span>
                <Typography.Ellipsis className="item-count" expandable={false}>
                  {starredCount || ""}
                </Typography.Ellipsis>
              </div>
            </MenuItem>
            <MenuItem key={"/history"} onClick={() => navigate("/history")}>
              <div className="custom-menu-item">
                <span>
                  <IconHistory />
                  History
                </span>
                <Typography.Ellipsis className="item-count" expandable={false}>
                  {readCount || ""}
                </Typography.Ellipsis>
              </div>
            </MenuItem>
          </div>
        )}
        <Typography.Title
          heading={6}
          style={{ fontStyle: "italic", color: "var(--color-text-3)" }}
        >
          Feeds
        </Typography.Title>
        <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
        {loading
          ? null
          : groups
              .filter(
                (group) => showAllFeeds || !hiddenGroupIds.includes(group.id),
              )
              .map((group) => (
                <Menu.SubMenu
                  key={`/group/${group.id}`}
                  selectable={true}
                  title={
                    <GroupTitle
                      group={group}
                      isOpen={openKeys.includes(`/group/${group.id}`)}
                    />
                  }
                  onClick={(e) => {
                    setSelectedKeys([`/group/${group.id}`]);
                    if (
                      !(
                        e.target.tagName === "svg" ||
                        e.target.tagName === "path"
                      ) &&
                      path !== `/group/${group.id}`
                    ) {
                      navigate(`/group/${group.id}`);
                    }
                  }}
                >
                  {feedsGroupedById[group.id]?.map((feed) => (
                    <MenuItem
                      key={`/feed/${feed.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedKeys([`/group/${group.id}`]);
                        navigate(`/feed/${feed.id}`);
                      }}
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
                          style={{
                            width: feed.unreadCount !== 0 ? "80%" : "100%",
                          }}
                        >
                          {showFeedIcon && (
                            <img
                              src={`https://icons.duckduckgo.com/ip3/${
                                new URL(feed.site_url).hostname
                              }.ico`}
                              alt="Icon"
                              style={{
                                marginRight: "8px",
                                width: "16px",
                                height: "16px",
                                verticalAlign: "-2px",
                              }}
                            />
                          )}
                          {feed.title}
                        </Typography.Ellipsis>
                        {feed.unreadCount !== 0 && (
                          <Typography.Ellipsis
                            expandable={false}
                            style={{
                              color: "var(--color-text-4)",
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            {feed.unreadCount}
                          </Typography.Ellipsis>
                        )}
                      </div>
                    </MenuItem>
                  ))}
                </Menu.SubMenu>
              ))}
      </Menu>
    </Sider>
  );
};

export default Sidebar;
