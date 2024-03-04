import { Message } from "@arco-design/web-react";
import Content from "./components/Content";
import { getCurrentUser } from "./apis";
import { thunder } from "./apis/axios";

export default function All() {
  async function getFeedEntries() {
    try {
      const response = await thunder.request({
        method: "get",
        url: `/v1/entries?order=published_at&direction=desc`,
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
