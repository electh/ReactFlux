import React from "react";
import { useParams } from "react-router-dom";

import { apiClient } from "../apis/axios";
import { buildEntriesUrl } from "../apis/index.js";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";
import { getConfig } from "../utils/Config.js";

const Group = () => {
  const { id: groupId } = useParams();

  const getGroupEntries = async (offset = 0, status = null) => {
    const entriesOrder = getConfig("entriesOrder");
    const entriesPerPage = getConfig("entriesPerPage");
    const baseParams = {
      baseUrl: `/v1/categories/${groupId}/entries`,
      orderField: "published_at",
      direction: entriesOrder,
      offset,
      limit: entriesPerPage,
      status,
    };

    const url = buildEntriesUrl(baseParams);
    return apiClient.get(url);
  };

  const markGroupAsRead = async () => {
    return apiClient.put(`/v1/categories/${groupId}/mark-all-as-read`);
  };

  return (
    <ContentProvider>
      <Content
        info={{ from: "group", id: groupId }}
        getEntries={getGroupEntries}
        markAllAsRead={markGroupAsRead}
      />
    </ContentProvider>
  );
};

export default Group;
