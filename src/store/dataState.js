import { computed, map } from "nanostores"

import { settingsState } from "./settingsState"

import { sortMixedLanguageArray } from "@/utils/locales"
import { selectStore } from "@/utils/nanostores"

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
export const hasIntegrationsState = selectStore(dataState, ({ hasIntegrations }) => hasIntegrations)

const categoriesDataState = selectStore(dataState, ({ categoriesData }) => categoriesData)
const feedsDataState = selectStore(dataState, ({ feedsData }) => feedsData)
const unreadInfoState = selectStore(dataState, ({ unreadInfo }) => unreadInfo)
const languageState = selectStore(settingsState, ({ language }) => language)
const showHiddenFeedsState = selectStore(settingsState, ({ showHiddenFeeds }) => showHiddenFeeds)

export const catalogFeedsState = computed([feedsDataState, languageState], (feeds, language) =>
  sortMixedLanguageArray(feeds, "title", language),
)

export const catalogCategoriesState = computed(
  [categoriesDataState, languageState],
  (categories, language) => sortMixedLanguageArray(categories, "title", language),
)

export const feedsState = computed([catalogFeedsState, unreadInfoState], (feeds, unreadInfo) =>
  feeds.map((feed) => ({
    ...feed,
    unreadCount: unreadInfo[feed.id] ?? 0,
  })),
)

export const categoriesState = computed(
  [catalogCategoriesState, feedsState],
  (categories, feeds) => {
    const categoryStatsById = new Map()

    for (const feed of feeds) {
      const categoryId = feed.category.id
      const stats = categoryStatsById.get(categoryId) ?? { unreadCount: 0, feedCount: 0 }
      stats.unreadCount += feed.unreadCount
      stats.feedCount += 1
      categoryStatsById.set(categoryId, stats)
    }

    return categories.map((category) => {
      const stats = categoryStatsById.get(category.id) ?? { unreadCount: 0, feedCount: 0 }
      return {
        ...category,
        unreadCount: stats.unreadCount,
        feedCount: stats.feedCount,
      }
    })
  },
)

const hiddenCategoryIdSetState = computed(catalogCategoriesState, (categories) => {
  const hiddenCategoryIdSet = new Set()

  for (const category of categories) {
    if (category.hide_globally) {
      hiddenCategoryIdSet.add(category.id)
    }
  }

  return hiddenCategoryIdSet
})

const hiddenFeedIdSetState = computed(
  [catalogFeedsState, hiddenCategoryIdSetState],
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
  [feedsState, hiddenFeedIdSetState, showHiddenFeedsState],
  (feeds, hiddenFeedIds, showHiddenFeeds) =>
    feeds.filter((feed) => showHiddenFeeds || !hiddenFeedIds.has(feed.id)),
)

export const filteredCategoriesState = computed(
  [categoriesState, hiddenCategoryIdSetState, showHiddenFeedsState],
  (categories, hiddenCategoryIds, showHiddenFeeds) =>
    categories.filter((category) => showHiddenFeeds || !hiddenCategoryIds.has(category.id)),
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

export const unreadTotalState = computed(
  [unreadInfoState, filteredFeedsState],
  (unreadInfo, filteredFeeds) => {
    const filteredFeedIds = new Set(filteredFeeds.map((feed) => feed.id))
    let total = 0

    for (const [id, count] of Object.entries(unreadInfo)) {
      if (filteredFeedIds.has(Number(id))) {
        total += count
      }
    }

    return total
  },
)

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
