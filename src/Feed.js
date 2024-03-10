import { useParams } from "react-router-dom";
import { Message } from "@arco-design/web-react";
import Content from "./components/Content";
import { thunder } from "./apis/axios";

export default function Feed() {
  const { f_id } = useParams();

  const getFeedEntries = async (offset = 0, status = null) => {
    const base_url = `/v1/feeds/${f_id}/entries?order=published_at&direction=desc&offset=${offset}`;
    const url = status ? `${base_url}&status=${status}` : base_url;
    try {
      const response = await thunder.request({ method: "get", url });
      console.log(response);
      return response;
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await thunder.request({
        method: "put",
        url: `/v1/feeds/${f_id}/mark-all-as-read`,
      });
      console.log(response);
      return response;
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
  };

  return (
    <Content
      info={{ from: "feed", id: f_id }}
      getEntries={getFeedEntries}
      markAllAsRead={markAllAsRead}
    />
  );
}
