import { get24HoursAgoUnixTimestamp } from "../utils/Date";
import { thunder } from "./axios";

export async function updateEntryStatus(entry, status = "toggle") {
  let newStatus;
  if (status === "toggle") {
    newStatus = entry.status === "read" ? "unread" : "read";
  } else {
    newStatus = status;
  }

  return await thunder.request({
    method: "put",
    url: "/v1/entries",
    data: { entry_ids: [entry.id], status: newStatus },
  });
}

export async function updateEntryStarred(entry) {
  return await thunder.request({
    method: "put",
    url: `/v1/entries/${entry.id}/bookmark`,
  });
}

export async function getCurrentUser() {
  return await thunder.request({ method: "get", url: "/v1/me" });
}

export async function getUnreadInfo() {
  return await thunder.request({ method: "get", url: "/v1/feeds/counters" });
}

export async function getFeeds() {
  return await thunder.request({ method: "get", url: "/v1/feeds" });
}

export async function getGroups() {
  return await thunder.request({ method: "get", url: "/v1/categories" });
}

export async function delGroup(id) {
  return await thunder.request({
    method: "delete",
    url: `/v1/categories/${id}`,
  });
}

export async function addGroup(title) {
  return await thunder.request({
    method: "post",
    url: "/v1/categories",
    headers: { "Content-Type": "application/json" },
    data: { title: title },
  });
}

export async function editGroup(id, newTitle) {
  return await thunder.request({
    method: "put",
    url: `/v1/categories/${id}`,
    headers: { "Content-Type": "application/json" },
    data: { title: newTitle },
  });
}

export async function editFeed(
  feed_id,
  newUrl,
  newTitle,
  group_id,
  is_full_text,
) {
  return await thunder.request({
    method: "put",
    url: `/v1/feeds/${feed_id}`,
    headers: { "Content-Type": "application/json" },
    data: {
      feed_url: newUrl,
      title: newTitle,
      category_id: group_id,
      crawler: is_full_text,
    },
  });
}

export async function deleteFeed(feed_id) {
  return await thunder.request({
    method: "delete",
    url: `/v1/feeds/${feed_id}`,
  });
}

export async function addFeed(feed_url, group_id, is_full_text) {
  return await thunder.request({
    method: "post",
    url: "/v1/feeds",
    headers: { "Content-Type": "application/json" },
    data: { feed_url: feed_url, category_id: group_id, crawler: is_full_text },
  });
}

export const getHistoryEntries = async (offset = 0) => {
  const url = `/v1/entries?order=changed_at&direction=desc&status=read&offset=${offset}`;
  return await thunder.request({ method: "get", url });
};

export const getStarredEntries = async (offset = 0, status = null) => {
  const base_url = `/v1/entries?order=published_at&direction=desc&starred=true&offset=${offset}`;
  const url = status ? `${base_url}&status=${status}` : base_url;
  return await thunder.request({ method: "get", url });
};

export const getTodayEntries = async (offset = 0, status = null) => {
  const timestamp = get24HoursAgoUnixTimestamp();
  const base_url = `/v1/entries?order=published_at&direction=desc&published_after=${timestamp}&offset=${offset}`;
  const url = status ? `${base_url}&status=${status}` : base_url;
  return await thunder.request({ method: "get", url });
};
