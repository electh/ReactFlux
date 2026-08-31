import { computed, map } from "nanostores"

import { settingsState } from "./settingsState"

import { sortMixedLanguageArray } from "@/utils/locales"

const createResourceLoadState = () => ({
  hasSnapshot: false,
  snapshotRevision: 0,
  activity: "idle",
  error: null,
})

const createDefaultValue = (sessionRevision = 0) => ({
  sessionRevision,
  unreadInfo: {},
  unreadStarredCount: 0,
  unreadTodayCount: 0,
  starredCount: 0,
  historyCount: 0,
  feedsData: [],
  categoriesData: [],
  currentUser: null,
  version: "",
  verifiedAuthSessionKey: "",
  hasIntegrations: false,
  loadState: {
    catalog: createResourceLoadState(),
    counts: createResourceLoadState(),
    identity: createResourceLoadState(),
    serverInfo: createResourceLoadState(),
  },
  resourceRevisions: {
    catalog: 0,
    counts: 0,
    identity: 0,
    serverInfo: 0,
  },
})

export const dataState = map(createDefaultValue())

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
    const categoryStatsById = new Map()

    for (const feed of feeds) {
      const categoryId = feed.category.id
      const stats = categoryStatsById.get(categoryId) ?? { unreadCount: 0, feedCount: 0 }
      stats.unreadCount += feed.unreadCount
      stats.feedCount += 1
      categoryStatsById.set(categoryId, stats)
    }

    const categoriesWithUnread = categoriesData.map((category) => {
      const stats = categoryStatsById.get(category.id) ?? { unreadCount: 0, feedCount: 0 }
      return {
        ...category,
        unreadCount: stats.unreadCount,
        feedCount: stats.feedCount,
      }
    })

    return sortMixedLanguageArray(categoriesWithUnread, "title", language)
  },
)

const hiddenCategoryIdSetState = computed(categoriesState, (categories) => {
  const hiddenCategoryIdSet = new Set()

  for (const category of categories) {
    if (category.hide_globally) {
      hiddenCategoryIdSet.add(category.id)
    }
  }

  return hiddenCategoryIdSet
})

const hiddenFeedIdSetState = computed(
  [feedsState, hiddenCategoryIdSetState],
  (feeds, hiddenCategoryIds) => {
    const hiddenFeedIdSet = new Set()

    for (const feed of feeds) {
      if (feed.hide_globally || hiddenCategoryIds.has(feed.category.id)) {
        hiddenFeedIdSet.add(feed.id)
      }
    }

    return hiddenFeedIdSet
  },
)

export const filteredFeedsState = computed(
  [feedsState, hiddenFeedIdSetState, settingsState],
  (feeds, hiddenFeedIds, settings) => {
    const { showHiddenFeeds } = settings
    return feeds.filter((feed) => showHiddenFeeds || !hiddenFeedIds.has(feed.id))
  },
)

export const filteredCategoriesState = computed(
  [categoriesState, hiddenCategoryIdSetState, settingsState],
  (categories, hiddenCategoryIds, settings) => {
    const { showHiddenFeeds } = settings
    return categories.filter((category) => showHiddenFeeds || !hiddenCategoryIds.has(category.id))
  },
)

export const feedsGroupedByIdState = computed(filteredFeedsState, (filteredFeeds) => {
  const groupedFeeds = {}

  for (const feed of filteredFeeds) {
    const { id } = feed.category

    if (!groupedFeeds[id]) {
      groupedFeeds[id] = []
    }

    groupedFeeds[id].push(feed)
  }

  return groupedFeeds
})

export const unreadTotalState = computed([dataState, filteredFeedsState], (data, filteredFeeds) => {
  const { unreadInfo } = data
  const filteredFeedIds = new Set(filteredFeeds.map((feed) => feed.id))
  let total = 0

  for (const [id, count] of Object.entries(unreadInfo)) {
    if (filteredFeedIds.has(Number(id))) {
      total += count
    }
  }

  return total
})

const incrementResourceRevision = (resourceRevisions, resource) => ({
  ...resourceRevisions,
  [resource]: resourceRevisions[resource] + 1,
})

const createResourceFieldSetter = (fieldName, resource) => (updater) => {
  const currentState = dataState.get()
  const currentValue = currentState[fieldName]
  const nextValue = typeof updater === "function" ? updater(currentValue) : updater

  if (Object.is(currentValue, nextValue)) {
    return
  }

  dataState.set({
    ...currentState,
    [fieldName]: nextValue,
    resourceRevisions: incrementResourceRevision(currentState.resourceRevisions, resource),
  })
}

const commitResourceData = (resource, resourceData, error = null) => {
  const currentState = dataState.get()

  dataState.set({
    ...currentState,
    ...resourceData,
    loadState: {
      ...currentState.loadState,
      [resource]: {
        hasSnapshot: true,
        snapshotRevision: currentState.loadState[resource].snapshotRevision + 1,
        activity: "idle",
        error,
      },
    },
    resourceRevisions: incrementResourceRevision(currentState.resourceRevisions, resource),
  })
}

export const getDataResourceRevision = (resource) => dataState.get().resourceRevisions[resource]

export const getDataSessionRevision = () => dataState.get().sessionRevision

export const setDataResourceLoadState = (resource, loadStateChanges) => {
  const currentState = dataState.get()
  const currentLoadState = currentState.loadState[resource]
  const hasLoadStateChanges = Object.entries(loadStateChanges).some(
    ([key, value]) => !Object.is(currentLoadState[key], value),
  )

  if (!hasLoadStateChanges) {
    return
  }

  dataState.set({
    ...currentState,
    loadState: {
      ...currentState.loadState,
      [resource]: { ...currentLoadState, ...loadStateChanges },
    },
  })
}

export const commitCatalogData = ({ feedsData, categoriesData }) =>
  commitResourceData("catalog", { feedsData, categoriesData })

export const commitCountsData = (countsData, error = null) =>
  commitResourceData("counts", countsData, error)

export const commitIdentityData = (currentUser) => commitResourceData("identity", { currentUser })

export const commitServerInfoData = (serverInfoData, error = null) =>
  commitResourceData("serverInfo", serverInfoData, error)

export const setCategoriesData = createResourceFieldSetter("categoriesData", "catalog")
export const setFeedsData = createResourceFieldSetter("feedsData", "catalog")
export const setHistoryCount = createResourceFieldSetter("historyCount", "counts")
export const setStarredCount = createResourceFieldSetter("starredCount", "counts")
export const setVerifiedServer = ({ authSessionKey, version }) => {
  const currentState = dataState.get()

  if (currentState.verifiedAuthSessionKey === authSessionKey && currentState.version === version) {
    return
  }

  dataState.set({
    ...currentState,
    verifiedAuthSessionKey: authSessionKey,
    version,
    resourceRevisions: incrementResourceRevision(currentState.resourceRevisions, "serverInfo"),
  })
}
export const setUnreadInfo = createResourceFieldSetter("unreadInfo", "counts")
export const setUnreadStarredCount = createResourceFieldSetter("unreadStarredCount", "counts")
export const setUnreadTodayCount = createResourceFieldSetter("unreadTodayCount", "counts")
export const resetData = () => {
  const nextSessionRevision = dataState.get().sessionRevision + 1
  dataState.set(createDefaultValue(nextSessionRevision))
}
