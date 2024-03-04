import { thunder } from "./axios";
import { Message } from "@arco-design/web-react";

export async function updateEntry(entry) {
  const newStatus = entry.status === "read" ? "unread" : "read";
  try {
    const response = await thunder.request({
      method: "put",
      url: `/v1/entries`,
      data: { entry_ids: [entry.id], status: newStatus },
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    Message.error(error.message);
  }
}

export async function getCurrentUser() {
  try {
    const response = await thunder.request({
      method: "get",
      url: `/v1/me`,
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    Message.error(error.message);
  }
}

export async function clickEntryList(entry) {
  try {
    const response = await thunder.request({
      method: "put",
      url: `/v1/entries`,
      data: { entry_ids: [entry.id], status: "read" },
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    Message.error(error.message);
  }
}

export async function getUnreadInfo() {
  try {
    const response = await thunder.request({
      method: "get",
      url: `/v1/feeds/counters`,
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    Message.error(error.message);
  }
}

export async function getFeeds() {
  try {
    const response = await thunder.request({
      method: "get",
      url: `/v1/feeds`,
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    Message.error(error.message);
  }
}

export async function getGroups() {
  try {
    const response = await thunder.request({
      method: "get",
      url: `/v1/categories`,
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    Message.error(error.message);
  }
}
