import React from "react";
import { useParams } from "react-router-dom";

import { apiClient } from "../apis/axios";
import { buildEntriesUrl } from "../apis/index.js";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";
import { getConfig } from "../utils/Config.js";

const Feed = () => {
  const { id: feedId } = useParams();

  const getFeedEntries = async (offset = 0, status = null) => {
    const entriesOrder = getConfig("entriesOrder");
    const entriesPerPage = getConfig("entriesPerPage");
    const baseParams = {
      baseUrl: `/v1/feeds/${feedId}/entries`,
      orderField: "published_at",
      direction: entriesOrder,
      offset,
      limit: entriesPerPage,
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
