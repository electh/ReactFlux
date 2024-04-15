import React from "react";
import { useParams } from "react-router-dom";

import { apiClient } from "../apis/axios";
import { buildEntriesUrl } from "../apis/index";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";
import { useConfigAtom } from "../hooks/useConfigAtom";

const Group = () => {
  const { id: groupId } = useParams();
  const { config } = useConfigAtom();
  const { orderBy, orderDirection, pageSize } = config;
  const getGroupEntries = async (offset = 0, status = null) => {
    const baseParams = {
      baseUrl: `/v1/categories/${groupId}/entries`,
      orderField: orderBy,
      direction: orderDirection,
      offset,
      limit: pageSize,
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
