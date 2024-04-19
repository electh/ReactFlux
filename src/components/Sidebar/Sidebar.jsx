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
import { memo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAtomValue } from "jotai";
import useStore from "../../Store";
import { configAtom } from "../../atoms/configAtom";
import {
  categoriesAtom,
  feedsGroupedByIdAtom,
  hiddenCategoryIdsAtom,
  historyCountAtom,
  isAppDataReadyAtom,
  starredCountAtom,
  unreadTodayCountAtom,
  unreadTotalAtom,
} from "../../atoms/dataAtom";
import "./Sidebar.css";

const MenuItem = Menu.Item;
const { Sider } = Layout;

const CategoryTitle = memo(({ category, isOpen }) => {
  const feedsGroupedById = useAtomValue(feedsGroupedByIdAtom);
  const unreadCount = feedsGroupedById[category.id]?.reduce(
    (acc, feed) => acc + feed.unreadCount,
    0,
  );

  return (
    <div className="category-title">
      <Typography.Ellipsis
        expandable={false}
        showTooltip={true}
        style={{ width: unreadCount ? "80%" : "100%" }}
      >
        {isOpen ? <IconDown /> : <IconRight />}
        {category.title}
      </Typography.Ellipsis>
      {unreadCount > 0 && (
        <Typography.Ellipsis className="unread-count" expandable={false}>
          {unreadCount}
        </Typography.Ellipsis>
      )}
    </div>
  );
});

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useStore((state) => state.collapsed);
  const categories = useAtomValue(categoriesAtom);
  const isAppDataReady = useAtomValue(isAppDataReadyAtom);
  const unreadTotal = useAtomValue(unreadTotalAtom);
  const unreadTodayCount = useAtomValue(unreadTodayCountAtom);
  const starredCount = useAtomValue(starredCountAtom);
  const historyCount = useAtomValue(historyCountAtom);
  const feedsGroupedById = useAtomValue(feedsGroupedByIdAtom);
  const hiddenCategoryIds = useAtomValue(hiddenCategoryIdsAtom);
  const toggleCollapsed = useStore((state) => state.toggleCollapsed);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  const config = useAtomValue(configAtom);
  const { showAllFeeds, showFeedIcon } = config;

  const path = location.pathname;

  const handleClickSubMenu = (key, currentOpenKeys) => {
    setOpenKeys(currentOpenKeys);
  };

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
    if (!isAppDataReady) {
      setOpenKeys([]);
    }
  }, [isAppDataReady]);

  return (
    <Sider
      breakpoint="lg"
      className="sidebar"
      collapsed={collapsed}
      collapsedWidth={0}
      collapsible
      onCollapse={toggleCollapsed}
      trigger={null}
      width={240}
      style={{
        borderRight: collapsed ? "none" : "1px solid var(--color-border-2)",
        display: collapsed ? "none" : "block",
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
          className="menu-header"
          style={{
            visibility: collapsed ? "hidden" : "visible",
          }}
        >
          <Avatar className="avatar" size={32}>
            <IconBook style={{ color: "var(--color-bg-1)" }} />
          </Avatar>
          <Typography.Title heading={6} style={{ margin: "0" }}>
            ReactFlux
          </Typography.Title>
        </div>
        <Divider className="divider" />
        <Typography.Title className="section-title" heading={6}>
          Articles
        </Typography.Title>
        <Skeleton
          loading={!isAppDataReady}
          animation={true}
          text={{ rows: 3 }}
        />
        {isAppDataReady ? (
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
                  {unreadTodayCount || ""}
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
                  {historyCount || ""}
                </Typography.Ellipsis>
              </div>
            </MenuItem>
          </div>
        ) : null}
        <Typography.Title className="section-title" heading={6}>
          Feeds
        </Typography.Title>
        <Skeleton
          loading={!isAppDataReady}
          animation={true}
          text={{ rows: 6 }}
        />
        {isAppDataReady
          ? categories
              .filter(
                (category) =>
                  showAllFeeds || !hiddenCategoryIds.includes(category.id),
              )
              .map((category) => (
                <Menu.SubMenu
                  key={`/category/${category.id}`}
                  selectable={true}
                  title={
                    <CategoryTitle
                      category={category}
                      isOpen={openKeys.includes(`/category/${category.id}`)}
                    />
                  }
                  onClick={(e) => {
                    setSelectedKeys([`/category/${category.id}`]);
                    if (
                      !(
                        e.target.tagName === "svg" ||
                        e.target.tagName === "path"
                      ) &&
                      path !== `/category/${category.id}`
                    ) {
                      navigate(`/category/${category.id}`);
                    }
                  }}
                >
                  {feedsGroupedById[category.id]?.map((feed) => (
                    <MenuItem
                      key={`/feed/${feed.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedKeys([`/category/${category.id}`]);
                        navigate(`/feed/${feed.id}`);
                      }}
                    >
                      <div className="custom-menu-item">
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
                            className="item-count"
                            expandable={false}
                          >
                            {feed.unreadCount}
                          </Typography.Ellipsis>
                        )}
                      </div>
                    </MenuItem>
                  ))}
                </Menu.SubMenu>
              ))
          : null}
      </Menu>
    </Sider>
  );
};

export default Sidebar;
