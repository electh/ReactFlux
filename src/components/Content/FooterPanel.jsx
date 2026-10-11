import { Button, Notification, Popconfirm, Radio } from "@arco-design/web-react"
import {
  IconAlignLeft,
  IconCheck,
  IconRecord,
  IconRefresh,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"

import { markEntriesAsReadInBatches } from "@/apis"
import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useRefreshCounts from "@/hooks/useRefreshCounts"
import { contentState, setActiveContent, setEntries } from "@/store/contentState"
import {
  getDataSessionRevision,
  isEntryScopeFullyVisible,
  visibleCategoriesState,
  visibleFeedsState,
} from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { hasArticleListFilters } from "@/utils/article-list-filters"
import createArticleListRequestKey from "@/utils/article-list-request-key"
import { get24HoursAgoTimestamp } from "@/utils/date"
import { runEntryMutation } from "@/utils/entry-mutation-state"
import findAdjacentItem from "@/utils/navigation"
import "./FooterPanel.css"

const isEntryInMarkAllReadScope = (
  entry,
  { globallyVisible, source, sourceId, visibleFeedIds },
) => {
  const feedId = Number(entry.feed?.id ?? entry.feed_id)
  if (globallyVisible && !visibleFeedIds.has(feedId)) {
    return false
  }
  switch (source) {
    case "all": {
      return true
    }
    case "feed": {
      return feedId === Number(sourceId)
    }
    case "category": {
      return Number(entry.feed?.category?.id) === Number(sourceId)
    }
    case "starred": {
      return Boolean(entry.starred)
    }
    default: {
      return false
    }
  }
}

const updateEntriesAsRead = (entryIds = null, scope = null) => {
  const { activeContent, entries } = contentState.get()
  const markedEntryIds = new Set(
    entryIds ??
      entries
        .filter((entry) => !scope || isEntryInMarkAllReadScope(entry, scope))
        .map((entry) => entry.id),
  )
  const isActiveEntryMarkedRead =
    activeContent &&
    (scope ? isEntryInMarkAllReadScope(activeContent, scope) : markedEntryIds.has(activeContent.id))
  if (isActiveEntryMarkedRead) {
    setActiveContent({ ...activeContent, status: "read" })
  }
  setEntries((prev) =>
    prev.map((entry) => (markedEntryIds.has(entry.id) ? { ...entry, status: "read" } : entry)),
  )
}

const handleFilterChange = (value) => {
  updateSettings({ showStatus: value })
}

const MarkAllReadButton = ({ disabled, from, loading, onConfirm }) => {
  const { polyglot } = useStore(polyglotState)
  const { skipMarkAllReadConfirmation } = useStore(settingsState, {
    keys: ["skipMarkAllReadConfirmation"],
  })

  const isHidden = from === "history"
  const markAllReadLabel = polyglot.t("article_list.mark_all_as_read_tooltip")
  const [confirmVisible, setConfirmVisible] = useState(false)

  const button = (
    <CustomTooltip mini content={markAllReadLabel}>
      <Button
        aria-busy={loading}
        aria-expanded={skipMarkAllReadConfirmation ? undefined : confirmVisible}
        aria-label={markAllReadLabel}
        disabled={disabled || loading}
        icon={<IconCheck aria-hidden="true" />}
        loading={loading}
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

const FooterPanel = ({ getEntries, info, refreshArticleList, markAllAsRead }) => {
  const { from: source, id: sourceId } = info
  const { isArticleListReady } = useStore(contentState, { keys: ["isArticleListReady"] })
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const markingAllReadRef = useRef(false)
  const { markAllReadJumpToNext, showStatus } = useStore(settingsState, {
    keys: ["markAllReadJumpToNext", "showStatus"],
  })
  const { polyglot } = useStore(polyglotState)
  const categories = useStore(visibleCategoriesState)
  const feeds = useStore(visibleFeedsState)
  const refreshCounts = useRefreshCounts()
  const navigate = useNavigate()
  const refreshLabel = polyglot.t("article_list.refresh_tooltip")

  const jumpToNext = () => {
    if (source === "category") {
      const currentIndex = categories.findIndex((category) => category.id === Number(sourceId))
      const next = findAdjacentItem(categories, currentIndex, "next", {
        predicate: (category) => category.unreadCount > 0,
        wrap: true,
      })
      if (next) {
        navigate(`/category/${next.id}`)
      }
    } else if (source === "feed") {
      const orderedFeeds = categories.flatMap((category) =>
        feeds.filter((feed) => feed.category.id === category.id),
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
    if (
      markingAllReadRef.current ||
      !contentState.get().isArticleListReady ||
      source === "history"
    ) {
      return
    }

    const content = { ...contentState.get(), infoFrom: source, infoId: sourceId }
    const settings = settingsState.get()
    const sessionRevision = getDataSessionRevision()
    const requestKey = createArticleListRequestKey({ content, settings })
    const isCurrentSession = () => sessionRevision === getDataSessionRevision()
    const isCurrentList = () =>
      isCurrentSession() &&
      requestKey ===
        createArticleListRequestKey({
          content: contentState.get(),
          settings: settingsState.get(),
        })
    const isFeedOrCategory = ["feed", "category"].includes(source)
    const starred = isFeedOrCategory && settings.showStatus === "starred"
    const useBatches = hasArticleListFilters(content) || starred || source === "today"
    const scope = isFeedOrCategory ? source : "global"
    const filterParams = {
      filterDate: source === "today" ? null : content.filterDate,
      globally_visible: !isEntryScopeFullyVisible(scope, sourceId),
      order: source === "starred" ? "changed_at" : settings.orderBy,
      direction: settings.orderDirection,
      ...(content.filterString && { search: content.filterString }),
      ...(source === "today" && { published_after: get24HoursAgoTimestamp() }),
    }

    const fastPathScope = {
      source,
      sourceId,
      globallyVisible: filterParams.globally_visible,
      visibleFeedIds: new Set(visibleFeedsState.get().map((feed) => Number(feed.id))),
    }

    markingAllReadRef.current = true
    setMarkingAllRead(true)
    try {
      await runEntryMutation(() => {
        if (!useBatches) {
          return markAllAsRead()
        }

        return markEntriesAsReadInBatches(
          (status, options) => getEntries(status, starred, options),
          {
            filterParams,
            onBatchMarkedRead: (entryIds) => {
              if (isCurrentList()) {
                updateEntriesAsRead(entryIds)
              }
            },
          },
        )
      })

      if (!isCurrentSession()) {
        return
      }
      if (!useBatches && isCurrentList()) {
        updateEntriesAsRead(null, fastPathScope)
      }
      await refreshCounts({ force: true })
      if (!isCurrentSession()) {
        return
      }

      Notification.success({
        title: polyglot.t("article_list.mark_all_as_read_success"),
      })
      if (markAllReadJumpToNext && isCurrentList()) {
        jumpToNext()
      }
    } catch (error) {
      if (!isCurrentSession()) {
        return
      }
      console.error("Failed to mark all as read:", error)
      if (isCurrentList()) {
        await refreshArticleList()
      }
      await refreshCounts({ force: true })
      if (isCurrentSession()) {
        Notification.error({
          title: polyglot.t("article_list.mark_all_as_read_error"),
          content: error.message,
        })
      }
    } finally {
      markingAllReadRef.current = false
      setMarkingAllRead(false)
    }
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
    if (showStatus === "starred" && ["all", "today", "starred"].includes(source)) {
      updateSettings({ showStatus: "all" })
    }
  }, [source, showStatus])

  return (
    <div className="entry-panel">
      <MarkAllReadButton
        disabled={!isArticleListReady}
        from={source}
        loading={markingAllRead}
        onConfirm={handleMarkAllAsRead}
      />
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
