import { useParams } from "react-router-dom";

import { apiClient } from "../apis/axios";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";

const Group = () => {
  const { c_id } = useParams();

  const getGroupEntries = async (offset = 0, status = null) => {
    const base_url = `/v1/categories/${c_id}/entries?order=published_at&direction=desc&offset=${offset}`;
    const url = status ? `${base_url}&status=${status}` : base_url;
    return apiClient.get(url);
  };

  const markGroupAsRead = async () => {
    return apiClient.put(`/v1/categories/${c_id}/mark-all-as-read`);
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
};

export default Group;
