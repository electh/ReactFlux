import axios from "axios";
import { Message } from "@arco-design/web-react";

export async function updateEntry(entry) {
  const newStatus = entry.status === "read" ? "unread" : "read";
  try {
    const response = await axios({
      method: "put",
      url: `/v1/entries`,
      baseURL: "https://rss.electh.top",
      headers: {
        "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
      },
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
    const response = await axios({
      method: "get",
      url: `/v1/me`,
      baseURL: "https://rss.electh.top",
      headers: {
        "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
      },
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
    const response = await axios({
      method: "put",
      url: `/v1/entries`,
      baseURL: "https://rss.electh.top",
      headers: {
        "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
      },
      data: { entry_ids: [entry.id], status: "read" },
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    Message.error(error.message);
  }
}
