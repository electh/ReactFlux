import apiClient from "./ofetch"

import { contentState } from "@/store/contentState"
import { getSettings } from "@/store/settingsState"
import { get24HoursAgoTimestamp, getDayEndTimestamp, getTimestamp } from "@/utils/date"

export const updateEntriesStatus = async (entryIds, newStatus) =>
  apiClient.put("/v1/entries", {
    entry_ids: entryIds,
    status: newStatus,
  })

export const toggleEntryStarred = async (entryId) =>
  apiClient.put(`/v1/entries/${entryId}/bookmark`)

export const getOriginalContent = async (entryId) => {
  const { updateContentOnFetch } = getSettings("updateContentOnFetch")
  const queryParams = updateContentOnFetch ? "?update_content=true" : ""
  return apiClient.get(`/v1/entries/${entryId}/fetch-content${queryParams}`)
}

export const saveToThirdPartyServices = async (entryId) =>
  apiClient.raw(`/v1/entries/${entryId}/save`, { method: "POST" })

export const buildEntriesUrl = (baseParams, extraParams = {}) => {
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
    if (orderField === "changed_at") {
      if (!queryParams.get("changed_after")) {
        queryParams.append("changed_after", getTimestamp(filterDate))
      }
      if (!queryParams.get("changed_before")) {
        queryParams.append("changed_before", getDayEndTimestamp(filterDate))
      }
    } else {
      if (!queryParams.get("published_after")) {
        queryParams.append("published_after", getTimestamp(filterDate))
      }
      if (!queryParams.get("published_before")) {
        queryParams.append("published_before", getDayEndTimestamp(filterDate))
      }
    }
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

export const getTodayEntries = async (status = null, limit = null, filterParams = {}) => {
  const orderBy = getSettings("orderBy")
  const pageSize = limit ?? getSettings("pageSize")
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
    starred: "true",
    ...filterParams,
  }

  return apiClient.get(buildEntriesUrl(baseParams, extraParams))
}

export const getHistoryEntries = async (_status, filterParams = {}) => {
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
