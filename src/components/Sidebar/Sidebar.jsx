import {
  Avatar,
  Button,
  Collapse,
  Dropdown,
  Menu,
  Skeleton,
  Typography,
} from "@arco-design/web-react";
import {
  IconBook,
  IconCalendar,
  IconEye,
  IconEyeInvisible,
  IconHistory,
  IconMinusCircle,
  IconMoreVertical,
  IconRecord,
  IconRight,
  IconStar,
  IconUnorderedList,
} from "@arco-design/web-react/icon";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";

import { useStore } from "@nanostores/react";
import classNames from "classnames";
import { polyglotState } from "../../hooks/useLanguage";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { setActiveContent } from "../../store/contentState";
import {
  dataState,
  feedsGroupedByIdState,
  filteredCategoriesState,
  unreadTotalState,
} from "../../store/dataState";
import { settingsState, updateSettings } from "../../store/settingsState";
import FeedIcon from "../ui/FeedIcon";
import AddFeed from "./AddFeed.jsx";
import Profile from "./Profile.jsx";
import "./Sidebar.css";

const MenuItem = Menu.Item;

const CategoryTitle = ({ category, path }) => {
  const feedsGroupedById = useStore(feedsGroupedByIdState);
  const unreadCount = feedsGroupedById[category.id]?.reduce(
    (acc, feed) => acc + feed.unreadCount,
    0,
  );

  const { isBelowMedium } = useScreenWidth();

  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(`/category/${category.id}`);
    setActiveContent(null);
  };

  return (
    <div
      className={classNames("category-title", {
        "submenu-active": path === `/category/${category.id}`,
        "submenu-inactive": path !== `/category/${category.id}`,
      })}
      onClick={handleNavigation}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleNavigation();
        }
      }}
      tabIndex={0}
      // biome-ignore lint/a11y/useSemanticElements: <explanation>
      role="button"
      style={{ cursor: "pointer" }}
    >
      <Typography.Ellipsis
        expandable={false}
        showTooltip={!isBelowMedium}
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

const CountDisplay = ({ count }) => {
  return (
    <Typography.Ellipsis className="item-count" expandable={false}>
      {count || ""}
    </Typography.Ellipsis>
  );
};

const CustomMenuItem = ({ path, Icon, label, count }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSelected = location.pathname === path;

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
        <CountDisplay count={count} />
      </div>
    </MenuItem>
  );
};

const SidebarMenuItems = () => {
  const { historyCount, starredCount, unreadTodayCount } = useStore(dataState);
  const { polyglot } = useStore(polyglotState);
  const unreadTotal = useStore(unreadTotalState);

  return (
    <>
      <CustomMenuItem
        path="/all"
        Icon={IconUnorderedList}
        label={polyglot.t("sidebar.all")}
        count={unreadTotal}
      />
      <CustomMenuItem
        path="/today"
        Icon={IconCalendar}
        label={polyglot.t("sidebar.today")}
        count={unreadTodayCount}
      />
      <CustomMenuItem
        path="/starred"
        Icon={IconStar}
        label={polyglot.t("sidebar.starred")}
        count={starredCount}
      />
      <CustomMenuItem
        path="/history"
        Icon={IconHistory}
        label={polyglot.t("sidebar.history")}
        count={historyCount}
      />
    </>
  );
};

const FeedMenuItem = ({ feed }) => {
  const { showFeedIcon } = useStore(settingsState);

  const { isBelowMedium } = useScreenWidth();

  const navigate = useNavigate();
  const location = useLocation();
  const isSelected = location.pathname === `/feed/${feed.id}`;

  return (
    <MenuItem
      className={classNames({ "arco-menu-selected": isSelected })}
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
          showTooltip={!isBelowMedium}
          style={{
            width: feed.unreadCount ? "80%" : "100%",
            paddingLeft: "20px",
            boxSizing: "border-box",
          }}
        >
          {showFeedIcon && (
            <FeedIcon feed={feed} className="feed-icon-sidebar" />
          )}
          {feed.title}
        </Typography.Ellipsis>
        {feed.unreadCount !== 0 && (
          <Typography.Ellipsis className="item-count" expandable={false}>
            {feed.unreadCount}
          </Typography.Ellipsis>
        )}
      </div>
    </MenuItem>
  );
};

const FeedMenuGroup = ({ categoryId }) => {
  const { showUnreadFeedsOnly } = useStore(settingsState);
  const feedsGroupedById = useStore(feedsGroupedByIdState);

  return (
    <>
      {feedsGroupedById[categoryId]
        ?.filter((feed) => !showUnreadFeedsOnly || feed.unreadCount > 0)
        .map((feed) => (
          <FeedMenuItem key={`/feed/${feed.id}`} feed={feed} />
        ))}
    </>
  );
};

