import {
  Button,
  DatePicker,
  Dropdown,
  Input,
  Menu,
  Modal,
  Popconfirm,
  Select,
  Tooltip,
  Typography,
} from "@arco-design/web-react"
import {
  IconAlignLeft,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconDown,
  IconQuestionCircle,
  IconRecord,
  IconRefresh,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { atom } from "nanostores"
import { Fragment, memo, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router"

import SidebarTrigger from "./SidebarTrigger.jsx"

import {
  getAllEntries,
  getCategoryEntries,
  getCounters,
  getFeedEntries,
  getTodayEntries,
  updateEntriesStatus,
} from "@/apis"
import DoubleCheck from "@/components/icons/DoubleCheck"
import { LayoutColumnIcon, LayoutExpandedIcon } from "@/components/icons/LayoutModeIcons"
import CustomTooltip from "@/components/ui/CustomTooltip"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  dynamicCountState,
  nextContentState,
  prevContentState,
  setEntries,
  setFilterDate,
  setFilterString,
  setFilterType,
} from "@/store/contentState"
import {
  categoriesState,
  dataState,
  feedsState,
  setUnreadInfo,
  setUnreadTodayCount,
} from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { get24HoursAgoTimestamp, getStartOfToday } from "@/utils/date"
import { Notification } from "@/utils/feedback"
import createSetter from "@/utils/nanostores"

import "./SearchAndSortBar.css"

const draftFilterTypeState = atom("title")
const setDraftFilterType = createSetter(draftFilterTypeState)

const SearchModal = memo(({ value, visible, onCancel, onConfirm, onChange }) => {
  const draftFilterType = useStore(draftFilterTypeState)
  const { polyglot } = useStore(polyglotState)
  const tooltipLines = polyglot.t("search.tooltip").split("\n")

  const handleConfirm = () => {
    setFilterType(draftFilterType)
    onConfirm(value)
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleConfirm()
    }
  }

  return (
    <Modal
      className="search-modal"
      title={polyglot.t("search.search")}
      visible={visible}
      footer={
        <>
          <Button onClick={onCancel}>{polyglot.t("search.cancel")}</Button>
          <Button type="primary" onClick={handleConfirm}>
            {polyglot.t("search.confirm")}
          </Button>
        </>
      }
      onCancel={onCancel}
    >
      <div className="search-modal-content">
        <Input.Search
          allowClear
          placeholder={polyglot.t("search.placeholder")}
          value={value}
          addBefore={
            <Select
              style={{ width: "auto" }}
              value={draftFilterType}
              triggerProps={{
                autoAlignPopupWidth: false,
                autoAlignPopupMinWidth: true,
                position: "bl",
              }}
              onChange={setDraftFilterType}
            >
              <Select.Option value="title">{polyglot.t("search.type_title")}</Select.Option>
              <Select.Option value="content">{polyglot.t("search.type_content")}</Select.Option>
              <Select.Option value="author">{polyglot.t("search.type_author")}</Select.Option>
            </Select>
          }
          prefix={
            <Tooltip
              mini
              content={
                <div>
                  {tooltipLines.map((line, index) => (
                    <Fragment key={`tooltip-line-${index}`}>
                      {line}
                      {index < tooltipLines.length - 1 && <br />}
                    </Fragment>
                  ))}
                </div>
              }
            >
              <IconQuestionCircle />
            </Tooltip>
          }
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </Modal>
  )
})
SearchModal.displayName = "SearchModal"

const ActiveButton = ({ active, icon, tooltip, onClick }) => (
  <CustomTooltip mini content={tooltip}>
    <Button
      icon={icon}
      shape="circle"
      size="small"
      style={{
        backgroundColor: active ? "rgb(var(--primary-6))" : "inherit",
      }}
      onClick={onClick}
    />
  </CustomTooltip>
)

