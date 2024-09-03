import {
  Avatar,
  Collapse,
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
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import classNames from "classnames";
import { useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../../atoms/configAtom";
import { activeContentAtom } from "../../atoms/contentAtom";
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
import FeedIcon from "../ui/FeedIcon";
import "./Sidebar.css";

const MenuItem = Menu.Item;

const CategoryTitle = ({ category, path }) => {
  const navigate = useNavigate();
  const feedsGroupedById = useAtomValue(feedsGroupedByIdAtom);
  const unreadCount = feedsGroupedById[category.id]?.reduce(
    (acc, feed) => acc + feed.unreadCount,
    0,
  );
  const setActiveContent = useSetAtom(activeContentAtom);

  const handleNavigation = () => {
    navigate(`/category/${category.id}`);
    setActiveContent(null);
  };

  return (
    <div
      className={classNames("category-title", {
        "active-subMenu": path === `/category/${category.id}`,
        "inactive-subMenu": path !== `/category/${category.id}`,
      })}
      onClick={handleNavigation}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleNavigation();
        }
      }}
      tabIndex={0}
      role="button"
      style={{ cursor: "pointer" }}
    >
      <Typography.Ellipsis
        expandable={false}
        showTooltip={true}
        style={{
          width: unreadCount ? "80%" : "100%",
          fontWeight: 500,
        }}
      >
        {category.title}
      </Typography.Ellipsis>
      {unreadCount > 0 && (
        <Typography.Ellipsis
          className="unread-count"
          expandable={false}
          style={{ fontWeight: 500 }}
        >
          {unreadCount}
        </Typography.Ellipsis>
      )}
    </div>
  );
};

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
  const setActiveContent = useSetAtom(activeContentAtom);

  const handleNavigation = () => {
    navigate(path);
    setActiveContent(null);
  };

  return (
    <MenuItem
      key={path}
      onClick={handleNavigation}
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

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const categories = useAtomValue(categoriesAtom);
  const isAppDataReady = useAtomValue(isAppDataReadyAtom);
  const feedsGroupedById = useAtomValue(feedsGroupedByIdAtom);
  const hiddenCategoryIds = useAtomValue(hiddenCategoryIdsAtom);
  const setActiveContent = useSetAtom(activeContentAtom);

  const config = useAtomValue(configAtom);
  const { homePage, showAllFeeds, showFeedIcon } = config;

  const [selectedKeys, setSelectedKeys] = useState([`/${homePage}`]);

  const path = location.pathname;

  useEffect(() => {
    setSelectedKeys([path]);
  }, [path]);

  return (
    <Menu
      autoScrollIntoView={true}
      hasCollapseButton={false}
      selectedKeys={selectedKeys}
      style={{ width: "240px", height: "100%" }}
    >
      <div className="menu-header">
        <Avatar className="avatar" size={32}>
          <IconBook style={{ color: "var(--color-bg-1)" }} />
        </Avatar>
        <Typography.Title heading={6} style={{ margin: "0" }}>
          ReactFlux
        </Typography.Title>
      </div>
      <Typography.Title
        className="section-title"
        heading={6}
        style={{ paddingLeft: "12px" }}
      >
        Articles
      </Typography.Title>
      <Skeleton loading={!isAppDataReady} animation={true} text={{ rows: 3 }} />
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
      <Typography.Title
        className="section-title"
        heading={6}
        style={{ paddingLeft: "12px" }}
      >
        Feeds
      </Typography.Title>
      <Skeleton loading={!isAppDataReady} animation={true} text={{ rows: 6 }} />
      {isAppDataReady && (
        <Collapse triggerRegion="icon" bordered={false}>
          {categories
            .filter(
              (category) =>
                showAllFeeds || !hiddenCategoryIds.includes(category.id),
            )
            .map((category) => (
              <Collapse.Item
                name={`/category/${category.id}`}
                key={category.id}
                style={{ position: "relative", overflow: "hidden" }}
                header={<CategoryTitle category={category} path={path} />}
                expandIcon={<IconRight />}
              >
                {feedsGroupedById[category.id]?.map((feed) => (
                  <MenuItem
                    key={`/feed/${feed.id}`}
                    style={{ position: "relative", overflow: "hidden" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/feed/${feed.id}`);
                      setActiveContent(null);
                    }}
                  >
                    <div className="custom-menu-item">
                      <Typography.Ellipsis
                        expandable={false}
                        showTooltip={true}
                        style={{
                          width: feed.unreadCount !== 0 ? "80%" : "100%",
                          paddingLeft: "20px",
                          boxSizing: "border-box",
                        }}
                      >
                        {showFeedIcon && (
                          <FeedIcon
                            feed={feed}
                            className={"feed-icon-sidebar"}
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
              </Collapse.Item>
            ))}
        </Collapse>
      )}
    </Menu>
  );
};

export default Sidebar;
