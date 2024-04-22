import { getConfig } from "../utils/config";
import { get24HoursAgoTimestamp } from "../utils/date";
import { apiClient } from "./axios";

export const updateEntriesStatus = async (entryIds, newStatus) =>
  apiClient.put("/v1/entries", {
    entry_ids: entryIds,
    status: newStatus,
  });

export const toggleEntryStarred = async (entryId) =>
  apiClient.put(`/v1/entries/${entryId}/bookmark`);

export const getOriginalContent = async (entryId) =>
  apiClient.get(`/v1/entries/${entryId}/fetch-content`);

export const buildEntriesUrl = (baseParams, extraParams = {}) => {
  const { baseUrl, orderField, offset, limit, status } = baseParams;
  const orderDirection = getConfig("orderDirection");
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
  const orderBy = getConfig("orderBy");
  const pageSize = getConfig("pageSize");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: orderBy,
    offset,
    limit: pageSize,
    status,
  };

  const url = buildEntriesUrl(baseParams);
  return apiClient.get(url);
};

export const getTodayEntries = async (
  offset = 0,
  status = null,
  limit = null,
) => {
  const orderBy = getConfig("orderBy");
  const pageSize = limit ?? getConfig("pageSize");
  const timestamp = get24HoursAgoTimestamp();
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: orderBy,
    offset,
    limit: pageSize,
    status,
  };
  const extraParams = { published_after: timestamp };

  const url = buildEntriesUrl(baseParams, extraParams);
  return apiClient.get(url);
};

export const getStarredEntries = async (offset = 0, status = null) => {
  const pageSize = getConfig("pageSize");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: "changed_at",
    offset,
    limit: pageSize,
    status,
  };
  const extraParams = { starred: "true" };

  const url = buildEntriesUrl(baseParams, extraParams);
  return apiClient.get(url);
};

export const getHistoryEntries = async (offset = 0) => {
  const pageSize = getConfig("pageSize");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: "changed_at",
    offset,
    limit: pageSize,
    status: "read",
  };

  const url = buildEntriesUrl(baseParams);
  return apiClient.get(url);
};
