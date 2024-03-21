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
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import isURL from "validator/es/lib/isURL";

import useStore from "../../Store";
import { extractProtocolAndHostname } from "../../utils/URL";
import "./Sidebar.css";

const MenuItem = Menu.Item;
const { Sider } = Layout;

const GroupTitle = ({ group, isOpen }) => (
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
      {isOpen ? <IconDown /> : <IconRight />}
      {group.title}
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

const CustomMenuItem = ({ icon, label, key, onClick, count }) => {
  return (
    <MenuItem key={key} onClick={onClick}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          {icon}
          {label}
        </span>
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
          {count === 0 ? "" : count}
        </Typography.Ellipsis>
      </div>
    </MenuItem>
  );
};

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
  const setCollapsed = useStore((state) => state.setCollapsed);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  const path = location.pathname;

  const handleClickSubMenu = (key, currentOpenKeys) => {
    setOpenKeys(currentOpenKeys);
  };

  const feedsGroupedById = feeds.reduce((groupedFeeds, feed) => {
    if (!isURL(feed.site_url)) {
      feed.site_url = extractProtocolAndHostname(feed.feed_url);
    }
    const { id: groupId } = feed.category;
    groupedFeeds[groupId] = groupedFeeds[groupId] || [];
    groupedFeeds[groupId].push(feed);
    return groupedFeeds;
  }, {});

  useEffect(() => {
    setSelectedKeys([path]);
  }, [path]);

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
        zIndex: 999,
      }}
    >
      <Menu
        selectedKeys={selectedKeys}
        style={{ width: "240px", height: "100%" }}
        onCollapseChange={() => setCollapsed(!collapsed)}
        collapse={collapsed}
        hasCollapseButton
        defaultSelectedKeys={[path]}
        onClickSubMenu={handleClickSubMenu}
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
            <CustomMenuItem
              icon={<IconUnorderedList />}
              label="All"
              key={"/"}
              onClick={() => navigate("/")}
              count={unreadTotal}
            />
            <CustomMenuItem
              icon={<IconCalendar />}
              label="Today"
              key={"/today"}
              onClick={() => navigate("/today")}
              count={unreadToday}
            />
            <CustomMenuItem
              icon={<IconStar />}
              label="Starred"
              key={"/starred"}
              onClick={() => navigate("/starred")}
              count={starredCount}
            />
            <CustomMenuItem
              icon={<IconHistory />}
              label="History"
              key={"/history"}
              onClick={() => navigate("/history")}
              count={readCount}
            />
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
          : groups.map((group) => (
              <Menu.SubMenu
                style={{ cursor: "not-allowed" }}
                key={`/${group.id}`}
                title={
                  <GroupTitle
                    group={group}
                    isOpen={openKeys.includes(`/${group.id}`)}
                  />
                }
              >
                {feedsGroupedById[group.id]?.map((feed) => (
                  <MenuItem
                    key={`/${group.id}/${feed.id}`}
                    onClick={() => navigate(`${group.id}/${feed.id}`)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {showFeedIcon && (
                        <img
                          src={`https://icons.duckduckgo.com/ip3/${new URL(feed.feed_url).hostname}.ico`}
                          alt="Icon"
                          style={{
                            marginRight: "8px",
                            width: "16px",
                            height: "16px",
                          }}
                        />
                      )}
                      <Typography.Ellipsis
                        expandable={false}
                        showTooltip={true}
                        style={{ width: feed.unread !== 0 ? "80%" : "100%" }}
                      >
                        {feed.title}
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
                ))}
              </Menu.SubMenu>
            ))}
      </Menu>
    </Sider>
  );
};

export default Sidebar;
