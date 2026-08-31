import { computed, map } from "nanostores"

import { dataState, feedsState, unreadTotalState } from "./dataState"
import { getSettings, settingsState } from "./settingsState"

import removeDuplicateEntries from "@/utils/deduplicate"
import { extractHeadings } from "@/utils/dom"
import createSetter from "@/utils/nanostores"

const defaultValue = {
  activeContent: null, // 当前打开的文章
  articleListError: false,
  articleListRevision: 0,
  entries: [], // 接口返回的所有文章
  filterDate: null, // 搜索日期
  filterString: "", // 搜索文本
  infoFrom: getSettings("homePage"), // all | today | starred | history
  infoId: null, // feed 或 category 的 id
  isArticleListReady: false, // 文章列表是否加载完成
  isArticleLoading: false, // 文章是否正在加载
  loadMoreError: false,
  loadMoreVisible: false, // 加载更多元素可见性
  total: 0, // 接口返回文章总数原始值，不受接口返回数据长度限制
}

export const contentState = map(defaultValue)

export const articleHeadingsState = computed([contentState], (content) => {
  const { activeContent } = content
  if (!activeContent?.content) {
    return []
  }
  return extractHeadings(activeContent.content)
})

export const filteredEntriesState = computed(contentState, (content) => content.entries)

export const dynamicCountState = computed(
  [contentState, dataState, unreadTotalState, settingsState, feedsState],
  (content, data, unreadTotal, settings, feeds) => {
    const { filterString, infoFrom, total } = content
    const { showStatus } = settings

    if (filterString) {
      return total
    }
    const { unreadStarredCount, unreadTodayCount, historyCount, starredCount, unreadInfo } = data

    if (infoFrom === "starred") {
      return showStatus === "unread" ? unreadStarredCount : starredCount
    }

    if (infoFrom === "history") {
      return historyCount
    }

    if (showStatus === "unread") {
      switch (infoFrom) {
        case "all": {
          return unreadTotal
        }
        case "today": {
          return unreadTodayCount
        }
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
export const setArticleListError = createSetter(contentState, "articleListError")
export const setEntries = createSetter(contentState, "entries")
export const setFilterDate = createSetter(contentState, "filterDate")
export const setFilterString = createSetter(contentState, "filterString")
export const setInfoFrom = createSetter(contentState, "infoFrom")
export const setInfoId = createSetter(contentState, "infoId")
export const setIsArticleListReady = createSetter(contentState, "isArticleListReady")
export const setIsArticleLoading = createSetter(contentState, "isArticleLoading")
export const setLoadMoreError = createSetter(contentState, "loadMoreError")
export const setLoadMoreVisible = createSetter(contentState, "loadMoreVisible")
export const setTotal = createSetter(contentState, "total")
export const resetContent = () => contentState.set(defaultValue)

const isFeedInCurrentArticleList = (feed, { infoFrom, infoId }) => {
  switch (infoFrom) {
    case "all":
    case "today": {
      return true
    }
    case "feed": {
      return Number(feed.id ?? feed.key) === Number(infoId)
    }
    case "category": {
      return Number(feed.category?.id) === Number(infoId)
    }
    default: {
      return false
    }
  }
}

export const invalidateArticleListForFeed = (feed) => {
  const content = contentState.get()
  if (isFeedInCurrentArticleList(feed, content)) {
    contentState.setKey("articleListRevision", (content.articleListRevision ?? 0) + 1)
  }
}

// Updates the entry list and returns entries dropped by deduplication.
export const setEntriesWithDeduplication = (newEntries) => {
  const { infoFrom } = contentState.get()
  const { removeDuplicates } = settingsState.get()

  // Skip deduplication when disabled or for specific sources (starred/history)
  if (removeDuplicates === "none" || ["starred", "history"].includes(infoFrom)) {
    setEntries(newEntries)
    return []
  }

  const { entries: deduplicatedEntries, duplicates } = removeDuplicateEntries(
    newEntries,
    removeDuplicates,
  )
  setEntries(deduplicatedEntries)
  return duplicates
}
