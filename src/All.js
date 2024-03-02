import axios from "axios";
import { Message } from "@arco-design/web-react";
import Content from "./components/Content";
import { getCurrentUser } from "./apis";

export default function All() {
  async function getFeedEntries() {
    try {
      const response = await axios({
        method: "get",
        url: `/v1/entries?order=published_at&direction=desc`,
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

  async function markAllAsRead() {
    const currentUser = await getCurrentUser();
    try {
      const response = await axios({
        method: "put",
        url: `/v1/users/${currentUser.id}/mark-all-as-read`,
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

  return (
    <>
      <Content
        info={{ from: "all", id: "" }}
        getEntries={getFeedEntries}
        markAllAsRead={markAllAsRead}
      />
    </>
  );
}