const CategoryGroup = () => {
  const { showUnreadFeedsOnly } = useStore(settingsState);
  const feedsGroupedById = useStore(feedsGroupedByIdState);
  const filteredCategories = useStore(filteredCategoriesState);

  const location = useLocation();
  const currentPath = location.pathname;

  return filteredCategories
    .filter((category) =>
      feedsGroupedById[category.id]?.some((feed) => {
        if (showUnreadFeedsOnly) {
          return feed.unreadCount > 0;
        }
        return true;
      }),
    )
    .map((category) => (
      <Collapse.Item
        name={`/category/${category.id}`}
        key={category.id}
        style={{ position: "relative", overflow: "hidden" }}
        header={<CategoryTitle category={category} path={currentPath} />}
        expandIcon={<IconRight />}
      >
        <FeedMenuGroup categoryId={category.id} />
      </Collapse.Item>
    ));
};

const Sidebar = () => {
  const { homePage, showAllFeeds, showUnreadFeedsOnly } =
    useStore(settingsState);
  const { isAppDataReady } = useStore(dataState);
  const { polyglot } = useStore(polyglotState);

  const location = useLocation();

  const [selectedKeys, setSelectedKeys] = useState([`/${homePage}`]);

  const currentPath = location.pathname;

  const handleToggleFeedsVisibility = () => {
    updateSettings({ showAllFeeds: !showAllFeeds });
  };

  const handleToggleUnreadFeedsOnly = () => {
    updateSettings({ showUnreadFeedsOnly: !showUnreadFeedsOnly });
  };

  useEffect(() => {
    setSelectedKeys([currentPath]);
  }, [currentPath]);

  return (
    <div className="sidebar-container">
      <SimpleBar style={{ maxHeight: "100%" }}>
        <Menu hasCollapseButton={false} selectedKeys={selectedKeys}>
          <div className="menu-header">
            <span style={{ display: "flex", alignItems: "center" }}>
              <Avatar className="avatar" size={32}>
                <IconBook style={{ color: "var(--color-bg-1)" }} />
              </Avatar>
              <Typography.Title heading={6} style={{ margin: 0 }}>
                ReactFlux
              </Typography.Title>
            </span>
            <Profile />
          </div>
          <Typography.Title
            className="section-title"
            heading={6}
            style={{ paddingLeft: "12px" }}
          >
            {polyglot.t("sidebar.articles")}
          </Typography.Title>
          <Skeleton
            loading={!isAppDataReady}
            animation={true}
            text={{ rows: 3 }}
          />
          {isAppDataReady && <SidebarMenuItems />}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography.Title
              className="section-title"
              heading={6}
              style={{ paddingLeft: "12px" }}
            >
              {polyglot.t("sidebar.feeds")}
            </Typography.Title>
            <div style={{ display: "flex", gap: "8px", marginRight: "8px" }}>
              <AddFeed />
              <Dropdown
                position="br"
                trigger="click"
                droplist={
                  <Menu>
                    <MenuItem key="1" onClick={handleToggleFeedsVisibility}>
                      {showAllFeeds ? (
                        <IconEyeInvisible className="icon-right" />
                      ) : (
                        <IconEye className="icon-right" />
                      )}
                      {showAllFeeds
                        ? polyglot.t("sidebar.hide_some_feeds")
                        : polyglot.t("sidebar.show_all_feeds")}
                    </MenuItem>
                    <MenuItem key="2" onClick={handleToggleUnreadFeedsOnly}>
                      {showUnreadFeedsOnly ? (
                        <IconMinusCircle className="icon-right" />
                      ) : (
                        <IconRecord className="icon-right" />
                      )}
                      {showUnreadFeedsOnly
                        ? polyglot.t("sidebar.show_read_feeds")
                        : polyglot.t("sidebar.hide_read_feeds")}
                    </MenuItem>
                  </Menu>
                }
              >
                <Button
                  icon={<IconMoreVertical />}
                  shape="circle"
                  size="small"
                  style={{ marginTop: "1em", marginBottom: "0.5em" }}
                />
              </Dropdown>
            </div>
          </div>
          <Skeleton
            loading={!isAppDataReady}
            animation={true}
            text={{ rows: 6 }}
          />
          {isAppDataReady && (
            <Collapse triggerRegion="icon" bordered={false}>
              <CategoryGroup />
            </Collapse>
          )}
        </Menu>
      </SimpleBar>
    </div>
  );
};

export default Sidebar;
