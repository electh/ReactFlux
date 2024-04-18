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

export const getCurrentUser = async () => apiClient.get("/v1/me");

export const getUnreadInfo = async () => apiClient.get("/v1/feeds/counters");

export const getFeeds = async () => apiClient.get("/v1/feeds");

export const getCategories = async () => apiClient.get("/v1/categories");

export const deleteCategory = async (id) =>
  apiClient.delete(`/v1/categories/${id}`);

export const addCategory = async (title) =>
  apiClient.post("/v1/categories", { title });

export const updateCategory = async (id, newTitle, hidden = false) => {
  const params = { title: newTitle, hide_globally: hidden ? "on" : undefined };
  return apiClient.put(`/v1/categories/${id}`, params);
};

export const updateFeed = async (id, newDetails) => {
  const { url, title, categoryId, isFullText, hidden = false } = newDetails;

  return apiClient.put(`/v1/feeds/${id}`, {
    feed_url: url,
    title,
    category_id: categoryId,
    crawler: isFullText,
    hide_globally: hidden,
  });
};

export const refreshFeed = async (id) =>
  apiClient.put(`/v1/feeds/${id}/refresh`);

export const deleteFeed = async (id) => apiClient.delete(`/v1/feeds/${id}`);

export const addFeed = async (url, categoryId, isFullText) =>
  apiClient.post("/v1/feeds", {
    feed_url: url,
    category_id: categoryId,
    crawler: isFullText,
  });

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

  return `${baseUrl}?${queryParams.toString()}`;
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