const ToolbarActionButton = ({ active = false, icon, label, tooltip, onClick, className = "" }) => (
  <CustomTooltip mini content={tooltip}>
    <Button
      className={`toolbar-action-button ${active ? "is-active" : ""} ${className}`.trim()}
      size="small"
      type="text"
      onClick={onClick}
    >
      <span className="toolbar-button-label">
        {icon}
        <span>{label}</span>
      </span>
    </Button>
  </CustomTooltip>
)

const ToolbarMenuButton = ({ icon, label, tooltip, children, className = "" }) => (
  <Dropdown
    droplist={<Menu className="toolbar-dropdown-menu">{children}</Menu>}
    position="bl"
    trigger="click"
  >
    <CustomTooltip mini content={tooltip}>
      <Button
        className={`toolbar-action-button toolbar-menu-button ${className}`.trim()}
        size="small"
        type="text"
      >
        <span className="toolbar-button-label">
          {icon}
          <span>{label}</span>
          <span className="toolbar-button-caret-wrap">
            <IconDown className="toolbar-button-caret" />
          </span>
        </span>
      </Button>
    </CustomTooltip>
  </Dropdown>
)

const LayoutModeSelect = ({ layoutMode, layoutOptions }) => (
  <Select
    className="layout-mode-select"
    value={layoutMode}
    triggerProps={{
      autoAlignPopupMinWidth: true,
      autoAlignPopupWidth: false,
      position: "bl",
    }}
    onChange={(value) => updateSettings({ layoutMode: value })}
  >
    {layoutOptions.map((option) => (
      <Select.Option key={option.value} value={option.value}>
        <span className="layout-mode-option">
          {option.icon}
          <span>{option.label}</span>
        </span>
      </Select.Option>
    ))}
  </Select>
)

const getUnixSecondsFromDateString = (dateString) => {
  if (!dateString) {
    return null
  }
  if (/^\d+$/.test(dateString)) {
    return Number(dateString)
  }
  const timeMs = Date.parse(dateString)
  return Number.isFinite(timeMs) ? Math.floor(timeMs / 1000) : null
}

const fetchAllUnreadEntries = async (fetchEntries) => {
  let unreadResponse = await fetchEntries()
  const unreadCount = unreadResponse.total
  let unreadEntries = unreadResponse.entries

  if (unreadCount > unreadEntries.length) {
    const fullResponse = await fetchEntries({ limit: unreadCount })
    unreadEntries = fullResponse.entries
  }

  return unreadEntries
}

const updateEntriesAsRead = (publishedBeforeUnix = null) => {
  setEntries((prev) =>
    prev.map((entry) => {
      if (publishedBeforeUnix == null) {
        return { ...entry, status: "read" }
      }

      const publishedAtUnix = getUnixSecondsFromDateString(entry.published_at)
      if (publishedAtUnix != null && publishedAtUnix <= publishedBeforeUnix) {
        return { ...entry, status: "read" }
      }

      return entry
    }),
  )
}

