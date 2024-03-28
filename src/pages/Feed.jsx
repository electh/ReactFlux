import React from "react";
import { useParams } from "react-router-dom";

import useStore from "../Store.js";
import { apiClient } from "../apis/axios";
import { buildEntriesUrl } from "../apis/index.js";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";

const Feed = () => {
  const { id: feedId } = useParams();
  const orderBy = useStore((state) => state.orderBy);
  const orderDirection = useStore((state) => state.orderDirection);
  const pageSize = useStore((state) => state.pageSize);

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
