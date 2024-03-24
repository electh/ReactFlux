import { get24HoursAgoTimestamp } from "../utils/Date";
import { apiClient } from "./axios";

export async function updateEntriesStatus(entryIds, newStatus) {
  return apiClient.put("/v1/entries", {
    entry_ids: entryIds,
    status: newStatus,
  });
}

export async function updateEntryStatus(entryId, newStatus) {
  return updateEntriesStatus([entryId], newStatus);
}

export async function toggleEntryStarred(entryId) {
  return apiClient.put(`/v1/entries/${entryId}/bookmark`);
}

export async function fetchOriginalArticle(entryId) {
  return apiClient.get(`/v1/entries/${entryId}/fetch-content`);
}

export async function getCurrentUser() {
  return apiClient.get("/v1/me");
}

export async function getUnreadInfo() {
  return apiClient.get("/v1/feeds/counters");
}

export async function getFeeds() {
  return apiClient.get("/v1/feeds");
}

export async function getGroups() {
  return apiClient.get("/v1/categories");
}

export async function deleteGroup(id) {
  return apiClient.delete(`/v1/categories/${id}`);
}

export async function addGroup(title) {
  return apiClient.post("/v1/categories", { title });
}

export async function editGroup(id, newTitle) {
  return apiClient.put(`/v1/categories/${id}`, { title: newTitle });
}

export async function editFeed(feedId, newUrl, newTitle, groupId, isFullText) {
  return apiClient.put(`/v1/feeds/${feedId}`, {
    feed_url: newUrl,
    title: newTitle,
    category_id: groupId,
    crawler: isFullText,
  });
}

export async function deleteFeed(feedId) {
  return apiClient.delete(`/v1/feeds/${feedId}`);
}

export async function addFeed(feedUrl, groupId, isFullText) {
  return apiClient.post("/v1/feeds", {
    feed_url: feedUrl,
    category_id: groupId,
    crawler: isFullText,
  });
}

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
