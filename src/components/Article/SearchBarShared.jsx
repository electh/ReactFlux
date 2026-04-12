import {
  Button,
  Dropdown,
  Input,
  Menu,
  Modal,
  Popconfirm,
  Select,
  Tooltip,
} from "@arco-design/web-react"
import { IconDown, IconQuestionCircle } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { Fragment, memo, useMemo, useState } from "react"

import {
  getAllEntries,
  getCategoryEntries,
  getCounters,
  getFeedEntries,
  getTodayEntries,
  updateEntriesStatus,
} from "@/apis"
import DoubleCheck from "@/components/icons/DoubleCheck"
import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setEntries, setFilterType } from "@/store/contentState"
import { dataState, setUnreadInfo, setUnreadTodayCount } from "@/store/dataState"
import { draftFilterTypeState } from "@/store/searchBarState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { get24HoursAgoTimestamp } from "@/utils/date"
import { Notification } from "@/utils/feedback"

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

export const SearchModal = memo(({ value, visible, onCancel, onConfirm, onChange }) => {
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
              onChange={(v) => draftFilterTypeState.set(v)}
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

export const ActiveButton = ({ active, icon, tooltip, onClick }) => (
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

export const ToolbarActionButton = ({
  active = false,
  icon,
  label,
  tooltip,
  onClick,
  className = "",
  ariaLabel = label,
}) => (
  <CustomTooltip mini content={tooltip}>
    <Button
      aria-label={ariaLabel}
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

export const ToolbarMenuButton = ({
  icon,
  label,
  tooltip,
  children,
  className = "",
  ariaLabel = label,
}) => (
  <Dropdown
    droplist={<Menu className="toolbar-dropdown-menu">{children}</Menu>}
    position="bl"
    trigger="click"
  >
    <CustomTooltip mini content={tooltip}>
      <Button
        aria-label={ariaLabel}
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

export const LayoutModeSelect = ({ layoutMode, layoutOptions }) => (
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

export const MarkReadControl = ({ info, markAllAsRead, variant = "classic" }) => {
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
          {variant === "stream" ? (
            <Button
              aria-label={polyglot.t("article_list.mark_today_as_read_tooltip")}
              className="toolbar-action-button toolbar-icon-action-button"
              size="small"
              type="text"
              onClick={() => openConfirm("all")}
            >
              <span className="toolbar-button-label">
                <DoubleCheck />
              </span>
            </Button>
          ) : (
            <Button
              icon={<DoubleCheck />}
              shape="circle"
              size="small"
              onClick={() => openConfirm("all")}
            />
          )}
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
              aria-label={polyglot.t("article_list.mark_as_read_options_tooltip")}
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
