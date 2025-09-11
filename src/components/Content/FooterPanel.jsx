import { Button, Notification, Popconfirm, Radio } from "@arco-design/web-react"
import {
  IconAlignLeft,
  IconCheck,
  IconRecord,
  IconRefresh,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import {
  getAllEntries,
  getCategoryEntries,
  getCounters,
  getFeedEntries,
  updateEntriesStatus,
} from "@/apis"
import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setEntries } from "@/store/contentState"
import { dataState, setUnreadInfo, setUnreadTodayCount } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import "./FooterPanel.css"

const updateAllEntriesAsRead = () => {
  setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })))
}

const handleFilterChange = (value) => {
  updateSettings({ showStatus: value })
}

const FooterPanel = ({ info, refreshArticleList, markAllAsRead }) => {
  const { filterDate, isArticleListReady } = useStore(contentState)
  const { feedsData } = useStore(dataState)
  const { showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const handleMarkAllAsRead = async () => {
    try {
      await (filterDate && info.from !== "today" ? handleFilteredMarkAsRead() : markAllAsRead())

      await updateUIAfterMarkAsRead()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      Notification.error({
        title: polyglot.t("article_list.mark_all_as_read_error"),
        content: error.message,
      })
    }
  }

  const handleFilteredMarkAsRead = async () => {
    const starred = showStatus === "starred"

    const entryFetchers = {
      all: (status, options) => getAllEntries(status, options),
      feed: (status, options) => getFeedEntries(info.id, status, starred, options),
      category: (status, options) => getCategoryEntries(info.id, status, starred, options),
    }

    const fetchEntries = entryFetchers[info.from]
    let unreadResponse = await fetchEntries("unread")
    const unreadCount = unreadResponse.total
    let unreadEntries = unreadResponse.entries

    if (unreadCount > unreadEntries.length) {
      const fullResponse = await fetchEntries("unread", { limit: unreadCount })
      unreadEntries = fullResponse.entries
    }

    if (unreadEntries.length > 0) {
      const unreadEntryIds = unreadEntries.map((entry) => entry.id)
      await updateEntriesStatus(unreadEntryIds, "read")
    }
  }

  const updateUIAfterMarkAsRead = async () => {
    updateAllEntriesAsRead()

    const countersData = await getCounters()
    const unreadInfo = {}
    for (const feed of feedsData) {
      unreadInfo[feed.id] = countersData.unreads[feed.id] ?? 0
    }

    setUnreadInfo(unreadInfo)

    if (info.from === "today") {
      setUnreadTodayCount(0)
    }

    Notification.success({
      title: polyglot.t("article_list.mark_all_as_read_success"),
    })
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
        {isSelected && <span style={{ marginLeft: "4px" }}>{option.label}</span>}
      </Radio>
    )
  }

  useEffect(() => {
    if (info.from === "starred" && showStatus !== "unread") {
      updateSettings({ showStatus: "all" })
    }
  }, [info.from, showStatus])

  return (
    <div className="entry-panel">
      <Popconfirm
        focusLock
        title={polyglot.t("article_list.mark_all_as_read_confirm")}
        onOk={handleMarkAllAsRead}
      >
        <CustomTooltip mini content={polyglot.t("article_list.mark_all_as_read_tooltip")}>
          <Button
            icon={<IconCheck />}
            shape="circle"
            style={{
              visibility: ["starred", "history"].includes(info.from) ? "hidden" : "visible",
            }}
          />
        </CustomTooltip>
      </Popconfirm>
      <Radio.Group
        style={{ visibility: info.from === "history" ? "hidden" : "visible" }}
        type="button"
        value={showStatus}
        onChange={handleFilterChange}
      >
        {filterOptions.map((option) => renderRadioButton(option))}
      </Radio.Group>
      <CustomTooltip mini content={polyglot.t("article_list.refresh_tooltip")}>
        <Button
          icon={<IconRefresh />}
          loading={!isArticleListReady}
          shape="circle"
          onClick={refreshArticleList}
        />
      </CustomTooltip>
    </div>
  )
}

export default FooterPanel
