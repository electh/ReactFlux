import React from "react";
import { useParams } from "react-router-dom";

import { apiClient } from "../apis/axios";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";

const Feed = () => {
  const { f_id } = useParams();

  const getFeedEntries = async (offset = 0, status = null) => {
    const base_url = `/v1/feeds/${f_id}/entries?order=published_at&direction=desc&offset=${offset}`;
    const url = status ? `${base_url}&status=${status}` : base_url;
    return apiClient.get(url);
  };

  const markFeedAsRead = async () => {
    return apiClient.put(`/v1/feeds/${f_id}/mark-all-as-read`);
  };

  return (
    <ContentProvider>
      <Content
        info={{ from: "feed", id: f_id }}
        getEntries={getFeedEntries}
        markAllAsRead={markFeedAsRead}
      />
    </ContentProvider>
  );
};

export default Feed;
