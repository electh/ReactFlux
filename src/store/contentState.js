import { computed, map } from "nanostores"

import {
  dataState,
  feedsState,
  isEntryScopeFullyVisible,
  unreadTotalState,
  visibleFeedsState,
} from "./dataState"
import { settingsState } from "./settingsState"

import removeDuplicateEntries from "@/utils/deduplicate"
import { extractHeadings } from "@/utils/dom"
import createSetter, { selectStore } from "@/utils/nanostores"

const defaultValue = {
  activeContent: null, // 当前打开的文章
  articleListError: false,
  articleListRevision: 0,
  articleListSnapshotRevision: 0,
  entries: [], // 接口返回的所有文章
  filterDate: null, // 搜索日期
  filterString: "", // 搜索文本
  infoFrom: "all", // all | today | starred | history | feed | category
  infoId: null, // feed 或 category 的 id
  isArticleListReady: false, // 文章列表是否加载完成
  isArticleLoading: false, // 文章是否正在加载
  isOriginalContentFetched: false,
  originalContentRequestTokens: {},
  loadMoreError: false,
  loadMoreVisible: false, // 加载更多元素可见性
  total: 0, // 接口返回文章总数原始值，不受接口返回数据长度限制
}

export const contentState = map(defaultValue)

export const activeContentState = selectStore(contentState, ({ activeContent }) => activeContent)
const activeContentIdState = selectStore(
  activeContentState,
  (activeContent) => activeContent?.id ?? null,
)
export const isOriginalContentLoadingState = selectStore(
  contentState,
  ({ activeContent, originalContentRequestTokens }) =>
    activeContent ? Object.hasOwn(originalContentRequestTokens, activeContent.id) : false,
)
export const createEntrySelectedState = (entryId) =>
  selectStore(activeContentIdState, (activeContentId) => activeContentId === entryId)

export const articleHeadingsState = selectStore(activeContentState, (activeContent) => {
  if (!activeContent) {
    return []
  }
  return activeContent.headings ?? extractHeadings(activeContent.content)
})

export const filteredEntriesState = computed(contentState, (content) => content.entries)

export const dynamicCountState = computed(
  [contentState, dataState, unreadTotalState, settingsState, feedsState, visibleFeedsState],
  (content, data, unreadTotal, settings, feeds, visibleFeeds) => {
    const { filterString, infoFrom, total } = content
    const { showStatus } = settings

    if (filterString) {
      return total
    }
    const { unreadStarredCount, unreadTodayCount, historyCount, starredCount } = data

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
            return feeds.find((feed) => feed.id === Number(id))?.unreadCount ?? 0
          }
          return total
        }
        case "category": {
          const id = content.infoId
          if (id) {
            const sourceFeeds = isEntryScopeFullyVisible("category", id) ? feeds : visibleFeeds
            const feedsInCategory = sourceFeeds.filter((feed) => feed.category.id === Number(id))
            return feedsInCategory.reduce((acc, feed) => acc + feed.unreadCount, 0)
          }
          return total
        }
      }
    }

    return total
  },
)

export const activeEntryIndexState = computed(
  [activeContentIdState, filteredEntriesState],
  (activeContentId, filteredEntries) => {
    if (activeContentId === null) {
      return -1
    }
    return filteredEntries.findIndex((entry) => entry.id === activeContentId)
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

export const setActiveContent = (updater) => {
  const state = contentState.get()
  const nextActiveContent = typeof updater === "function" ? updater(state.activeContent) : updater
  if (Object.is(state.activeContent, nextActiveContent)) {
    return
  }

  const activeEntryChanged = state.activeContent?.id !== nextActiveContent?.id
  contentState.set({
    ...state,
    activeContent: nextActiveContent,
    isOriginalContentFetched: activeEntryChanged ? false : state.isOriginalContentFetched,
  })
}
export const setArticleListError = createSetter(contentState, "articleListError")
export const incrementArticleListSnapshotRevision = () =>
  contentState.setKey(
    "articleListSnapshotRevision",
    (contentState.get().articleListSnapshotRevision ?? 0) + 1,
  )
export const setEntries = createSetter(contentState, "entries")
export const setFilterDate = createSetter(contentState, "filterDate")
export const setFilterString = createSetter(contentState, "filterString")
export const setInfoFrom = createSetter(contentState, "infoFrom")
export const setInfoId = createSetter(contentState, "infoId")
export const setIsArticleListReady = createSetter(contentState, "isArticleListReady")
export const setIsArticleLoading = createSetter(contentState, "isArticleLoading")
const setOriginalContentRequestTokens = createSetter(contentState, "originalContentRequestTokens")

export const markOriginalContentFetched = (entryId) => {
  const { activeContent, isOriginalContentFetched } = contentState.get()
  if (activeContent?.id !== entryId || isOriginalContentFetched) {
    return false
  }

  contentState.setKey("isOriginalContentFetched", true)
  return true
}

export const acquireOriginalContentRequest = (entryId) => {
  const { originalContentRequestTokens: requestTokens } = contentState.get()
  if (Object.hasOwn(requestTokens, entryId)) {
    return null
  }

  const requestToken = Symbol()
  setOriginalContentRequestTokens({ ...requestTokens, [entryId]: requestToken })
  return requestToken
}

export const isOriginalContentRequestCurrent = (entryId, requestToken) => {
  const { originalContentRequestTokens: requestTokens } = contentState.get()
  return Object.hasOwn(requestTokens, entryId) && requestTokens[entryId] === requestToken
}

export const releaseOriginalContentRequest = (entryId, requestToken) => {
  const { originalContentRequestTokens: requestTokens } = contentState.get()
  if (!Object.hasOwn(requestTokens, entryId) || requestTokens[entryId] !== requestToken) {
    return
  }

  const remainingRequestTokens = { ...requestTokens }
  delete remainingRequestTokens[entryId]
  setOriginalContentRequestTokens(remainingRequestTokens)
}

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

export const invalidateArticleList = () => {
  const { articleListRevision } = contentState.get()
  contentState.setKey("articleListRevision", (articleListRevision ?? 0) + 1)
}

export const invalidateArticleListForFeed = (feed) => {
  if (isFeedInCurrentArticleList(feed, contentState.get())) {
    invalidateArticleList()
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