const MarkReadControl = ({ info, markAllAsRead, variant = "classic" }) => {
  const { filterDate } = useStore(contentState)
  const { feedsData } = useStore(dataState)
  const { showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const MenuItem = Menu.Item

  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const confirmTitle = useMemo(() => {
    if (pendingAction === "all" && info.from === "today") {
      return polyglot.t("article_list.mark_today_as_read_confirm")
    }

    switch (pendingAction) {
      case "older-day": {
        return polyglot.t("article_list.mark_older_than_day_confirm")
      }
      case "older-2-days": {
        return polyglot.t("article_list.mark_older_than_two_days_confirm")
      }
      case "older-3-days": {
        return polyglot.t("article_list.mark_older_than_three_days_confirm")
      }
      case "older-week": {
        return polyglot.t("article_list.mark_older_than_week_confirm")
      }
      case "older-2-weeks": {
        return polyglot.t("article_list.mark_older_than_two_weeks_confirm")
      }
      case "all": {
        return polyglot.t("article_list.mark_all_as_read_confirm")
      }
      default: {
        return ""
      }
    }
  }, [info.from, pendingAction, polyglot])

  const updateUIAfterMarkAsRead = async (publishedBeforeUnix = null, successMessageKey) => {
    updateEntriesAsRead(publishedBeforeUnix)

    const countersData = await getCounters()
    const unreadInfo = {}
    for (const feed of feedsData) {
      unreadInfo[feed.id] = countersData.unreads[feed.id] ?? 0
    }

    setUnreadInfo(unreadInfo)

    if (info.from === "today" && publishedBeforeUnix == null) {
      setUnreadTodayCount(0)
    }

    Notification.success({
      title: successMessageKey
        ? polyglot.t(successMessageKey)
        : polyglot.t("article_list.mark_all_as_read_success"),
    })
  }

  const handleFilteredMarkAsRead = async () => {
    const starred = showStatus === "starred"
    const entryFetchers = {
      all: (status, options) => getAllEntries(status, options),
      feed: (status, options) => getFeedEntries(info.id, status, starred, options),
      category: (status, options) => getCategoryEntries(info.id, status, starred, options),
    }

    const fetchEntries = entryFetchers[info.from]
    const unreadEntries = await fetchAllUnreadEntries((options = {}) =>
      fetchEntries("unread", options),
    )

    if (unreadEntries.length > 0) {
      await updateEntriesStatus(
        unreadEntries.map((entry) => entry.id),
        "read",
      )
    }
  }

  const handleMarkAllEntriesAsRead = async () => {
    try {
      await (filterDate && info.from !== "today" ? handleFilteredMarkAsRead() : markAllAsRead())
      await updateUIAfterMarkAsRead(null, "article_list.mark_all_as_read_success")
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      Notification.error({
        title: polyglot.t("article_list.mark_all_as_read_error"),
        content: error.message,
      })
    }
  }

  const handleMarkOlderThanAsRead = async (publishedBeforeUnix, successMessageKey) => {
    try {
      const starred = showStatus === "starred"
      const entryFetchers = {
        all: (options = {}) =>
          getAllEntries("unread", { published_before: publishedBeforeUnix, ...options }),
        today: (options = {}) =>
          getTodayEntries("unread", { published_before: publishedBeforeUnix, ...options }),
        feed: (options = {}) =>
          getFeedEntries(info.id, "unread", starred, {
            published_before: publishedBeforeUnix,
            ...options,
          }),
        category: (options = {}) =>
          getCategoryEntries(info.id, "unread", starred, {
            published_before: publishedBeforeUnix,
            ...options,
          }),
      }

      const fetchEntries = entryFetchers[info.from]
      if (!fetchEntries) {
        return
      }

      const unreadEntries = await fetchAllUnreadEntries(fetchEntries)
      if (unreadEntries.length > 0) {
        await updateEntriesStatus(
          unreadEntries.map((entry) => entry.id),
          "read",
        )
      }

      await updateUIAfterMarkAsRead(publishedBeforeUnix, successMessageKey)
    } catch (error) {
      console.error("Failed to mark older entries as read:", error)
      Notification.error({
        title: polyglot.t("article_list.mark_all_as_read_error"),
        content: error.message,
      })
    }
  }

  const openConfirm = (action) => {
    setPendingAction(action)
    setDropdownVisible(false)
    setConfirmVisible(true)
  }

  const handleConfirmOk = () => {
    if (pendingAction === "older-day") {
      return handleMarkOlderThanAsRead(
        get24HoursAgoTimestamp(),
        "article_list.mark_older_than_day_success",
      )
    }
    if (pendingAction === "older-2-days") {
      return handleMarkOlderThanAsRead(
        Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60,
        "article_list.mark_older_than_two_days_success",
      )
    }
    if (pendingAction === "older-3-days") {
      return handleMarkOlderThanAsRead(
        Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
        "article_list.mark_older_than_three_days_success",
      )
    }
    if (pendingAction === "older-week") {
      return handleMarkOlderThanAsRead(
        Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
        "article_list.mark_older_than_week_success",
      )
    }
    if (pendingAction === "older-2-weeks") {
      return handleMarkOlderThanAsRead(
        Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60,
        "article_list.mark_older_than_two_weeks_success",
      )
    }
    return handleMarkAllEntriesAsRead()
  }

  const handleConfirmVisibleChange = (visible) => {
    if (!visible) {
      setConfirmVisible(false)
      setPendingAction(null)
    }
  }

  if (["starred", "history"].includes(info.from)) {
    return null
  }

  if (info.from === "today") {
    return (
      <Popconfirm
        focusLock
        popupVisible={confirmVisible}
        title={confirmTitle}
        triggerProps={{ disabled: true }}
        onOk={handleConfirmOk}
        onVisibleChange={handleConfirmVisibleChange}
      >
        <CustomTooltip mini content={polyglot.t("article_list.mark_today_as_read_tooltip")}>
          <Button
            icon={<DoubleCheck />}
            shape="circle"
            size="small"
            onClick={() => openConfirm("all")}
          />
        </CustomTooltip>
      </Popconfirm>
    )
  }

  return (
    <Dropdown
      popupVisible={dropdownVisible}
      position="bl"
      trigger="click"
      droplist={
        <Menu>
          <MenuItem key="older-than-day" onClick={() => openConfirm("older-day")}>
            <DoubleCheck className="icon-right" />
            {polyglot.t("article_list.mark_as_read_menu_older_day")}
          </MenuItem>
          <MenuItem key="older-than-two-days" onClick={() => openConfirm("older-2-days")}>
            <DoubleCheck className="icon-right" />
            {polyglot.t("article_list.mark_as_read_menu_older_two_days")}
          </MenuItem>
          <MenuItem key="older-than-three-days" onClick={() => openConfirm("older-3-days")}>
            <DoubleCheck className="icon-right" />
            {polyglot.t("article_list.mark_as_read_menu_older_three_days")}
          </MenuItem>
          <MenuItem key="older-than-week" onClick={() => openConfirm("older-week")}>
            <DoubleCheck className="icon-right" />
            {polyglot.t("article_list.mark_as_read_menu_older_week")}
          </MenuItem>
          <MenuItem key="older-than-two-weeks" onClick={() => openConfirm("older-2-weeks")}>
            <DoubleCheck className="icon-right" />
            {polyglot.t("article_list.mark_as_read_menu_older_two_weeks")}
          </MenuItem>
          <MenuItem key="mark-all-as-read" onClick={() => openConfirm("all")}>
            <DoubleCheck className="icon-right" />
            {polyglot.t("article_list.mark_all_as_read_tooltip")}
          </MenuItem>
        </Menu>
      }
      onVisibleChange={setDropdownVisible}
    >
      <Popconfirm
        focusLock
        popupVisible={confirmVisible}
        title={confirmTitle}
        triggerProps={{ disabled: true }}
        onOk={handleConfirmOk}
        onVisibleChange={handleConfirmVisibleChange}
      >
        <CustomTooltip mini content={polyglot.t("article_list.mark_as_read_options_tooltip")}>
          {variant === "stream" ? (
            <Button
              className="toolbar-action-button toolbar-menu-button toolbar-icon-menu-button"
              size="small"
              type="text"
            >
              <span className="toolbar-button-label">
                <DoubleCheck />
                <span className="toolbar-button-caret-wrap">
                  <IconDown className="toolbar-button-caret" />
                </span>
              </span>
            </Button>
          ) : (
            <Button icon={<DoubleCheck />} shape="circle" size="small" />
          )}
        </CustomTooltip>
      </Popconfirm>
    </Dropdown>
  )
}

const SearchAndSortBar = ({ info, markAllAsRead, refreshArticleList, variant = "classic" }) => {
  const { activeContent, filterDate, filterString, filterType, infoFrom, isArticleListReady } =
    useStore(contentState)
  const { layoutMode, orderDirection, showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const feeds = useStore(feedsState)
  const categories = useStore(categoriesState)
  const dynamicCount = useStore(dynamicCountState)
  const prevContent = useStore(prevContentState)
  const nextContent = useStore(nextContentState)

  const { id } = useParams()
  const { isBelowMedium } = useScreenWidth()
  const { navigateToNextArticle, navigateToPreviousArticle } = useKeyHandlers()

  const [calendarVisible, setCalendarVisible] = useState(false)
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [modalInputValue, setModalInputValue] = useState("")

  const { title, count } = useMemo(() => {
    if (id) {
      if (infoFrom === "category") {
        const category = categories.find((c) => c.id === Number(id))
        return { title: category?.title, count: dynamicCount }
      }
      if (infoFrom === "feed") {
        const feed = feeds.find((f) => f.id === Number(id))
        return { title: feed?.title, count: dynamicCount }
      }
    }

    const infoMap = {
      all: { key: "sidebar.all", count: dynamicCount },
      today: { key: "sidebar.today", count: dynamicCount },
      starred: { key: "sidebar.starred", count: dynamicCount },
      history: { key: "sidebar.history", count: dynamicCount },
    }

    const info = infoMap[infoFrom] || { key: "", count: 0 }
    return { title: info.key ? polyglot.t(info.key) : "", count: info.count }
  }, [infoFrom, id, categories, feeds, dynamicCount, polyglot])

  const toggleOrderDirection = () => {
    const newOrderDirection = orderDirection === "desc" ? "asc" : "desc"
    updateSettings({ orderDirection: newOrderDirection })
  }

  const openSearchModal = () => {
    setModalInputValue(filterString)
    setDraftFilterType(filterType)
    setSearchModalVisible(true)
  }

  const closeSearchModal = () => {
    setSearchModalVisible(false)
  }

  const handleConfirmSearch = (value) => {
    setFilterString(value)
    closeSearchModal()
  }

  const handleSetToday = () => {
    setFilterDate(getStartOfToday())
    setCalendarVisible(false)
  }

  const handleClearDate = () => {
    setFilterDate(null)
    setCalendarVisible(false)
  }

  const statusOptions = useMemo(() => {
    const options = [
      {
        label: polyglot.t("article_list.filter_status_unread"),
        value: "unread",
        icon: <IconRecord />,
      },
      {
        label: polyglot.t("article_list.filter_status_all"),
        value: "all",
        icon: <IconAlignLeft />,
      },
    ]

    if (["category", "feed"].includes(infoFrom)) {
      options.push({
        label: polyglot.t("article_list.filter_status_starred"),
        value: "starred",
        icon: <IconStarFill />,
      })
    }

    return options
  }, [infoFrom, polyglot])

  const layoutOptions = useMemo(
    () => [
      {
        icon: <LayoutColumnIcon />,
        label: polyglot.t("appearance.layout_mode_classic"),
        value: "classic",
      },
      {
        icon: <LayoutExpandedIcon />,
        label: polyglot.t("appearance.layout_mode_stream"),
        value: "stream",
      },
    ],
    [polyglot],
  )
  const currentStatus =
    statusOptions.find((option) => option.value === showStatus) ?? statusOptions[0]
  const currentLayout =
    layoutOptions.find((option) => option.value === layoutMode) ?? layoutOptions[0]
  const sortDirectionLabel =
    orderDirection === "desc"
      ? polyglot.t("article_list.sort_direction_desc")
      : polyglot.t("article_list.sort_direction_asc")
  const statusControlLabel =
    showStatus === "unread"
      ? polyglot.t("article_list.filter_status_unread_only")
      : showStatus === "all"
        ? polyglot.t("article_list.filter_status_all_items")
        : currentStatus.label
  const sortControlLabel = `${polyglot.t("article_list.sort_label")}: ${sortDirectionLabel}`
  const viewControlLabel = `${polyglot.t("article_list.view_label")}: ${currentLayout.label}`

  useEffect(() => {
    if (infoFrom === "starred" && showStatus === "starred") {
      updateSettings({ showStatus: "all" })
    }
  }, [infoFrom, showStatus])

  if (variant === "stream") {
    return (
      <div className="search-and-sort-bar stream-toolbar" style={{ width: "100%" }}>
        <div className="toolbar-main">
          <SidebarTrigger />
          <div className="stream-nav-group">
            <CustomTooltip mini content={polyglot.t("article_card.previous_tooltip")}>
              <Button
                disabled={!prevContent}
                icon={<IconArrowLeft />}
                shape="circle"
                size="small"
                onClick={navigateToPreviousArticle}
              />
            </CustomTooltip>
            <CustomTooltip mini content={polyglot.t("article_card.next_tooltip")}>
              <Button
                disabled={!nextContent}
                icon={<IconArrowRight />}
                shape="circle"
                size="small"
                onClick={navigateToNextArticle}
              />
            </CustomTooltip>
            <CustomTooltip mini content={polyglot.t("article_list.refresh_tooltip")}>
              <Button
                icon={<IconRefresh />}
                loading={!isArticleListReady}
                shape="circle"
                size="small"
                onClick={refreshArticleList}
              />
            </CustomTooltip>
          </div>
          <div className="page-info">
            <div className="title-container">
              <div className="title-row">
                {title ? (
                  <Tooltip content={title} disabled={isBelowMedium}>
                    <span className="toolbar-title">{title}</span>
                  </Tooltip>
                ) : (
                  <div className="placeholder-title"></div>
                )}
                {isArticleListReady && count > 0 ? (
                  <span className="count-label">({count})</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="button-group">
          <div className="stream-primary-controls">
            <ToolbarActionButton
              active={!!filterString}
              icon={<IconSearch />}
              label={polyglot.t("search.search")}
              tooltip={polyglot.t("search.search")}
              onClick={openSearchModal}
            />
            <div className="stream-mark-read-control">
              <MarkReadControl info={info} markAllAsRead={markAllAsRead} variant="stream" />
            </div>
          </div>
          <div className="stream-secondary-controls">
            <div className="stream-view-control">
              <ToolbarMenuButton
                icon={currentLayout.icon}
                label={viewControlLabel}
                tooltip={viewControlLabel}
              >
                {layoutOptions.map((option) => (
                  <Menu.Item
                    key={option.value}
                    className="toolbar-menu-item"
                    onClick={() => updateSettings({ layoutMode: option.value })}
                  >
                    <span className="toolbar-menu-item-label">
                      {option.icon}
                      <span>
                        {polyglot.t("article_list.view_label")}: {option.label}
                      </span>
                    </span>
                  </Menu.Item>
                ))}
              </ToolbarMenuButton>
            </div>
            {infoFrom === "history" ? null : (
              <ToolbarMenuButton
                className={showStatus === "unread" ? "is-active" : ""}
                icon={currentStatus.icon}
                label={statusControlLabel}
                tooltip={statusControlLabel}
              >
                {statusOptions.map((option) => (
                  <Menu.Item
                    key={option.value}
                    className="toolbar-menu-item"
                    onClick={() => updateSettings({ showStatus: option.value })}
                  >
                    <span className="toolbar-menu-item-label">
                      {option.icon}
                      <span>
                        {option.value === "unread"
                          ? polyglot.t("article_list.filter_status_unread_only")
                          : option.value === "all"
                            ? polyglot.t("article_list.filter_status_all_items")
                            : option.label}
                      </span>
                    </span>
                  </Menu.Item>
                ))}
              </ToolbarMenuButton>
            )}
            <ToolbarMenuButton
              icon={orderDirection === "desc" ? <IconSortDescending /> : <IconSortAscending />}
              label={sortControlLabel}
              tooltip={sortDirectionLabel}
            >
              <Menu.Item
                key="desc"
                className="toolbar-menu-item"
                onClick={() => updateSettings({ orderDirection: "desc" })}
              >
                <span className="toolbar-menu-item-label">
                  <IconSortDescending />
                  <span>
                    {polyglot.t("article_list.sort_label")}:{" "}
                    {polyglot.t("article_list.sort_direction_desc")}
                  </span>
                </span>
              </Menu.Item>
              <Menu.Item
                key="asc"
                className="toolbar-menu-item"
                onClick={() => updateSettings({ orderDirection: "asc" })}
              >
                <span className="toolbar-menu-item-label">
                  <IconSortAscending />
                  <span>
                    {polyglot.t("article_list.sort_label")}:{" "}
                    {polyglot.t("article_list.sort_direction_asc")}
                  </span>
                </span>
              </Menu.Item>
            </ToolbarMenuButton>
          </div>
        </div>
        <SearchModal
          value={modalInputValue}
          visible={searchModalVisible}
          onCancel={closeSearchModal}
          onChange={setModalInputValue}
          onConfirm={handleConfirmSearch}
        />
      </div>
    )
  }

  return (
    <div className="search-and-sort-bar classic-toolbar" style={{ width: "100%" }}>
      <SidebarTrigger />
      <div className="page-info">
        <div className="title-container">
          {title ? (
            <Typography.Ellipsis
              expandable={false}
              showTooltip={!isBelowMedium}
              style={{ fontWeight: 500 }}
            >
              {title}
            </Typography.Ellipsis>
          ) : (
            <div className="placeholder-title"></div>
          )}
        </div>
        {isArticleListReady && count > 0 && (
          <Typography.Text className="count-label">({count})</Typography.Text>
        )}
      </div>
      <div className="layout-selector-slot">
        <LayoutModeSelect layoutMode={layoutMode} layoutOptions={layoutOptions} />
      </div>
      <div className="button-group">
        <ActiveButton
          active={!!filterString}
          icon={<IconSearch />}
          tooltip={polyglot.t("search.search")}
          onClick={openSearchModal}
        />
        <DatePicker
          popupVisible={calendarVisible}
          position="bottom"
          showNowBtn={false}
          value={filterDate}
          extra={
            <div className="calendar-actions">
              <Button long size="mini" type="primary" onClick={handleSetToday}>
                {polyglot.t("search.today")}
              </Button>
              <Button long size="mini" onClick={handleClearDate}>
                {polyglot.t("search.clear_date")}
              </Button>
            </div>
          }
          triggerElement={
            <CustomTooltip mini content={polyglot.t("search.select_date")}>
              <Button
                icon={<IconCalendar />}
                shape="circle"
                size="small"
                style={{
                  backgroundColor: filterDate ? "rgb(var(--primary-6))" : "inherit",
                }}
              />
            </CustomTooltip>
          }
          onChange={(v) => setFilterDate(v)}
          onVisibleChange={setCalendarVisible}
        />
        <CustomTooltip
          mini
          content={
            orderDirection === "desc"
              ? polyglot.t("article_list.sort_direction_desc")
              : polyglot.t("article_list.sort_direction_asc")
          }
        >
          <Button
            icon={orderDirection === "desc" ? <IconSortDescending /> : <IconSortAscending />}
            shape="circle"
            size="small"
            onClick={toggleOrderDirection}
          />
        </CustomTooltip>
      </div>
      <SearchModal
        value={modalInputValue}
        visible={searchModalVisible}
        onCancel={closeSearchModal}
        onChange={setModalInputValue}
        onConfirm={handleConfirmSearch}
      />
    </div>
  )
}

export default SearchAndSortBar
