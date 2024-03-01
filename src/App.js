import axios from "axios";
import "./App.css";
import { useEffect, useState } from "react";
import { Divider, Menu, Message, Skeleton } from "@arco-design/web-react";
import { IconBook, IconFolder } from "@arco-design/web-react/icon";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

export default function App() {
  const navigate = useNavigate();
  const [categoriesAndFeeds, setCategoriesAndFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
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
    getCategoriesAndFeeds().then((data) => setLoading(false));
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
          return { ...c, feeds };
        }),
      );
      setCategoriesAndFeeds(updatedData);
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
  }

  return (
    <div className="app" style={{ display: "flex" }}>
      <div
        className="sidebar"
        style={{
          height: "100vh",
          borderRight: "1px solid var(--color-border-2)",
        }}
      >
        <Menu
          style={{ width: 200, height: "100%" }}
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
          <Skeleton
            loading={loading}
            animation={true}
            text={{ rows: 6 }}
          ></Skeleton>
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
                    {feed.title.toUpperCase()}
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
          height: "100vh",
          flex: "1",
          display: "flex",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
