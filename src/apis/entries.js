import apiClient from "./ofetch"

import { contentState } from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { getSettings } from "@/store/settingsState"
import {
  ENTRY_UPDATE_BATCH_SIZE,
  MAX_ENTRIES_PER_PAGE,
  MAX_ENTRY_IDS_PER_PAGE,
} from "@/utils/constants"
import { get24HoursAgoTimestamp, getDayEndTimestamp, getTimestamp } from "@/utils/date"
import compareVersions from "@/utils/version"

export const getEntry = async (entryId) => apiClient.get(`/v1/entries/${entryId}`)

const supportsEntryIdsAndStarredUpdates = () =>
  compareVersions(dataState.get().version || "0", "2.3.2") >= 0

const updateEntries = async (entryIds, updates) =>
  apiClient.put("/v1/entries", {
    entry_ids: entryIds,
    ...updates,
  })

export const updateEntriesStatus = async (entryIds, newStatus) =>
  updateEntries(entryIds, { status: newStatus })

const toggleEntryStarred = async (entryId) => apiClient.put(`/v1/entries/${entryId}/bookmark`)

export const setEntriesStarred = async (entryIds, starred) => {
  if (supportsEntryIdsAndStarredUpdates()) {
    return updateEntries(entryIds, { starred })
  }

  if (entryIds.length !== 1) {
    throw new Error("Bulk starred updates require Miniflux 2.3.2 or newer")
  }

  return toggleEntryStarred(entryIds[0])
}

export const markEntriesAsReadInBatches = async (fetchEntries) => {
  let markedEntryCount = 0

  while (true) {
    // Always fetch from offset zero because marking a batch read removes it from the result set.
    const response = await fetchEntries("unread", {
      limit: MAX_ENTRIES_PER_PAGE,
      offset: 0,
    })
    const unreadEntries = response?.entries ?? []
    const unreadEntryIds = [...new Set(unreadEntries.map((entry) => entry.id))]

    if (unreadEntryIds.length === 0) {
      return markedEntryCount
    }

    await updateEntriesStatus(unreadEntryIds, "read")
    markedEntryCount += unreadEntryIds.length
  }
}

export const getOriginalContent = async (entryId) => {
  const { updateContentOnFetch } = getSettings("updateContentOnFetch")
  const queryParams = updateContentOnFetch ? "?update_content=true" : ""
  return apiClient.get(`/v1/entries/${entryId}/fetch-content${queryParams}`)
}

export const saveToThirdPartyServices = async (entryId) =>
  apiClient.raw(`/v1/entries/${entryId}/save`, { method: "POST" })

const addTimeRangeParams = (queryParams, afterParam, beforeParam, filterDate) => {
  if (!queryParams.get(afterParam)) {
    queryParams.append(afterParam, getTimestamp(filterDate))
  }
  if (!queryParams.get(beforeParam)) {
    queryParams.append(beforeParam, getDayEndTimestamp(filterDate))
  }
}

const addDateFilters = (orderField, queryParams, filterDate) => {
  if (orderField === "changed_at") {
    addTimeRangeParams(queryParams, "changed_after", "changed_before", filterDate)
  } else {
    addTimeRangeParams(queryParams, "published_after", "published_before", filterDate)
  }
}

const buildEntriesUrl = (baseParams, extraParams = {}, applyDateFilter = true) => {
  const { baseUrl, orderField, limit, status } = baseParams
  const { filterDate } = contentState.get()
  const orderDirection = getSettings("orderDirection")

  const queryParams = new URLSearchParams({
    order: orderField,
    direction: orderDirection,
    limit,
    ...extraParams,
  })

  if (status) {
    queryParams.append("status", status)
  }

  if (applyDateFilter && filterDate) {
    addDateFilters(orderField, queryParams, filterDate)
  }

  return `${baseUrl}?${queryParams}`
}

const getEntryIds = async ({ status, starred, offset = 0, limit } = {}) => {
  const queryParams = new URLSearchParams({
    offset,
    limit: Math.min(limit ?? MAX_ENTRY_IDS_PER_PAGE, MAX_ENTRY_IDS_PER_PAGE),
  })

  if (status) {
    queryParams.append("status", status)
  }

  if (typeof starred === "boolean") {
    queryParams.append("starred", starred)
  }

  return apiClient.get(`/v1/entries/ids?${queryParams}`)
}

const getAllEntryIds = async (filters) => {
  // Collect all matching IDs before updating them so pagination offsets remain stable.
  const entryIds = []
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const response = await getEntryIds({
      ...filters,
      offset,
      limit: MAX_ENTRY_IDS_PER_PAGE,
    })
    const pageEntryIds = response?.entry_ids ?? []
    total = response?.total ?? 0

    if (pageEntryIds.length === 0) {
      break
    }

    entryIds.push(...pageEntryIds)
    offset += pageEntryIds.length
  }

  return [...new Set(entryIds)]
}

