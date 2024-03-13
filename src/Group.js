import { useParams } from "react-router-dom";

import { thunder } from "./apis/axios";
import Content from "./components/Content";
import { ContentProvider } from "./components/ContentContext";

export default function Group() {
  const { c_id } = useParams();

  const getGroupEntries = async (offset = 0, status = null) => {
    const base_url = `/v1/categories/${c_id}/entries?order=published_at&direction=desc&offset=${offset}`;
    const url = status ? `${base_url}&status=${status}` : base_url;

    return await thunder.request({ method: "get", url });
  };

  const markGroupAsRead = async () => {
    return await thunder.request({
      method: "put",
      url: `/v1/categories/${c_id}/mark-all-as-read`,
    });
  };

  return (
    <ContentProvider>
      <Content
        info={{ from: "group", id: c_id }}
        getEntries={getGroupEntries}
        markAllAsRead={markGroupAsRead}
      />
    </ContentProvider>
  );
}
