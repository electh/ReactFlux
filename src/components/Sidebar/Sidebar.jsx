import {
  Avatar,
  Button,
  Collapse,
  Divider,
  Dropdown,
  Menu,
  Notification,
  Skeleton,
  Typography,
} from "@arco-design/web-react"
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
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import SimpleBar from "simplebar-react"
import { Virtualizer } from "virtua"

import AddFeed from "./AddFeed.jsx"
import Profile from "./Profile.jsx"

import { exportOPML, importOPML } from "@/apis"
import FeedIcon from "@/components/ui/FeedIcon"
import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { contentState, setActiveContent } from "@/store/contentState"
import {
  dataState,
  feedsGroupedByIdState,
  filteredCategoriesState,
  unreadTotalState,
} from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { expandedCategoriesState, setExpandedCategories } from "@/store/sidebarState"

import "./Sidebar.css"

const MenuItem = Menu.Item

const CategoryTitle = ({ category, path }) => {
  const feedsGroupedById = useStore(feedsGroupedByIdState)
  const unreadCount = feedsGroupedById[category.id]?.reduce(
    (acc, feed) => acc + feed.unreadCount,
    0,
  )

  const { isBelowMedium } = useScreenWidth()

  const navigate = useNavigate()

  const handleNavigation = () => {
    navigate(`/category/${category.id}`)
    setActiveContent(null)
  }

  return (
    <div
      role="button"
      style={{ cursor: "pointer" }}
      tabIndex={0}
      className={classNames("category-title", {
        "submenu-active": path === `/category/${category.id}`,
        "submenu-inactive": path !== `/category/${category.id}`,
      })}
      onClick={handleNavigation}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleNavigation()
        }
      }}
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
  )
}

const CountDisplay = ({ count }) => {
  return (
    <Typography.Ellipsis className="item-count" expandable={false}>
      {count || ""}
    </Typography.Ellipsis>
  )
}

const CustomMenuItem = ({ path, Icon, label, count }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isSelected = location.pathname === path

  const handleNavigation = () => {
    navigate(path)
    setActiveContent(null)
  }

  return (
    <MenuItem
      key={path}
      className={classNames("arco-menu-item", {
        "arco-menu-selected": isSelected,
      })}
      onClick={handleNavigation}
    >
      <div className="custom-menu-item">
        <span>
          <Icon />
          {label}
        </span>
        <CountDisplay count={count} />
      </div>
    </MenuItem>
  )
}

const SidebarMenuItems = () => {
  const { infoFrom } = useStore(contentState)
  const { historyCount, starredCount, unreadTodayCount } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const unreadTotal = useStore(unreadTotalState)

  return (
    <>
      <CustomMenuItem
        Icon={IconUnorderedList}
        count={unreadTotal}
        label={polyglot.t("sidebar.all")}
        path="/all"
      />
      <CustomMenuItem
        Icon={IconCalendar}
        count={unreadTodayCount}
        label={polyglot.t("sidebar.today")}
        path="/today"
      />
      <CustomMenuItem
        Icon={IconStar}
        count={infoFrom === "starred" ? starredCount : 0}
        label={polyglot.t("sidebar.starred")}
        path="/starred"
      />
      <CustomMenuItem
        Icon={IconHistory}
        count={infoFrom === "history" ? historyCount : 0}
        label={polyglot.t("sidebar.history")}
        path="/history"
      />
    </>
  )
}