const updateEntryIdsInBatches = async (entryIds, updates) => {
  for (let batchStart = 0; batchStart < entryIds.length; batchStart += ENTRY_UPDATE_BATCH_SIZE) {
    await updateEntries(entryIds.slice(batchStart, batchStart + ENTRY_UPDATE_BATCH_SIZE), updates)
  }

  return entryIds.length
}

export const getAllEntries = async (status = null, filterParams = {}) => {
  const orderBy = getSettings("orderBy")
  const pageSize = getSettings("pageSize")
  const showHiddenFeeds = getSettings("showHiddenFeeds")

  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: orderBy,
    limit: pageSize,
    status,
  }

  const extraParams = {
    globally_visible: !showHiddenFeeds,
    ...filterParams,
  }

  return apiClient.get(buildEntriesUrl(baseParams, extraParams))
}

const fetchTodayEntries = async (status, filterParams, applyDateFilter) => {
  const orderBy = getSettings("orderBy")
  const pageSize = getSettings("pageSize")
  const showHiddenFeeds = getSettings("showHiddenFeeds")
  const timestamp = get24HoursAgoTimestamp()

  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: orderBy,
    limit: pageSize,
    status,
  }

  const extraParams = {
    globally_visible: !showHiddenFeeds,
    published_after: timestamp,
    ...filterParams,
  }

  return apiClient.get(buildEntriesUrl(baseParams, extraParams, applyDateFilter))
}

export const getTodayEntries = async (status = null, filterParams = {}) =>
  fetchTodayEntries(status, filterParams, true)

const fetchStarredEntries = async (status, filterParams, applyDateFilter) => {
  const pageSize = getSettings("pageSize")

  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: "changed_at",
    limit: pageSize,
    status,
  }

  const extraParams = {
    starred: true,
    ...filterParams,
  }

  return apiClient.get(buildEntriesUrl(baseParams, extraParams, applyDateFilter))
}

export const getStarredEntries = async (status = null, filterParams = {}) =>
  fetchStarredEntries(status, filterParams, true)

export const markStarredEntriesAsRead = async () => {
  if (!supportsEntryIdsAndStarredUpdates()) {
    return markEntriesAsReadInBatches(getStarredEntries)
  }

  const unreadStarredEntryIds = await getAllEntryIds({
    starred: true,
    status: "unread",
  })

  return updateEntryIdsInBatches(unreadStarredEntryIds, { status: "read" })
}

const getStarredCountData = async (status = null) =>
  supportsEntryIdsAndStarredUpdates()
    ? getEntryIds({ starred: true, status, limit: 1 })
    : fetchStarredEntries(status, { limit: 1 }, false)

export const getEntryCountSummary = async () => {
  const [starredData, unreadStarredData, unreadTodayData] = await Promise.all([
    getStarredCountData(),
    getStarredCountData("unread"),
    fetchTodayEntries("unread", { limit: 1 }, false),
  ])

  return {
    starredCount: starredData?.total ?? 0,
    unreadStarredCount: unreadStarredData?.total ?? 0,
    unreadTodayCount: unreadTodayData?.total ?? 0,
  }
}

export const getHistoryEntries = async (filterParams = {}) => {
  const pageSize = getSettings("pageSize")

  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: "changed_at",
    limit: pageSize,
    status: "read",
  }

  const extraParams = { ...filterParams }

  return apiClient.get(buildEntriesUrl(baseParams, extraParams))
}

export const getCategoryEntries = async (
  categoryId,
  status = null,
  starred = false,
  filterParams = {},
) => {
  const orderBy = getSettings("orderBy")
  const pageSize = getSettings("pageSize")
  const showHiddenFeeds = getSettings("showHiddenFeeds")

  const baseParams = {
    baseUrl: `/v1/categories/${categoryId}/entries`,
    orderField: orderBy,
    limit: pageSize,
    status,
  }

  const extraParams = {
    globally_visible: !showHiddenFeeds,
    ...filterParams,
  }

  if (starred) {
    extraParams.starred = starred
  }

  return apiClient.get(buildEntriesUrl(baseParams, extraParams))
}

export const getFeedEntries = async (feedId, status = null, starred = false, filterParams = {}) => {
  const orderBy = getSettings("orderBy")
  const pageSize = getSettings("pageSize")

  const baseParams = {
    baseUrl: `/v1/feeds/${feedId}/entries`,
    orderField: orderBy,
    limit: pageSize,
    status,
  }

  const extraParams = { ...filterParams }

  if (starred) {
    extraParams.starred = starred
  }

  return apiClient.get(buildEntriesUrl(baseParams, extraParams))
}
