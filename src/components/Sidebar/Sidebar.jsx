import {
  Avatar,
  Button,
  Collapse,
  Divider,
  Dropdown,
  Menu,
  Message,
  Skeleton,
  Typography,
} from "@arco-design/web-react";
import {
  IconBook,
  IconCalendar,
  IconDownload,
  IconEye,
  IconEyeInvisible,
  IconHistory,
  IconMinusCircle,
  IconMoreVertical,
  IconRecord,
  IconRight,
  IconStar,
  IconUnorderedList,
  IconUpload,
} from "@arco-design/web-react/icon";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";

import { useStore } from "@nanostores/react";
import classNames from "classnames";
import { exportOPML, importOPML } from "../../apis";
import useAppData from "../../hooks/useAppData";
import { polyglotState } from "../../hooks/useLanguage";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { contentState, setActiveContent } from "../../store/contentState";
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
  const { infoFrom } = useStore(contentState);
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
        count={infoFrom === "starred" ? starredCount : 0}
      />
      <CustomMenuItem
        path="/history"
        Icon={IconHistory}
        label={polyglot.t("sidebar.history")}
        count={infoFrom === "history" ? historyCount : 0}
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

  const parentRef = useRef(null);
  const scrollableNodeRef = useRef(null);

  const filteredFeeds = useMemo(
    () =>
      feedsGroupedById[categoryId]?.filter(
        (feed) => !showUnreadFeedsOnly || feed.unreadCount > 0,
      ) || [],
    [feedsGroupedById, categoryId, showUnreadFeedsOnly],
  );

  const virtualizer = useVirtualizer({
    count: filteredFeeds.length,
    getScrollElement: () => scrollableNodeRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollableNodeRef.current) {
        virtualizer.measure();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [virtualizer]);

  return (
    <SimpleBar
      ref={parentRef}
      scrollableNodeProps={{
        ref: scrollableNodeRef,
        style: { minHeight: "40px" },
      }}
      style={{ maxHeight: 400 }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const feed = filteredFeeds[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <FeedMenuItem feed={feed} />
            </div>
          );
        })}
      </div>
    </SimpleBar>
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

const MoreOptionsDropdown = () => {
  const { showHiddenFeeds, showUnreadFeedsOnly } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const { fetchAppData } = useAppData();

  const handleToggleFeedsVisibility = () => {
    updateSettings({ showHiddenFeeds: !showHiddenFeeds });
  };

  const handleToggleUnreadFeedsOnly = () => {
    updateSettings({ showUnreadFeedsOnly: !showUnreadFeedsOnly });
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleImportOPML = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    try {
      const fileContent = await readFileAsText(file);
      const response = await importOPML(fileContent);

      if (response.status === 201) {
        Message.success(polyglot.t("sidebar.import_opml_success"));
        await fetchAppData();
      } else {
        Message.error(polyglot.t("sidebar.import_opml_error"));
      }
    } catch (error) {
      Message.error(polyglot.t("sidebar.import_opml_error"));
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportOPML = async () => {
    try {
      const opmlContent = await exportOPML();
      downloadFile(opmlContent, "feeds.opml", "text/xml");
    } catch (error) {
      Message.error(polyglot.t("sidebar.export_opml_error"));
    }
  };

  return (
    <>
      <Dropdown
        position="br"
        trigger="click"
        droplist={
          <Menu>
            <MenuItem key="1" onClick={handleToggleFeedsVisibility}>
              {showHiddenFeeds ? (
                <IconEyeInvisible className="icon-right" />
              ) : (
                <IconEye className="icon-right" />
              )}
              {showHiddenFeeds
                ? polyglot.t("sidebar.hide_hidden_feeds")
                : polyglot.t("sidebar.show_hidden_feeds")}
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
            <Divider style={{ margin: "4px 0" }} />
            <MenuItem
              key="3"
              onClick={() => document.getElementById("opmlInput").click()}
            >
              <IconUpload className="icon-right" />
              {polyglot.t("sidebar.import_opml")}
            </MenuItem>
            <MenuItem key="4" onClick={handleExportOPML}>
              <IconDownload className="icon-right" />
              {polyglot.t("sidebar.export_opml")}
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
      <input
        id="opmlInput"
        type="file"
        accept=".opml,.xml"
        style={{ display: "none" }}
        onChange={handleImportOPML}
      />
    </>
  );
};

const Sidebar = () => {
  const { homePage } = useStore(settingsState);
  const { isAppDataReady } = useStore(dataState);
  const { polyglot } = useStore(polyglotState);

  const [selectedKeys, setSelectedKeys] = useState([`/${homePage}`]);

  const location = useLocation();
  const currentPath = location.pathname;

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
              <MoreOptionsDropdown />
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
