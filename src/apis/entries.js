import { getSettings } from "../store/settingsState";
import { get24HoursAgoTimestamp } from "../utils/date";
import { apiClient } from "./ofetch";

export const updateEntriesStatus = async (entryIds, newStatus) =>
  apiClient.put("/v1/entries", {
    entry_ids: entryIds,
    status: newStatus,
  });

export const toggleEntryStarred = async (entryId) =>
  apiClient.put(`/v1/entries/${entryId}/bookmark`);

export const getOriginalContent = async (entryId) =>
  apiClient.get(`/v1/entries/${entryId}/fetch-content`);

export const saveToThirdPartyServices = async (entryId) =>
  apiClient.raw(`/v1/entries/${entryId}/save`, { method: "POST" });

export const buildEntriesUrl = (baseParams, extraParams = {}) => {
  const { baseUrl, orderField, offset, limit, status } = baseParams;
  const orderDirection = getSettings("orderDirection");
  const queryParams = new URLSearchParams({
    order: orderField,
    direction: orderDirection,
    offset,
    limit,
    ...extraParams,
  });

  if (status) {
    queryParams.append("status", status);
  }

  return `${baseUrl}?${queryParams}`;
};

export const getAllEntries = async (offset = 0, status = null) => {
  const orderBy = getSettings("orderBy");
  const pageSize = getSettings("pageSize");
  const showAllFeeds = getSettings("showAllFeeds");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: orderBy,
    offset,
    limit: pageSize,
    status,
  };

  const extraParams = { globally_visible: !showAllFeeds };

  return apiClient.get(buildEntriesUrl(baseParams, extraParams));
};

export const getTodayEntries = async (
  offset = 0,
  status = null,
  limit = null,
) => {
  const orderBy = getSettings("orderBy");
  const pageSize = limit ?? getSettings("pageSize");
  const showAllFeeds = getSettings("showAllFeeds");
  const timestamp = get24HoursAgoTimestamp();
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: orderBy,
    offset,
    limit: pageSize,
    status,
  };
  const extraParams = {
    globally_visible: !showAllFeeds,
    published_after: timestamp,
  };

  return apiClient.get(buildEntriesUrl(baseParams, extraParams));
};

export const getStarredEntries = async (offset = 0, status = null) => {
  const pageSize = getSettings("pageSize");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: "changed_at",
    offset,
    limit: pageSize,
    status,
  };
  const extraParams = { starred: "true" };

  return apiClient.get(buildEntriesUrl(baseParams, extraParams));
};

export const getHistoryEntries = async (offset = 0) => {
  const pageSize = getSettings("pageSize");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: "changed_at",
    offset,
    limit: pageSize,
    status: "read",
  };

  return apiClient.get(buildEntriesUrl(baseParams));
};
