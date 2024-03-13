import { useParams } from "react-router-dom";

import { thunder } from "./apis/axios";
import Content from "./components/Content";
import { ContentProvider } from "./components/ContentContext";

export default function Feed() {
  const { f_id } = useParams();

  const getFeedEntries = async (offset = 0, status = null) => {
    const base_url = `/v1/feeds/${f_id}/entries?order=published_at&direction=desc&offset=${offset}`;
    const url = status ? `${base_url}&status=${status}` : base_url;
    return await thunder.request({ method: "get", url });
  };

  const markAllAsRead = async () => {
    return await thunder.request({
      method: "put",
      url: `/v1/feeds/${f_id}/mark-all-as-read`,
    });
  };

  return (
    <ContentProvider>
      <Content
        info={{ from: "feed", id: f_id }}
        getEntries={getFeedEntries}
        markAllAsRead={markAllAsRead}
      />
    </ContentProvider>
  );
}