const FeedMenuItem = ({ feed }) => {
  const { showFeedIcon } = useStore(settingsState)

  const { isBelowMedium } = useScreenWidth()

  const navigate = useNavigate()
  const location = useLocation()
  const isSelected = location.pathname === `/feed/${feed.id}`

  return (
    <MenuItem
      key={`/feed/${feed.id}`}
      className={classNames({ "arco-menu-selected": isSelected })}
      style={{ position: "relative", overflow: "hidden" }}
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/feed/${feed.id}`)
        setActiveContent(null)
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
          {showFeedIcon && <FeedIcon className="feed-icon-sidebar" feed={feed} />}
          {feed.title}
        </Typography.Ellipsis>
        {feed.unreadCount !== 0 && (
          <Typography.Ellipsis className="item-count" expandable={false}>
            {feed.unreadCount}
          </Typography.Ellipsis>
        )}
      </div>
    </MenuItem>
  )
}

const FeedMenuGroup = ({ categoryId }) => {
  const { showUnreadFeedsOnly } = useStore(settingsState)
  const feedsGroupedById = useStore(feedsGroupedByIdState)

  const parentRef = useRef(null)
  const scrollableNodeRef = useRef(null)

  const filteredFeeds = useMemo(
    () =>
      feedsGroupedById[categoryId]?.filter(
        (feed) => !showUnreadFeedsOnly || feed.unreadCount > 0,
      ) || [],
    [feedsGroupedById, categoryId, showUnreadFeedsOnly],
  )

  return (
    <SimpleBar
      ref={parentRef}
      style={{ maxHeight: 400 }}
      scrollableNodeProps={{
        ref: scrollableNodeRef,
        style: { minHeight: "40px" },
      }}
    >
      <Virtualizer overscan={10} scrollRef={scrollableNodeRef}>
        {filteredFeeds.map((feed) => (
          <FeedMenuItem key={feed.id} feed={feed} />
        ))}
      </Virtualizer>
    </SimpleBar>
  )
}

const CategoryGroup = () => {
  const { showUnreadFeedsOnly } = useStore(settingsState)
  const feedsGroupedById = useStore(feedsGroupedByIdState)
  const filteredCategories = useStore(filteredCategoriesState)

  const location = useLocation()
  const currentPath = location.pathname

  return filteredCategories
    .filter((category) =>
      feedsGroupedById[category.id]?.some((feed) => {
        if (showUnreadFeedsOnly) {
          return feed.unreadCount > 0
        }
        return true
      }),
    )
    .map((category) => (
      <Collapse.Item
        key={category.id}
        expandIcon={<IconRight />}
        header={<CategoryTitle category={category} path={currentPath} />}
        name={`/category/${category.id}`}
        style={{ position: "relative", overflow: "hidden" }}
      >
        <FeedMenuGroup categoryId={category.id} />
      </Collapse.Item>
    ))
}

const MoreOptionsDropdown = () => {
  const { showHiddenFeeds, showUnreadFeedsOnly } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const { fetchAppData } = useAppData()

  const handleToggleFeedsVisibility = () => {
    updateSettings({ showHiddenFeeds: !showHiddenFeeds })
  }

  const handleToggleUnreadFeedsOnly = () => {
    updateSettings({ showUnreadFeedsOnly: !showUnreadFeedsOnly })
  }

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleImportOPML = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      return
    }

    try {
      const fileContent = await readFileAsText(file)
      const response = await importOPML(fileContent)

      if (response.status === 201) {
        Notification.success({
          title: polyglot.t("sidebar.import_opml_success"),
        })
        await fetchAppData()
      } else {
        Notification.error({
          title: polyglot.t("sidebar.import_opml_error"),
        })
      }
    } catch (error) {
      Notification.error({
        title: polyglot.t("sidebar.import_opml_error"),
        content: error.message,
      })
    }
  }

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleExportOPML = async () => {
    try {
      const opmlContent = await exportOPML()
      downloadFile(opmlContent, "feeds.opml", "text/xml")
      Notification.success({
        title: polyglot.t("sidebar.export_opml_success"),
      })
    } catch (error) {
      Notification.error({
        title: polyglot.t("sidebar.export_opml_error"),
        content: error.message,
      })
    }
  }

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
            <MenuItem key="3" onClick={() => document.getElementById("opmlInput").click()}>
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
        accept=".opml,.xml"
        id="opmlInput"
        style={{ display: "none" }}
        type="file"
        onChange={handleImportOPML}
      />
    </>
  )
}

const Sidebar = () => {
  const { homePage } = useStore(settingsState)
  const { isCoreDataReady } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const expandedCategories = useStore(expandedCategoriesState)

  const [selectedKeys, setSelectedKeys] = useState([`/${homePage}`])

  const location = useLocation()
  const currentPath = location.pathname

  useEffect(() => {
    setSelectedKeys([currentPath])
  }, [currentPath])

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
          <Typography.Title className="section-title" heading={6} style={{ paddingLeft: "12px" }}>
            {polyglot.t("sidebar.articles")}
          </Typography.Title>
          <SidebarMenuItems />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography.Title className="section-title" heading={6} style={{ paddingLeft: "12px" }}>
              {polyglot.t("sidebar.feeds")}
            </Typography.Title>
            <div style={{ display: "flex", gap: "8px", marginRight: "8px" }}>
              <AddFeed />
              <MoreOptionsDropdown />
            </div>
          </div>
          <Skeleton animation={true} loading={!isCoreDataReady} text={{ rows: 6 }} />
          {isCoreDataReady && (
            <Collapse
              activeKey={expandedCategories}
              bordered={false}
              triggerRegion="icon"
              onChange={(_key, keys) => setExpandedCategories(keys)}
            >
              <CategoryGroup />
            </Collapse>
          )}
        </Menu>
      </SimpleBar>
    </div>
  )
}

export default Sidebar
