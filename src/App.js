import axios from "axios";
import _ from "lodash";
import "./App.css";
import { useEffect, useState } from "react";
import {
  Button,
  Divider,
  Menu,
  Message,
  Skeleton,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import {
  IconBook,
  IconFolder,
  IconMoonFill,
  IconSunFill,
} from "@arco-design/web-react/icon";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

export default function App() {
  const navigate = useNavigate();
  const [categoriesAndFeeds, setCategoriesAndFeeds] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
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
    getCategoriesAndFeeds().then(() => setLoading(false));
  }, []);

  async function getCategorieFeeds(c_id) {
    try {
      const response = await axios({
        method: "get",
        url: `/v1/categories/${c_id}/feeds`,
        baseURL: "https://rss.electh.top",
        headers: {
          "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
        },
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
      const response = await axios({
        method: "get",
        url: `/v1/feeds/counters`,
        baseURL: "https://rss.electh.top",
        headers: {
          "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
        },
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
      const response = await axios({
        method: "get",
        url: "/v1/categories",
        baseURL: "https://rss.electh.top",
        headers: {
          "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
        },
      });
      console.log(response);
      const updatedData = await Promise.all(
        response.data.map(async (c) => {
          const feeds = await getCategorieFeeds(c.id);
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
    if (darkMode === false) {
      document.body.setAttribute("arco-theme", "dark");
      setDarkMode(true);
    } else {
      document.body.removeAttribute("arco-theme");
      setDarkMode(false);
    }
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
        <div className="brand" style={{ marginLeft: "20px" }}>
          <Typography.Title heading={5} style={{ margin: "0" }}>
            ReactFlux
          </Typography.Title>
        </div>
        <div className="button-group" style={{ marginRight: "20px" }}>
          <Tooltip
            content={
              darkMode === true ? "点击切换为亮色模式" : "点击切换为暗黑模式"
            }
          >
            <Button
              shape="circle"
              icon={darkMode === true ? <IconSunFill /> : <IconMoonFill />}
              onClick={() => handelToggle()}
            ></Button>
          </Tooltip>
        </div>
      </div>
      <div
        className="sidebar"
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
            <IconBook />
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
      </div>
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
