import {
  Divider,
  Dropdown,
  Menu,
  Message,
  Skeleton,
  Typography,
} from "@arco-design/web-react";
import {
  IconApps,
  IconFile,
  IconFolder,
  IconStar,
  IconUnorderedList,
} from "@arco-design/web-react/icon";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/Store";
import { useConfigStore } from "../store/configStore";
import FeedIcon from "../pages/main/components/FeedIcon";
import { useModalStore } from "../store/modalStore";
import { removeCategory } from "../api/api";

function MenuTitle({ icon, title, unread, showIcons }) {
  return (
    <div
      style={{
        margin: 0,
        whiteSpace: "nowrap",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {showIcons !== "off" && ( // 如果showIcons不是"off"，则显示图标
        <div style={{ display: "flex", alignItems: "center" }}>{icon}</div>
      )}
      <span
        style={{
          textOverflow: "ellipsis",
          overflow: "hidden",
          width: "100%", // 将宽度设置为100%以确保ellipsis正常工作
        }}
      >
        {title}
      </span>
      {unread > 0 && ( // 只有在有未读时才显示计数
        <Typography.Text
          style={{
            color: "var(--color-text-4)",
            whiteSpace: "nowrap",
          }}
        >
          {unread}
        </Typography.Text>
      )}
    </div>
  );
}

export default function Sidebar({ style, setVisible }) {
  const nav = useNavigate();
  const initData = useStore((state) => state.initData);
  const entries = useStore((state) => state.entries);
  const feeds = useStore((state) => state.feeds);
  const categories = useStore((state) => state.categories);
  const loading = useStore((state) => state.loading);
  const isMobile = useStore((state) => state.isMobile);
  const unreadOnly = useStore((state) => state.unreadOnly);
  const showIcons = useConfigStore((state) => state.showIcons);
  const setEditFeedVisible = useModalStore((state) => state.setEditFeedVisible);
  const setEditCategoryVisible = useModalStore(
    (state) => state.setEditCategoryVisible,
  );
  const setActiveFeed = useModalStore((state) => state.setActiveFeed);
  const setActiveCategory = useModalStore((state) => state.setActiveCategory);
  const setDeleteFeedVisible = useModalStore(
    (state) => state.setDeleteFeedVisible,
  );

  const [params] = useSearchParams();
  const from = params.get("from") || "all";
  const id = params.get("id") || "";

  const handelDeleteCategory = async (categoryId) => {
    try {
      const response = await removeCategory(categoryId);
      if (response) {
        Message.success("Success");
        await initData();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <Skeleton
      loading={loading}
      style={{ padding: 10 }}
      text={{ rows: 6 }}
      animation
    >
      <Menu
        defaultOpenKeys={["feed", "category"]}
        // defaultOpenKeys={[from]}
        defaultSelectedKeys={[`${from}${id}`]}
        style={style}
      >
        <Menu.Item
          key="all"
          onClick={() => {
            isMobile && setVisible(false);
            nav("/?from=all");
          }}
        >
          <div style={{ display: "flex" }}>
            <span style={{ flex: 1 }}>
              <IconUnorderedList />
              <span>All Items</span>
            </span>
            <span style={{ color: "var(--color-text-4)" }}>
              {entries.filter((a) => a.status === "unread").length === 0
                ? ""
                : entries.filter((a) => a.status === "unread").length}
            </span>
          </div>
        </Menu.Item>
        <Menu.Item
          key="starred"
          onClick={() => {
            isMobile && setVisible(false);
            nav("/?from=starred");
          }}
        >
          <div style={{ display: "flex" }}>
            <span style={{ flex: 1 }}>
              <IconStar />
              <span>Starred</span>
            </span>
            <span style={{ color: "var(--color-text-4)" }}>
              {entries.filter((a) => a.starred === true).length === 0
                ? ""
                : entries.filter((a) => a.starred === true).length}
            </span>
          </div>
        </Menu.Item>
        <Menu.SubMenu
          key="category"
          title={
            <span>
              <IconApps />
              Categories
            </span>
          }
        >
          {categories
            .filter(
              (category) =>
                entries.filter((entry) =>
                  unreadOnly
                    ? entry.status === "unread" &&
                      entry.feed.category.id === category.id
                    : entry.status.length > 0,
                ).length > 0,
            )
            .map((category) => (
              <Dropdown
                trigger="contextMenu"
                position="bl"
                droplist={
                  <Menu>
                    <Menu.Item key={"0"} disabled>
                      {category.title}
                    </Menu.Item>
                    <Divider style={{ margin: "4px 0" }} />
                    <Menu.Item
                      key="1"
                      disabled={
                        entries.filter(
                          (a) => a.feed.category.id === category.id,
                        ).length > 0
                      }
                      onClick={() => handelDeleteCategory(category.id)}
                    >
                      Delete...
                    </Menu.Item>
                    <Menu.Item
                      key="2"
                      onClick={() => {
                        setEditCategoryVisible(true);
                        setActiveCategory(category);
                      }}
                    >
                      Edit...
                    </Menu.Item>
                  </Menu>
                }
              >
                <Menu.Item
                  key={`category${category.id}`}
                  onClick={() => {
                    isMobile && setVisible(false);
                    nav(`/?from=category&id=${category.id}`);
                  }}
                >
                  <MenuTitle
                    icon={<IconFolder style={{ marginRight: "8px" }} />}
                    title={category.title}
                    unread={
                      entries.filter(
                        (entry) =>
                          entry.feed.category.id === category.id &&
                          entry.status === "unread",
                      ).length
                    }
                    showIcons={showIcons}
                  />
                </Menu.Item>
              </Dropdown>
            ))}
        </Menu.SubMenu>
        <Menu.SubMenu
          key="feed"
          title={
            <span>
              <IconFile />
              Feeds
            </span>
          }
        >
          {feeds
            .filter(
              (feed) =>
                entries.filter(
                  (entry) =>
                    entry.feed.id === feed.id &&
                    (unreadOnly
                      ? entry.status === "unread"
                      : entry.status.length > 0),
                ).length > 0,
            )
            .map((feed) => (
              <Dropdown
                trigger="contextMenu"
                position="bl"
                droplist={
                  <Menu>
                    <Menu.Item key={"0"} disabled>
                      {feed.title}
                    </Menu.Item>
                    <Divider style={{ margin: "4px 0" }} />
                    <Menu.Item
                      key="1"
                      onClick={() => {
                        setDeleteFeedVisible(true);
                        setActiveFeed(feed);
                      }}
                    >
                      Unsubscribe...
                    </Menu.Item>
                    <Menu.Item
                      key="2"
                      onClick={() => {
                        setEditFeedVisible(true);
                        setActiveFeed(feed);
                      }}
                    >
                      Edit...
                    </Menu.Item>
                  </Menu>
                }
              >
                <Menu.Item
                  key={`feed${feed.id}`}
                  onClick={() => {
                    isMobile && setVisible(false);
                    nav(`/?from=feed&id=${feed.id}`);
                  }}
                >
                  <MenuTitle
                    icon={<FeedIcon feed={feed} />}
                    title={feed.title}
                    unread={
                      entries.filter(
                        (entry) =>
                          entry.feed.id === feed.id &&
                          entry.status === "unread",
                      ).length
                    }
                    showIcons={showIcons}
                  />
                </Menu.Item>
              </Dropdown>
            ))}
        </Menu.SubMenu>
      </Menu>
    </Skeleton>
  );
}
