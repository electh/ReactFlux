import { useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { Message } from "@arco-design/web-react";
import Content from "./components/Content";

export default function Feed() {
  const { f_id } = useParams();

  async function getFeedEntries() {
    try {
      const response = await axios({
        method: "get",
        url: `/v1/feeds/${f_id}/entries?order=published_at&direction=desc`,
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

  async function updateEntry(entry) {
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

  async function markAllAsRead() {
    try {
      const response = await axios({
        method: "put",
        url: `/v1/feeds/${f_id}/mark-all-as-read`,
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

  async function clickEntryList(entry) {
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

  return (
    <>
      <Content
        info={{ from: "feed", id: { f_id } }}
        getEntries={getFeedEntries}
        updateEntry={updateEntry}
        markAllAsRead={markAllAsRead}
        clickEntryList={clickEntryList}
      />
    </>
  );
}
