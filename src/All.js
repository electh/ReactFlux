import { Message } from "@arco-design/web-react";
import Content from "./components/Content";
import { getCurrentUser } from "./apis";
import { thunder } from "./apis/axios";

export default function All() {
  const getEntries = async (offset = 0, status = null) => {
    const base_url = `/v1/entries?order=published_at&direction=desc&offset=${offset}`;
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
    const currentUser = await getCurrentUser();
    try {
      const response = await thunder.request({
        method: "put",
        url: `/v1/users/${currentUser.data.id}/mark-all-as-read`,
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
      info={{ from: "all", id: "" }}
      getEntries={getEntries}
      markAllAsRead={markAllAsRead}
    />
  );
}
