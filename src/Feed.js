import { useParams } from "react-router-dom";
import axios from "axios";
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

  return (
    <>
      <Content
        info={{ from: "feed", id: { f_id } }}
        getEntries={getFeedEntries}
        markAllAsRead={markAllAsRead}
      />
    </>
  );
}
