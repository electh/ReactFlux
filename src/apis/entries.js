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
  const { baseUrl, orderField, limit, status, afterId } = baseParams;
  const orderDirection = getConfig("orderDirection");
  const queryParams = new URLSearchParams({
    order: orderField,
    direction: orderDirection,
    limit,
    ...extraParams,
  });

  if (status) {
    queryParams.append("status", status);
  }

  if (afterId) {
    queryParams.append("after_entry_id", afterId);
  }

  return `${baseUrl}?${queryParams}`;
};

export const getAllEntries = async (status = null, afterId = null) => {
  const orderBy = getConfig("orderBy");
  const pageSize = getConfig("pageSize");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: orderBy,
    limit: pageSize,
    status,
    afterId,
  };

  return apiClient.get(buildEntriesUrl(baseParams));
};

export const getTodayEntries = async (
  status = null,
  afterId = null,
  limit = null,
) => {
  const orderBy = getConfig("orderBy");
  const pageSize = limit ?? getConfig("pageSize");
  const timestamp = get24HoursAgoTimestamp();
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: orderBy,
    limit: pageSize,
    status,
    afterId,
  };
  const extraParams = { published_after: timestamp };

  return apiClient.get(buildEntriesUrl(baseParams, extraParams));
};

export const getStarredEntries = async (status = null, afterId = null) => {
  const pageSize = getConfig("pageSize");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: "changed_at",
    limit: pageSize,
    status,
    afterId,
  };
  const extraParams = { starred: "true" };

  return apiClient.get(buildEntriesUrl(baseParams, extraParams));
};

export const getHistoryEntries = async (status = "read", afterId = null) => {
  const pageSize = getConfig("pageSize");
  const baseParams = {
    baseUrl: "/v1/entries",
    orderField: "changed_at",
    limit: pageSize,
    status,
    afterId,
  };

  return apiClient.get(buildEntriesUrl(baseParams));
};
