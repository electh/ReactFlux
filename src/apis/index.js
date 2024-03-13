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
    url: `/v1/entries`,
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
  return await thunder.request({ method: "get", url: `/v1/me` });
}

export async function getUnreadInfo() {
  return await thunder.request({ method: "get", url: `/v1/feeds/counters` });
}

export async function getFeeds() {
  return await thunder.request({ method: "get", url: `/v1/feeds` });
}

export async function getGroups() {
  return await thunder.request({ method: "get", url: `/v1/categories` });
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
    url: `/v1/categories`,
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

export async function editFeed(feed_id, newTitle, group_id, is_full_text) {
  return await thunder.request({
    method: "put",
    url: `/v1/feeds/${feed_id}`,
    headers: { "Content-Type": "application/json" },
    data: { title: newTitle, category_id: group_id, crawler: is_full_text },
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
    url: `/v1/feeds`,
    headers: { "Content-Type": "application/json" },
    data: { feed_url: feed_url, category_id: group_id, crawler: is_full_text },
  });
}
