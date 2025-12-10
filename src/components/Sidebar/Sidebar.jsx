import {
  Avatar,
  Button,
  Collapse,
  Divider,
  Dropdown,
  Form,
  Menu,
  Notification,
  Skeleton,
  Typography,
} from "@arco-design/web-react"
import {
  IconBook,
  IconCalendar,
  IconDelete,
  IconDownload,
  IconEdit,
  IconEye,
  IconEyeInvisible,
  IconHistory,
  IconMinusCircle,
  IconMoreVertical,
  IconRecord,
  IconRefresh,
  IconRight,
  IconStar,
  IconUnorderedList,
  IconUpload,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import SimpleBar from "simplebar-react"
import { Virtualizer } from "virtua"

import AddFeed from "./AddFeed.jsx"
import Profile from "./Profile.jsx"

import { exportOPML, importOPML } from "@/apis"
import { markCategoryAsRead, refreshCategoryFeed } from "@/apis/categories"
import EditCategoryModal from "@/components/ui/EditCategoryModal"
import EditFeedModal from "@/components/ui/EditFeedModal"
import FeedIcon from "@/components/ui/FeedIcon"
import useAppData from "@/hooks/useAppData"
import useCategoryOperations from "@/hooks/useCategoryOperations"
import { useFeedOperations } from "@/hooks/useFeedOperations"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { contentState, setActiveContent, setEntries } from "@/store/contentState"
import {
  dataState,
  feedsGroupedByIdState,
  filteredCategoriesState,
  setUnreadInfo,
  unreadTotalState,
} from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { expandedCategoriesState, setExpandedCategories } from "@/store/sidebarState"

import "./Sidebar.css"

const MenuItem = Menu.Item

const CategoryTitle = ({
  category,
  path,
  onEditCategory,
  onRefreshCategory,
  onMarkAllAsRead,
  onDeleteCategory,
}) => {
  const feedsGroupedById = useStore(feedsGroupedByIdState)
  const unreadCount = feedsGroupedById[category.id]?.reduce(
    (acc, feed) => acc + feed.unreadCount,
    0,
  )

  const { isBelowMedium } = useScreenWidth()
  const { polyglot } = useStore(polyglotState)

  const navigate = useNavigate()

  const handleNavigation = () => {
    navigate(`/category/${category.id}`)
    setActiveContent(null)
  }

  const canDelete = !feedsGroupedById[category.id] || feedsGroupedById[category.id].length === 0

  return (
    <Dropdown
      position="bl"
      trigger="contextMenu"
      droplist={
        <Menu>
          <MenuItem key="edit-category" onClick={() => onEditCategory(category)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("sidebar.context_menu.edit_category")}</span>
              <IconEdit />
            </div>
          </MenuItem>

          <MenuItem key="refresh-category" onClick={() => onRefreshCategory(category)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("sidebar.context_menu.refresh_category")}</span>
              <IconRefresh />
            </div>
          </MenuItem>

          <MenuItem key="mark-all-as-read" onClick={() => onMarkAllAsRead(category)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("sidebar.context_menu.mark_all_as_read")}</span>
              <IconMinusCircle />
            </div>
          </MenuItem>

          {canDelete && (
            <>
              <Divider style={{ margin: "4px 0" }} />

              <MenuItem key="delete-category" onClick={() => onDeleteCategory(category)}>
                <div className="settings-menu-item">
                  <span style={{ color: "var(--color-danger-light-4)" }}>
                    {polyglot.t("sidebar.context_menu.delete_category")}
                  </span>
                  <IconDelete style={{ color: "var(--color-danger-light-4)" }} />
                </div>
              </MenuItem>
            </>
          )}
        </Menu>
      }
    >
      <div
        role="button"
        style={{ cursor: "pointer" }}
        tabIndex={0}
        className={classNames("category-title", {
          "submenu-active":
            path === `/category/${category.id}` || path.startsWith(`/category/${category.id}/`),
          "submenu-inactive":
            path !== `/category/${category.id}` && !path.startsWith(`/category/${category.id}/`),
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
    </Dropdown>
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
  const isSelected = location.pathname === path || location.pathname.startsWith(`${path}/`)

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

const FeedMenuItem = ({ feed, onEditFeed, onRefreshFeed, onMarkAllAsRead, onDeleteFeed }) => {
  const { showFeedIcon } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const { isBelowMedium } = useScreenWidth()

  const navigate = useNavigate()
  const location = useLocation()
  const isSelected =
    location.pathname === `/feed/${feed.id}` || location.pathname.startsWith(`/feed/${feed.id}/`)

  return (
    <Dropdown
      position="bl"
      trigger="contextMenu"
      droplist={
        <Menu>
          <MenuItem key="edit-feed" onClick={() => onEditFeed(feed)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("sidebar.context_menu.edit_feed")}</span>
              <IconEdit />
            </div>
          </MenuItem>

          <MenuItem key="refresh-feed" onClick={() => onRefreshFeed(feed)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("sidebar.context_menu.refresh_feed")}</span>
              <IconRefresh />
            </div>
          </MenuItem>

          <MenuItem key="mark-all-as-read" onClick={() => onMarkAllAsRead(feed)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("sidebar.context_menu.mark_all_as_read")}</span>
              <IconMinusCircle />
            </div>
          </MenuItem>

          <Divider style={{ margin: "4px 0" }} />

          <MenuItem key="delete-feed" onClick={() => onDeleteFeed(feed)}>
            <div className="settings-menu-item">
              <span style={{ color: "var(--color-danger-light-4)" }}>
                {polyglot.t("sidebar.context_menu.delete_feed")}
              </span>
              <IconDelete style={{ color: "var(--color-danger-light-4)" }} />
            </div>
          </MenuItem>
        </Menu>
      }
    >
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
    </Dropdown>
  )
}

const FeedMenuGroup = ({
  categoryId,
  onEditFeed,
  onRefreshFeed,
  onMarkAllAsRead,
  onDeleteFeed,
}) => {
  const { showUnreadFeedsOnly, compactSidebarGroups } = useStore(settingsState)
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
      style={compactSidebarGroups ? { maxHeight: 400 } : {}}
      scrollableNodeProps={{
        ref: scrollableNodeRef,
        style: { minHeight: "40px" },
      }}
    >
      <Virtualizer overscan={10} scrollRef={scrollableNodeRef}>
        {filteredFeeds.map((feed) => (
          <FeedMenuItem
            key={feed.id}
            feed={feed}
            onDeleteFeed={onDeleteFeed}
            onEditFeed={onEditFeed}
            onMarkAllAsRead={onMarkAllAsRead}
            onRefreshFeed={onRefreshFeed}
          />
        ))}
      </Virtualizer>
    </SimpleBar>
  )
}

const CategoryGroup = ({
  onEditCategory,
  onRefreshCategory,
  onMarkAllAsReadCategory,
  onDeleteCategory,
  onEditFeed,
  onRefreshFeed,
  onMarkAllAsReadFeed,
  onDeleteFeed,
}) => {
  const { showUnreadFeedsOnly } = useStore(settingsState)
  const feedsGroupedById = useStore(feedsGroupedByIdState)
  const filteredCategories = useStore(filteredCategoriesState)

  const location = useLocation()
  const currentPath = location.pathname

  return filteredCategories
    .filter((category) => {
      const feedsInCategory = feedsGroupedById[category.id]

      // If the category does not have a feed
      if (!feedsInCategory || feedsInCategory.length === 0) {
        // Display empty categories only if it is not "Show Unread Only" mode
        return !showUnreadFeedsOnly
      }

      // If there is a feed, filter by settings
      return feedsInCategory.some((feed) => {
        if (showUnreadFeedsOnly) {
          return feed.unreadCount > 0
        }
        return true
      })
    })
    .map((category) => (
      <Collapse.Item
        key={category.id}
        expandIcon={<IconRight />}
        name={`/category/${category.id}`}
        style={{ position: "relative", overflow: "hidden" }}
        header={
          <CategoryTitle
            category={category}
            path={currentPath}
            onDeleteCategory={onDeleteCategory}
            onEditCategory={onEditCategory}
            onMarkAllAsRead={onMarkAllAsReadCategory}
            onRefreshCategory={onRefreshCategory}
          />
        }
      >
        <FeedMenuGroup
          categoryId={category.id}
          onDeleteFeed={onDeleteFeed}
          onEditFeed={onEditFeed}
          onMarkAllAsRead={onMarkAllAsReadFeed}
          onRefreshFeed={onRefreshFeed}
        />
      </Collapse.Item>
    ))
}

const readFileAsText = async (file) => {
  try {
    return await file.text()
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
}

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  globalThis.URL.revokeObjectURL(url)
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
            <MenuItem key="3" onClick={() => document.querySelector("#opmlInput").click()}>
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

const updateAllEntriesAsRead = () => {
  setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })))
}

const Sidebar = () => {
  const { isCoreDataReady } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const expandedCategories = useStore(expandedCategoriesState)

  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [feedModalVisible, setFeedModalVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedFeed, setSelectedFeed] = useState(null)
  const [categoryForm] = Form.useForm()
  const [feedForm] = Form.useForm()

  const { refreshSingleFeed, handleDeleteFeed, markFeedAsRead } = useFeedOperations(true)
  const { handleDeleteCategory } = useCategoryOperations(true)

  const location = useLocation()
  const currentPath = location.pathname
  const selectedKeys = useMemo(() => [currentPath], [currentPath])

  const { fetchCounters } = useAppData()
  const { infoFrom, infoId } = useStore(contentState)

  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setCategoryModalVisible(true)
    categoryForm.setFieldsValue({
      title: category.title,
      hidden: category.hide_globally,
    })
  }

  const handleRefreshCategory = async (category) => {
    try {
      await refreshCategoryFeed(category.id)
      Notification.success({
        title: polyglot.t("sidebar.refresh_category_success"),
      })
      await fetchCounters()
    } catch {
      Notification.error({
        title: polyglot.t("sidebar.refresh_category_error"),
      })
    }
  }

  const handleMarkAllAsReadCategory = async (category) => {
    try {
      await markCategoryAsRead(category.id)
      const feedsGroupedById = feedsGroupedByIdState.get()
      const feedsInCategory = feedsGroupedById[category.id] || []

      setUnreadInfo((prevUnreadInfo) => {
        const newUnreadInfo = { ...prevUnreadInfo }
        for (const feed of feedsInCategory) {
          newUnreadInfo[feed.id] = 0
        }
        return newUnreadInfo
      })

      if (
        (infoFrom === "category" && category.id === Number(infoId)) ||
        (infoFrom === "feed" && feedsInCategory.some((feed) => feed.id === Number(infoId)))
      ) {
        updateAllEntriesAsRead()
      }

      Notification.success({
        title: polyglot.t("article_list.mark_all_as_read_success"),
      })
    } catch {
      Notification.error({
        title: polyglot.t("article_list.mark_all_as_read_error"),
      })
    }
  }

  const handleEditFeed = (feed) => {
    setSelectedFeed(feed)
    setFeedModalVisible(true)
    feedForm.setFieldsValue({
      title: feed.title,
      categoryId: feed.category.id,
      siteUrl: feed.site_url,
      feedUrl: feed.feed_url,
      hidden: feed.hide_globally,
      disabled: feed.disabled,
      crawler: feed.crawler,
    })
  }

  const handleRefreshFeed = async (feed) => {
    await refreshSingleFeed(feed)
    await fetchCounters()
  }

  const handleMarkAllAsReadFeed = async (feed) => {
    await markFeedAsRead(feed)
  }

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
              <CategoryGroup
                onDeleteCategory={handleDeleteCategory}
                onDeleteFeed={handleDeleteFeed}
                onEditCategory={handleEditCategory}
                onEditFeed={handleEditFeed}
                onMarkAllAsReadCategory={handleMarkAllAsReadCategory}
                onMarkAllAsReadFeed={handleMarkAllAsReadFeed}
                onRefreshCategory={handleRefreshCategory}
                onRefreshFeed={handleRefreshFeed}
              />
            </Collapse>
          )}
        </Menu>
      </SimpleBar>

      {selectedCategory && (
        <EditCategoryModal
          categoryForm={categoryForm}
          selectedCategory={selectedCategory}
          setVisible={setCategoryModalVisible}
          useNotification={true}
          visible={categoryModalVisible}
        />
      )}

      {selectedFeed && (
        <EditFeedModal
          feedForm={feedForm}
          selectedFeed={selectedFeed}
          setVisible={setFeedModalVisible}
          useNotification={true}
          visible={feedModalVisible}
        />
      )}
    </div>
  )
}

export default Sidebar
