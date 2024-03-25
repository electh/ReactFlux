import { get24HoursAgoTimestamp } from "../utils/Date";
import { apiClient } from "./axios";

export const updateEntriesStatus = async (entryIds, newStatus) =>
  apiClient.put("/v1/entries", {
    entry_ids: entryIds,
    status: newStatus,
  });

export const updateEntryStatus = async (entryId, newStatus) =>
  updateEntriesStatus([entryId], newStatus);

export const toggleEntryStarred = async (entryId) =>
  apiClient.put(`/v1/entries/${entryId}/bookmark`);

export const fetchOriginalArticle = async (entryId) =>
  apiClient.get(`/v1/entries/${entryId}/fetch-content`);

export const getCurrentUser = async () => apiClient.get("/v1/me");

export const getUnreadInfo = async () => apiClient.get("/v1/feeds/counters");

export const getFeeds = async () => apiClient.get("/v1/feeds");

export const getGroups = async () => apiClient.get("/v1/categories");

export const deleteGroup = async (id) =>
  apiClient.delete(`/v1/categories/${id}`);

export const addGroup = async (title) =>
  apiClient.post("/v1/categories", { title });

export const editGroup = async (id, newTitle) =>
  apiClient.put(`/v1/categories/${id}`, { title: newTitle });

export const editFeed = async (feedId, newUrl, newTitle, groupId, isFullText) =>
  apiClient.put(`/v1/feeds/${feedId}`, {
    feed_url: newUrl,
    title: newTitle,
    category_id: groupId,
    crawler: isFullText,
  });

export const refreshFeed = async (feedId) =>
  apiClient.put(`/v1/feeds/${feedId}/refresh`);

export const deleteFeed = async (feedId) =>
  apiClient.delete(`/v1/feeds/${feedId}`);

export const addFeed = async (feedUrl, groupId, isFullText) =>
  apiClient.post("/v1/feeds", {
    feed_url: feedUrl,
    category_id: groupId,
    crawler: isFullText,
  });

export const getAllEntries = async (offset = 0, status = null) => {
  const base_url = `/v1/entries?order=published_at&direction=desc&offset=${offset}`;
  const url = status ? `${base_url}&status=${status}` : base_url;
  return apiClient.get(url);
};

export const getHistoryEntries = async (offset = 0) => {
  const url = `/v1/entries?order=changed_at&direction=desc&status=read&offset=${offset}`;
  return apiClient.get(url);
};

export const getStarredEntries = async (offset = 0, status = null) => {
  const baseUrl = `/v1/entries?order=published_at&direction=desc&starred=true&offset=${offset}`;
  const url = status ? `${baseUrl}&status=${status}` : baseUrl;
  return apiClient.get(url);
};

export const getTodayEntries = async (
  offset = 0,
  status = null,
  limit = null,
) => {
  const timestamp = get24HoursAgoTimestamp();
  let url = `/v1/entries?order=published_at&direction=desc&published_after=${timestamp}&offset=${offset}`;
  if (status) {
    url += `&status=${status}`;
  }
  if (limit) {
    url += `&limit=${limit}`;
  }
  return apiClient.get(url);
};
