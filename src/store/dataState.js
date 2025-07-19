import { computed, map } from "nanostores"

import { settingsState } from "./settingsState"

import { sortMixedLanguageArray } from "@/utils/locales"
import createSetter from "@/utils/nanostores"

const defaultValue = {
  isAppDataReady: false,
  isCoreDataReady: false,
  unreadInfo: {},
  unreadStarredCount: 0,
  unreadTodayCount: 0,
  starredCount: 0,
  historyCount: 0,
  feedsData: [],
  categoriesData: [],
  version: "",
  hasIntegrations: false,
}

export const dataState = map(defaultValue)

export const feedsState = computed([dataState, settingsState], (data, settings) => {
  const { unreadInfo, feedsData } = data
  const { language } = settings

  const feedsWithUnread = feedsData.map((feed) => ({
    ...feed,
    unreadCount: unreadInfo[feed.id] ?? 0,
  }))

  return sortMixedLanguageArray(feedsWithUnread, "title", language)
})

export const categoriesState = computed(
  [dataState, feedsState, settingsState],
  (data, feeds, settings) => {
    const { categoriesData } = data
    const { language } = settings

    const categoriesWithUnread = categoriesData.map((category) => {
      const feedsInCategory = feeds.filter((feed) => feed.category.id === category.id)
      return {
        ...category,
        unreadCount: feedsInCategory.reduce((acc, feed) => acc + (feed.unreadCount ?? 0), 0),
        feedCount: feedsInCategory.length,
      }
    })

    return sortMixedLanguageArray(categoriesWithUnread, "title", language)
  },
)

export const hiddenCategoryIdsState = computed(categoriesState, (categories) => {
  return categories.filter((category) => category.hide_globally).map((category) => category.id)
})

export const hiddenFeedIdsState = computed(
  [feedsState, hiddenCategoryIdsState],
  (feeds, hiddenCategoryIds) => {
    return feeds
      .filter((feed) => feed.hide_globally || hiddenCategoryIds.includes(feed.category.id))
      .map((feed) => feed.id)
  },
)

export const filteredFeedsState = computed(
  [feedsState, hiddenFeedIdsState, settingsState],
  (feeds, hiddenFeedIds, settings) => {
    const { showHiddenFeeds } = settings
    return feeds.filter((feed) => showHiddenFeeds || !hiddenFeedIds.includes(feed.id))
  },
)

export const filteredCategoriesState = computed(
  [categoriesState, hiddenCategoryIdsState, settingsState],
  (categories, hiddenCategoryIds, settings) => {
    const { showHiddenFeeds } = settings
    return categories.filter(
      (category) => showHiddenFeeds || !hiddenCategoryIds.includes(category.id),
    )
  },
)

export const feedsGroupedByIdState = computed(filteredFeedsState, (filteredFeeds) => {
  return filteredFeeds.reduce((groupedFeeds, feed) => {
    const { id } = feed.category
    if (!groupedFeeds[id]) {
      groupedFeeds[id] = []
    }
    groupedFeeds[id].push(feed)
    return groupedFeeds
  }, {})
})

export const unreadTotalState = computed([dataState, filteredFeedsState], (data, filteredFeeds) => {
  const { unreadInfo } = data
  return Object.entries(unreadInfo).reduce((acc, [id, count]) => {
    if (filteredFeeds.some((feed) => feed.id === Number(id))) {
      return acc + count
    }
    return acc
  }, 0)
})

export const setCategoriesData = createSetter(dataState, "categoriesData")
export const setFeedsData = createSetter(dataState, "feedsData")
export const setHasIntegrations = createSetter(dataState, "hasIntegrations")
export const setHistoryCount = createSetter(dataState, "historyCount")
export const setIsAppDataReady = createSetter(dataState, "isAppDataReady")
export const setIsCoreDataReady = (isCoreDataReady) => {
  dataState.setKey("isCoreDataReady", isCoreDataReady)
}
export const setStarredCount = createSetter(dataState, "starredCount")
export const setUnreadInfo = createSetter(dataState, "unreadInfo")
export const setUnreadStarredCount = createSetter(dataState, "unreadStarredCount")
export const setUnreadTodayCount = createSetter(dataState, "unreadTodayCount")
export const setVersion = createSetter(dataState, "version")
export const resetData = () => dataState.set(defaultValue)
