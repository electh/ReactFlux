import { Button, Dropdown, Menu, Popconfirm, Radio } from "@arco-design/web-react"
import { IconAlignLeft, IconRecord, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useMemo, useState } from "react"

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
import { contentState, setEntries } from "@/store/contentState"
import { dataState, setUnreadInfo, setUnreadTodayCount } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { get24HoursAgoTimestamp } from "@/utils/date"
import { Notification } from "@/utils/feedback"
import "./FooterPanel.css"

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

const handleFilterChange = (value) => {
  updateSettings({ showStatus: value })
}

const FooterPanel = ({ info, markAllAsRead }) => {
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
  }, [pendingAction, polyglot, info.from])

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

    const successTitle = successMessageKey
      ? polyglot.t(successMessageKey)
      : polyglot.t("article_list.mark_all_as_read_success")

    Notification.success({
      title: successTitle,
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
      const unreadEntryIds = unreadEntries.map((entry) => entry.id)
      await updateEntriesStatus(unreadEntryIds, "read")
    }
  }

  const handleMarkAllAsRead = async () => {
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
        const unreadEntryIds = unreadEntries.map((entry) => entry.id)
        await updateEntriesStatus(unreadEntryIds, "read")
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
    return handleMarkAllAsRead()
  }

  const handleConfirmVisibleChange = (visible) => {
    if (!visible) {
      setConfirmVisible(false)
      setPendingAction(null)
    }
  }

  const baseFilterOptions = [
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

  const starredOption = {
    label: polyglot.t("article_list.filter_status_starred"),
    value: "starred",
    icon: <IconStarFill />,
  }

  const filterOptions = ["category", "feed"].includes(info.from)
    ? [starredOption, ...baseFilterOptions]
    : baseFilterOptions

  const renderRadioButton = (option) => {
    const isSelected = showStatus === option.value
    return (
      <Radio value={option.value}>
        {option.icon}
        {isSelected ? <span style={{ marginLeft: "4px" }}>{option.label}</span> : null}
      </Radio>
    )
  }

  return (
    <div className="entry-panel">
      {info.from === "today" ? (
        <Popconfirm
          focusLock
          popupVisible={confirmVisible}
          title={confirmTitle}
          triggerProps={{ disabled: true }}
          onOk={handleConfirmOk}
          onVisibleChange={handleConfirmVisibleChange}
        >
          <CustomTooltip mini content={polyglot.t("article_list.mark_today_as_read_tooltip")}>
            <Button icon={<DoubleCheck />} shape="circle" onClick={() => openConfirm("all")} />
          </CustomTooltip>
        </Popconfirm>
      ) : (
        <Dropdown
          popupVisible={dropdownVisible}
          position="tr"
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
              <Button
                icon={<DoubleCheck />}
                shape="circle"
                style={{
                  visibility: ["starred", "history"].includes(info.from) ? "hidden" : "visible",
                }}
              />
            </CustomTooltip>
          </Popconfirm>
        </Dropdown>
      )}

      <Radio.Group
        style={{ visibility: info.from === "history" ? "hidden" : "visible" }}
        type="button"
        value={showStatus}
        onChange={handleFilterChange}
      >
        {filterOptions.map((option) => renderRadioButton(option))}
      </Radio.Group>
    </div>
  )
}

export default FooterPanel
