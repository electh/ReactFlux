import { Menu, Skeleton, Typography } from "@arco-design/web-react";
import {
  IconFile,
  IconFolder,
  IconStar,
  IconUnorderedList,
} from "@arco-design/web-react/icon";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/Store";

function MenuTitle({ title, unread }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography.Ellipsis expandable={false} style={{ flex: 1 }}>
        {title}
      </Typography.Ellipsis>
      {unread > 0 ? (
        <Typography.Text style={{ color: "var(--color-text-4)" }}>
          {unread}
        </Typography.Text>
      ) : null}
    </div>
  );
}

export default function Sidebar(props) {
  const nav = useNavigate();
  const entries = useStore((state) => state.entries);
  const feeds = useStore((state) => state.feeds);
  const categories = useStore((state) => state.categories);
  const loading = useStore((state) => state.loading);

  const [params] = useSearchParams();
  const from = params.get("from") || "all";
  const id = params.get("id") || "";

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
        {...props}
      >
        <Menu.Item key="all" onClick={() => nav("/")}>
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
        <Menu.Item key="starred" onClick={() => nav("/?from=starred")}>
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
              <IconFolder />
              Categories
            </span>
          }
        >
          {categories.map((category) => (
            <Menu.Item
              key={`category${category.id}`}
              onClick={() => nav(`/?from=category&id=${category.id}`)}
            >
              <MenuTitle
                title={category.title}
                unread={
                  entries.filter(
                    (entry) =>
                      entry.feed.category.id === category.id &&
                      entry.status === "unread",
                  ).length
                }
              />
            </Menu.Item>
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
          {feeds.map((feed) => (
            <Menu.Item
              key={`feed${feed.id}`}
              onClick={() => nav(`/?from=feed&id=${feed.id}`)}
            >
              <MenuTitle
                title={feed.title}
                unread={
                  entries.filter(
                    (entry) =>
                      entry.feed.id === feed.id && entry.status === "unread",
                  ).length
                }
              />
            </Menu.Item>
          ))}
        </Menu.SubMenu>
      </Menu>
    </Skeleton>
  );
}
