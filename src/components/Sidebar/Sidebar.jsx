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
  IconHistory,
  IconRight,
  IconStar,
  IconUnorderedList,
} from "@arco-design/web-react/icon";
import { memo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import classNames from "classnames";
import { useAtomValue } from "jotai";
import isURL from "validator/lib/isURL";
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
import { useCollapsed } from "../../hooks/useCollapsed";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { extractProtocolAndHostname } from "../../utils/url";
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
        <IconRight className={isOpen ? "icon-open" : "icon-closed"} />
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

const CountDisplay = ({ atom }) => {
  const count = useAtomValue(atom);
  return (
    <Typography.Ellipsis className="item-count" expandable={false}>
      {count || ""}
    </Typography.Ellipsis>
  );
};

const CustomMenuItem = ({ path, Icon, label, countAtom }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSelected = location.pathname === path;

  return (
    <MenuItem
      key={path}
      onClick={() => navigate(path)}
      className={classNames("arco-menu-item", {
        "arco-menu-selected": isSelected,
      })}
    >
      <div className="custom-menu-item">
        <span>
          <Icon />
          {label}
        </span>
        <CountDisplay atom={countAtom} />
      </div>
    </MenuItem>
  );
};

const FeedIcon = ({ feed }) => {
  const url = isURL(feed.site_url)
    ? feed.site_url
    : extractProtocolAndHostname(feed.feed_url);
  const { hostname } = new URL(url);
  const iconSource = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;

  return (
    <img
      src={iconSource}
      alt="Feed icon"
      style={{
        marginRight: "8px",
        width: "16px",
        height: "16px",
        verticalAlign: "-2px",
      }}
    />
  );
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const categories = useAtomValue(categoriesAtom);
  const isAppDataReady = useAtomValue(isAppDataReadyAtom);
  const feedsGroupedById = useAtomValue(feedsGroupedByIdAtom);
  const hiddenCategoryIds = useAtomValue(hiddenCategoryIdsAtom);

  const config = useAtomValue(configAtom);
  const { homePage, showAllFeeds, showFeedIcon } = config;

  const { collapsed, toggleCollapsed } = useCollapsed();
  const { screenWidth } = useScreenWidth();

  const [selectedKeys, setSelectedKeys] = useState([`/${homePage}`]);
  const [openKeys, setOpenKeys] = useState([]);

  const path = location.pathname;

  const handleClickSubMenu = (key, currentOpenKeys) => {
    setOpenKeys(currentOpenKeys);
  };

  useEffect(() => {
    setSelectedKeys([path]);
  }, [path]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (screenWidth <= 992 && !collapsed) {
      toggleCollapsed();
    }
  }, [selectedKeys]);

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
        {isAppDataReady && (
          <div>
            <CustomMenuItem
              path="/all"
              Icon={IconUnorderedList}
              label="All"
              countAtom={unreadTotalAtom}
            />
            <CustomMenuItem
              path="/today"
              Icon={IconCalendar}
              label="Today"
              countAtom={unreadTodayCountAtom}
            />
            <CustomMenuItem
              path="/starred"
              Icon={IconStar}
              label="Starred"
              countAtom={starredCountAtom}
            />
            <CustomMenuItem
              path="/history"
              Icon={IconHistory}
              label="History"
              countAtom={historyCountAtom}
            />
          </div>
        )}
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
                          {showFeedIcon && <FeedIcon feed={feed} />}
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
