import _ from "lodash";
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
  IconFolder,
  IconList,
  IconMoonFill,
  IconPoweroff,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { thunder } from "./apis/axios";
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;
const Sider = Layout.Sider;

export default function App() {
  const navigate = useNavigate();
  const [categoriesAndFeeds, setCategoriesAndFeeds] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  let path = useLocation().pathname;
  // useEffect(() => {
  //   console.log(path);
  //   console.log(
  //     path.substring(1).indexOf("/") === -1
  //       ? path
  //       : path.substring(0, path.substring(1).indexOf("/") + 1),
  //   );
  // }, [path]);
  useEffect(() => {
    getCategoriesAndFeeds().then(() => setLoading(false));
    initTheme();
  }, []);

  async function getCategoryFeeds(c_id) {
    try {
      const response = await thunder.request({
        method: "get",
        url: `/v1/categories/${c_id}/feeds`,
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
  }

  async function getFeedCounters(feedId) {
    try {
      const response = await thunder.request({
        method: "get",
        url: `/v1/feeds/counters`,
      });
      console.log(response);
      return response.data.unreads[feedId] || 0; // Return unread count or 0 if not found
    } catch (error) {
      console.error(error);
      Message.error(error.message);
      return 0; // Return 0 if there's an error
    }
  }

  async function getCategoriesAndFeeds() {
    try {
      const response = await thunder.request({
        method: "get",
        url: "/v1/categories",
      });
      console.log(response);
      const updatedData = await Promise.all(
        response.data.map(async (c) => {
          const feeds = await getCategoryFeeds(c.id);
          const feedsWithCounters = await Promise.all(
            feeds.map(async (feed) => {
              const unreadCount = await getFeedCounters(feed.id);
              return { ...feed, unreadCount };
            }),
          );
          return { ...c, feeds: feedsWithCounters };
        }),
      );
      // 使用 lodash 的 sortBy 函数对根据 title 属性对外层的数组进行排序
      const sortedData = _.sortBy(updatedData, "title");

      // 使用 forEach 对每个外层元素的 feeds 属性进行排序
      sortedData.forEach((item) => {
        // 使用 lodash 的 sortBy 函数按照 title 属性对 feeds 进行排序
        item.feeds = _.sortBy(item.feeds, "title");
      });
      setCategoriesAndFeeds(sortedData);
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
  }

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
            ALL ARTICLES
          </Menu.Item>
          <Divider style={{ margin: "4px" }} />
          <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
          {categoriesAndFeeds.map((item) => (
            <SubMenu
              key={`/${item.id}`}
              title={
                <>
                  <IconFolder />
                  {item.title.toUpperCase()}
                </>
              }
            >
              {item.feeds &&
                item.feeds.map((feed) => (
                  <MenuItem
                    key={`/${item.id}/${feed.id}`}
                    onClick={() => navigate(`/${item.id}/${feed.id}`)}
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
                        {feed.unreadCount === 0 ? "" : feed.unreadCount}
                      </Typography.Text>
                    </div>
                  </MenuItem>
                ))}
            </SubMenu>
          ))}
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
