import { computed, map } from "nanostores"

import { dataState, feedsState, hiddenFeedIdsState, unreadTotalState } from "./dataState"
import { getSettings, settingsState } from "./settingsState"

import removeDuplicateEntries from "@/utils/deduplicate"
import { filterEntries } from "@/utils/filter"
import createSetter from "@/utils/nanostores"
import compareVersions from "@/utils/version"

const defaultValue = {
  activeContent: null, // 当前打开的文章
  entries: [], // 接口返回的所有文章
  filterDate: null, // 搜索日期
  filterString: "", // 搜索文本
  filterType: "title", // title | content | author
  infoFrom: getSettings("homePage"), // all | today | starred | history
  infoId: null, // feed 或 category 的 id
  isArticleListReady: false, // 文章列表是否加载完成
  isArticleLoading: false, // 文章是否正在加载
  loadMoreVisible: false, // 加载更多元素可见性
  offset: 0, // 文章分页参数
  total: 0, // 接口返回文章总数原始值，不受接口返回数据长度限制
}

export const contentState = map(defaultValue)

export const filteredEntriesState = computed(
  [contentState, dataState, hiddenFeedIdsState, settingsState],
  (content, data, hiddenFeedIds, settings) => {
    const { entries, filterString, filterType, infoFrom } = content
    const filteredEntries = filterEntries(entries, filterType, filterString)

    const { version } = data
    const { removeDuplicates, showHiddenFeeds } = settings
    const isValidFilter = !["starred", "history"].includes(infoFrom)
    const isVisible = (entry) =>
      compareVersions(version, "2.2.0") >= 0 ||
      showHiddenFeeds ||
      !hiddenFeedIds.includes(entry.feed.id)
    const visibleEntries = isValidFilter ? filteredEntries.filter(isVisible) : filteredEntries

    if (removeDuplicates === "none" || ["starred", "history"].includes(infoFrom)) {
      return visibleEntries
    }
    return removeDuplicateEntries(visibleEntries, removeDuplicates)
  },
)

export const dynamicCountState = computed(
  [contentState, dataState, unreadTotalState, settingsState, feedsState],
  (content, data, unreadTotal, settings, feeds) => {
    const { infoFrom, total } = content
    const { showStatus } = settings
    const { unreadStarredCount, unreadTodayCount, historyCount, starredCount, unreadInfo } = data

    if (infoFrom === "starred") {
      return showStatus === "unread" ? unreadStarredCount : starredCount
    }

    if (infoFrom === "history") {
      return historyCount
    }

    if (showStatus === "unread") {
      switch (infoFrom) {
        case "all":
          return unreadTotal
        case "today":
          return unreadTodayCount
        case "feed": {
          const id = content.infoId
          if (id) {
            return unreadInfo[id] || 0
          }
          return total
        }
        case "category": {
          const id = content.infoId
          if (id) {
            const feedsInCategory = feeds.filter((feed) => feed.category.id === Number(id))
            return feedsInCategory.reduce((acc, feed) => acc + (unreadInfo[feed.id] || 0), 0)
          }
          return total
        }
      }
    }

    return total
  },
)

export const activeEntryIndexState = computed(
  [contentState, filteredEntriesState],
  (content, filteredEntries) => {
    const { activeContent } = content
    if (!activeContent) {
      return -1
    }
    return filteredEntries.findIndex((entry) => entry.id === activeContent.id)
  },
)

export const prevContentState = computed(
  [activeEntryIndexState, filteredEntriesState],
  (activeEntryIndex, filteredEntries) => {
    return filteredEntries[activeEntryIndex - 1]
  },
)

export const nextContentState = computed(
  [activeEntryIndexState, filteredEntriesState],
  (activeEntryIndex, filteredEntries) => {
    return filteredEntries[activeEntryIndex + 1]
  },
)

export const setActiveContent = createSetter(contentState, "activeContent")
export const setEntries = createSetter(contentState, "entries")
export const setFilterDate = createSetter(contentState, "filterDate")
export const setFilterString = createSetter(contentState, "filterString")
export const setFilterType = createSetter(contentState, "filterType")
export const setInfoFrom = createSetter(contentState, "infoFrom")
export const setInfoId = createSetter(contentState, "infoId")
export const setIsArticleListReady = createSetter(contentState, "isArticleListReady")
export const setIsArticleLoading = createSetter(contentState, "isArticleLoading")
export const setLoadMoreVisible = createSetter(contentState, "loadMoreVisible")
export const setOffset = createSetter(contentState, "offset")
export const setTotal = createSetter(contentState, "total")
export const resetContent = () => contentState.set(defaultValue)
