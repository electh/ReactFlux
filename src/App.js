import _ from "lodash";
import { create } from "zustand";
import "./App.css";
import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Layout,
  Menu,
  Message,
  Skeleton,
  Space,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import {
  IconBook,
  IconFile,
  IconFolder,
  IconList,
  IconMoonFill,
  IconPoweroff,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { getFeeds, getGroups, getUnreadInfo } from "./apis";

const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;
const Sider = Layout.Sider;

const useStore = create((set) => ({
  feeds: [],
  groups: [],
  loading: true,

  initData: async () => {
    set({ loading: true });
    const feedResponse = await getFeeds();
    const groupResponse = await getGroups();
    const unreadResponse = await getUnreadInfo();

    if (feedResponse && unreadResponse && groupResponse) {
      const unreadInfo = unreadResponse.data.unreads;
      const feedsWithUnread = feedResponse.data.map((feed) => ({
        ...feed,
        unread: unreadInfo[feed.id] ? unreadInfo[feed.id] : 0,
      }));
      const groupsWithUnread = groupResponse.data.map((group) => {
        const unreadCount = feedsWithUnread.reduce((total, feed) => {
          if (feed.category.id === group.id) {
            return total + feed.unread;
          } else {
            return total;
          }
        }, 0);

        return {
          ...group,
          unread: unreadCount,
        };
      });
      set({ feeds: _.orderBy(feedsWithUnread, ["title"], ["asc"]) });
      set({ groups: _.orderBy(groupsWithUnread, ["title"], ["asc"]) });
      set({ loading: false });
    }
  },
  updateFeedUnreadCount: (feed_id, newStatus) => {
    set((state) => {
      const updatedFeeds = state.feeds.map((feed) =>
        feed.id === feed_id
          ? {
              ...feed,
              unread: newStatus === "read" ? feed.unread - 1 : feed.unread + 1,
            }
          : feed,
      );
      return { feeds: updatedFeeds };
    });
  },
  updateGroupUnreadCount: (group_id, newStatus) => {
    set((state) => {
      const updatedGroups = state.groups.map((group) =>
        group.id === group_id
          ? {
              ...group,
              unread:
                newStatus === "read" ? group.unread - 1 : group.unread + 1,
            }
          : group,
      );
      return { groups: updatedGroups };
    });
  },
}));

export default function App() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const feeds = useStore((state) => state.feeds);
  const groups = useStore((state) => state.groups);
  const loading = useStore((state) => state.loading);
  const initData = useStore((state) => state.initData);
  let path = useLocation().pathname;
  useEffect(() => {
    console.log(path);
    console.log(
      path.substring(1).indexOf("/") === -1
        ? path
        : path.substring(0, path.substring(1).indexOf("/") + 1),
    );
  }, [path]);
  useEffect(() => {
    initData();
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handelToggle() {
    if (theme === "light") {
      document.body.setAttribute("arco-theme", "dark");
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
  }

  function initTheme() {
    if (theme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
    }
  }

  function handelCollapse(collapse) {
    setCollapsed(collapse);
  }

  function handelLogout() {
    localStorage.removeItem("server");
    localStorage.removeItem("token");
    localStorage.removeItem("theme");
    document.body.removeAttribute("arco-theme");
    navigate("/login");
    Message.success("logout");
  }

  return (
    <div className="app" style={{ display: "flex" }}>
      <div
        className="header"
        style={{
          borderBottom: "1px solid var(--color-border-2)",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          position: "fixed",
          width: "100%",
          height: "60px",
          zIndex: "999",
          backgroundColor: "var(--color-bg-1)",
        }}
      >
        <div
          className="brand"
          style={{ marginLeft: "20px", display: "flex", alignItems: "center" }}
        >
          <IconBook
            style={{
              fontSize: 32,
              color: "rgb(var(--primary-6))",
              marginRight: "5px",
            }}
          />
          <Typography.Title heading={5} style={{ margin: "0" }}>
            ReactFlux
          </Typography.Title>
        </div>
        <div className="button-group" style={{ marginRight: "20px" }}>
          <Space size={20}>
            <Tooltip
              content={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <Button
                shape="circle"
                icon={theme === "dark" ? <IconSunFill /> : <IconMoonFill />}
                onClick={() => handelToggle()}
              ></Button>
            </Tooltip>

            <Dropdown
              droplist={
                <Menu>
                  <Menu.Item key="1" onClick={handelLogout}>
                    <IconPoweroff
                      style={{
                        marginRight: 8,
                        fontSize: 16,
                        transform: "translateY(1px)",
                      }}
                    />
                    Logout
                  </Menu.Item>
                </Menu>
              }
              trigger="click"
              position="br"
            >
              <Avatar size={32} style={{ cursor: "pointer" }}>
                <IconUser />
              </Avatar>
            </Dropdown>
          </Space>
        </div>
      </div>
      <Sider
        className="sidebar"
        trigger={null}
        breakpoint="lg"
        onCollapse={(collapse) => handelCollapse(collapse)}
        collapsed={collapsed}
        collapsible
        style={{
          height: "calc(100% - 61px)",
          borderRight: "1px solid var(--color-border-2)",
          position: "fixed",
          top: "61px",
          zIndex: "999",
        }}
      >
        <Menu
          style={{ width: 200, height: "100%" }}
          onCollapseChange={() => setCollapsed(!collapsed)}
          collapse={collapsed}
          autoOpen
          hasCollapseButton
          defaultOpenKeys={[
            path.substring(1).indexOf("/") === -1
              ? path
              : path.substring(0, path.substring(1).indexOf("/") + 1),
          ]}
          defaultSelectedKeys={[path]}
        >
          <Menu.Item key={`/`} onClick={() => navigate("/")}>
            <IconList />
            ARTICLES
          </Menu.Item>
          {collapsed ? null : <Divider style={{ margin: "4px" }} />}
          <SubMenu
            key={`/group`}
            title={
              <>
                <IconFolder />
                GROUPS
              </>
            }
          >
            <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
            {!loading
              ? groups.map((group) => (
                  <MenuItem
                    key={`/group/${group.id}`}
                    onClick={() => navigate(`/group/${group.id}`)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {group.title.toUpperCase()}{" "}
                      <Typography.Text disabled>
                        {group.unread === 0 ? "" : group.unread}
                      </Typography.Text>
                    </div>
                  </MenuItem>
                ))
              : null}
          </SubMenu>
          {collapsed ? null : <Divider style={{ margin: "4px" }} />}
          <SubMenu
            key={`/feed`}
            title={
              <>
                <IconFile />
                FEEDS
              </>
            }
          >
            <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
            {!loading
              ? feeds.map((feed) => (
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
                      {feed.title.toUpperCase()}{" "}
                      <Typography.Text disabled>
                        {feed.unread === 0 ? "" : feed.unread}
                      </Typography.Text>
                    </div>
                  </MenuItem>
                ))
              : null}
          </SubMenu>
        </Menu>
      </Sider>
      <div
        className="article-list"
        style={{
          backgroundColor: "var(--color-bg-1)",
          paddingTop: "61px",
          paddingLeft: collapsed ? "48px" : "200px",
          height: "calc(100vh - 61px)",
          display: "flex",
          transition: "all 0.1s linear",
          width: "100%",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export { useStore };
