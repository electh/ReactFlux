import React from "react";
import { useParams } from "react-router-dom";

import { apiClient } from "../apis/axios";
import { buildEntriesUrl } from "../apis/index";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";
import { useConfig } from "../hooks/useConfig";

const Feed = () => {
  const { id: feedId } = useParams();
  const { config } = useConfig();
  const { orderBy, orderDirection, pageSize } = config;

  const getFeedEntries = async (offset = 0, status = null) => {
    const baseParams = {
      baseUrl: `/v1/feeds/${feedId}/entries`,
      orderField: orderBy,
      direction: orderDirection,
      offset,
      limit: pageSize,
      status,
    };

    const url = buildEntriesUrl(baseParams);
    return apiClient.get(url);
  };

  const markFeedAsRead = async () => {
    return apiClient.put(`/v1/feeds/${id}/mark-all-as-read`);
  };

  return (
    <ContentProvider>
      <Content
        info={{ from: "feed", id: feedId }}
        getEntries={getFeedEntries}
        markAllAsRead={markFeedAsRead}
      />
    </ContentProvider>
  );
};

export default Feed;
