import apiClient from "./ofetch"

import { contentState } from "@/store/contentState"
import { getSettings } from "@/store/settingsState"
import { MAX_ENTRIES_PER_PAGE } from "@/utils/constants"
import { get24HoursAgoTimestamp, getDayEndTimestamp, getTimestamp } from "@/utils/date"

export const getEntry = async (entryId) => apiClient.get(`/v1/entries/${entryId}`)

export const updateEntriesStatus = async (entryIds, newStatus) =>
  apiClient.put("/v1/entries", {
    entry_ids: entryIds,
    status: newStatus,
  })

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

export const toggleEntryStarred = async (entryId) =>
  apiClient.put(`/v1/entries/${entryId}/bookmark`)

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

const buildEntriesUrl = (baseParams, extraParams = {}) => {
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

  if (filterDate) {
    addDateFilters(orderField, queryParams, filterDate)
  }

  return `${baseUrl}?${queryParams}`
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

export const getTodayEntries = async (status = null, filterParams = {}) => {
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

  return apiClient.get(buildEntriesUrl(baseParams, extraParams))
}

export const getStarredEntries = async (status = null, filterParams = {}) => {
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

  return apiClient.get(buildEntriesUrl(baseParams, extraParams))
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
