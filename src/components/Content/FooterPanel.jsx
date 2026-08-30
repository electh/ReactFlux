import { Button, Notification, Popconfirm, Radio } from "@arco-design/web-react"
import {
  IconAlignLeft,
  IconCheck,
  IconRecord,
  IconRefresh,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

import {
  getAllEntries,
  getCategoryEntries,
  getFeedEntries,
  getStarredEntries,
  markEntriesAsReadInBatches,
} from "@/apis"
import CustomTooltip from "@/components/ui/CustomTooltip"
import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setActiveContent, setEntries } from "@/store/contentState"
import { filteredCategoriesState, filteredFeedsState } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import findAdjacentItem from "@/utils/navigation"
import "./FooterPanel.css"

const updateAllEntriesAsRead = () => {
  const { activeContent } = contentState.get()
  if (activeContent) {
    setActiveContent({ ...activeContent, status: "read" })
  }
  setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })))
}

const handleFilterChange = (value) => {
  updateSettings({ showStatus: value })
}

const MarkAllReadButton = ({ from, onConfirm }) => {
  const { polyglot } = useStore(polyglotState)
  const { skipMarkAllReadConfirmation } = useStore(settingsState)

  const isHidden = from === "history"
  const markAllReadLabel = polyglot.t("article_list.mark_all_as_read_tooltip")
  const [confirmVisible, setConfirmVisible] = useState(false)

  const button = (
    <CustomTooltip mini content={markAllReadLabel}>
      <Button
        aria-expanded={skipMarkAllReadConfirmation ? undefined : confirmVisible}
        aria-label={markAllReadLabel}
        icon={<IconCheck aria-hidden="true" />}
        shape="circle"
        style={{ visibility: isHidden ? "hidden" : "visible" }}
        onClick={skipMarkAllReadConfirmation ? onConfirm : undefined}
      />
    </CustomTooltip>
  )

  if (skipMarkAllReadConfirmation) {
    return button
  }

  return (
    <Popconfirm
      autoFocus
      focusLock
      className="mark-all-read-popconfirm"
      popupVisible={confirmVisible}
      title={polyglot.t("article_list.mark_all_as_read_confirm")}
      triggerProps={{
        boundaryDistance: { bottom: 8, left: 8, right: 8, top: 8 },
      }}
      onOk={onConfirm}
      onVisibleChange={setConfirmVisible}
    >
      {button}
    </Popconfirm>
  )
}

const FooterPanel = ({ info, refreshArticleList, markAllAsRead }) => {
  const { from: source, id: sourceId } = info
  const { filterDate, isArticleListReady } = useStore(contentState)
  const { markAllReadJumpToNext, showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const filteredCategories = useStore(filteredCategoriesState)
  const filteredFeeds = useStore(filteredFeedsState)
  const { refreshCounts } = useAppData()
  const navigate = useNavigate()
  const refreshLabel = polyglot.t("article_list.refresh_tooltip")

  const jumpToNext = () => {
    if (source === "category") {
      const currentIndex = filteredCategories.findIndex(
        (category) => category.id === Number(sourceId),
      )
      const next = findAdjacentItem(filteredCategories, currentIndex, "next", {
        predicate: (category) => category.unreadCount > 0,
        wrap: true,
      })
      if (next) {
        navigate(`/category/${next.id}`)
      }
    } else if (source === "feed") {
      const orderedFeeds = filteredCategories.flatMap((cat) =>
        filteredFeeds.filter((f) => f.category.id === cat.id),
      )
      const currentIndex = orderedFeeds.findIndex((feed) => feed.id === Number(sourceId))
      const next = findAdjacentItem(orderedFeeds, currentIndex, "next", {
        predicate: (feed) => feed.unreadCount > 0,
        wrap: true,
      })
      if (next) {
        navigate(`/feed/${next.id}`)
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await (filterDate && source !== "today" ? handleFilteredMarkAsRead() : markAllAsRead())

      await updateUIAfterMarkAsRead()

      if (markAllReadJumpToNext) {
        jumpToNext()
      }
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
      all: getAllEntries,
      feed: (status, options) => getFeedEntries(sourceId, status, starred, options),
      category: (status, options) => getCategoryEntries(sourceId, status, starred, options),
      starred: getStarredEntries,
    }

    const fetchEntries = entryFetchers[source]
    return markEntriesAsReadInBatches(fetchEntries)
  }

  const updateUIAfterMarkAsRead = async () => {
    updateAllEntriesAsRead()
    await refreshCounts({ force: true, includeEntrySummary: true }).catch((error) => {
      console.error("Failed to refresh counts after marking entries as read:", error)
    })

    Notification.success({
      title: polyglot.t("article_list.mark_all_as_read_success"),
    })
  }

  const baseFilterOptions = [
    {
      label: polyglot.t("article_list.filter_status_unread"),
      value: "unread",
      icon: <IconRecord aria-hidden="true" />,
    },
    {
      label: polyglot.t("article_list.filter_status_all"),
      value: "all",
      icon: <IconAlignLeft aria-hidden="true" />,
    },
  ]

  const starredOption = {
    label: polyglot.t("article_list.filter_status_starred"),
    value: "starred",
    icon: <IconStarFill aria-hidden="true" />,
  }

  const filterOptions = ["category", "feed"].includes(source)
    ? [starredOption, ...baseFilterOptions]
    : baseFilterOptions

  const renderRadioButton = (option) => {
    const isSelected = showStatus === option.value
    return (
      <Radio key={option.value} value={option.value}>
        {option.icon}
        <span
          className={`entry-panel-filter-label${isSelected ? "" : " entry-panel-filter-label-hidden"}`}
        >
          {option.label}
        </span>
      </Radio>
    )
  }

  useEffect(() => {
    if (source === "starred" && showStatus !== "unread") {
      updateSettings({ showStatus: "all" })
    }
  }, [source, showStatus])

  return (
    <div className="entry-panel">
      <MarkAllReadButton from={source} onConfirm={handleMarkAllAsRead} />
      <Radio.Group
        style={{ visibility: source === "history" ? "hidden" : "visible" }}
        type="button"
        value={showStatus}
        onChange={handleFilterChange}
      >
        {filterOptions.map((option) => renderRadioButton(option))}
      </Radio.Group>
      <CustomTooltip mini content={refreshLabel}>
        <Button
          aria-label={refreshLabel}
          icon={<IconRefresh aria-hidden="true" />}
          loading={!isArticleListReady}
          shape="circle"
          onClick={refreshArticleList}
        />
      </CustomTooltip>
    </div>
  )
}

export default FooterPanel
