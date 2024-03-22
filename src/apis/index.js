import { get24HoursAgoTimestamp } from "../utils/Date";
import { apiClient } from "./axios";

export async function updateEntryStatus(entry, status = "toggle") {
  let newStatus;
  if (status === "toggle") {
    newStatus = entry.status === "read" ? "unread" : "read";
  } else {
    newStatus = status;
  }

  return apiClient.put("/v1/entries", {
    entry_ids: [entry.id],
    status: newStatus,
  });
}

export async function toggleEntryStarred(entry) {
  return apiClient.put(`/v1/entries/${entry.id}/bookmark`);
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

export async function editFeed(feed_id, newUrl, newTitle, groupId, isFullText) {
  return apiClient.put(`/v1/feeds/${feed_id}`, {
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

export const getHistoryEntries = async (offset = 0) => {
  const url = `/v1/entries?order=changed_at&direction=desc&status=read&offset=${offset}`;
  return apiClient.get(url);
};

export const getStarredEntries = async (offset = 0, status = null) => {
  const baseUrl = `/v1/entries?order=published_at&direction=desc&starred=true&offset=${offset}`;
  const url = status ? `${baseUrl}&status=${status}` : baseUrl;
  return apiClient.get(url);
};

export const getTodayEntries = async (offset = 0, status = null) => {
  const timestamp = get24HoursAgoTimestamp();
  const baseUrl = `/v1/entries?order=published_at&direction=desc&published_after=${timestamp}&offset=${offset}`;
  const url = status ? `${baseUrl}&status=${status}` : baseUrl;
  return apiClient.get(url);
};
