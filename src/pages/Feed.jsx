import { useParams } from "react-router-dom";

import { useStore } from "@nanostores/react";
import { buildEntriesUrl, markFeedAsRead } from "../apis";
import { apiClient } from "../apis/ofetch";
import Content from "../components/Content/Content";
import { settingsState } from "../store/settingsState";

const Feed = () => {
  const { id: feedId } = useParams();
  const { orderBy, pageSize } = useStore(settingsState);

  const getFeedEntries = async (offset = 0, status = null) => {
    const baseParams = {
      baseUrl: `/v1/feeds/${feedId}/entries`,
      orderField: orderBy,
      offset,
      limit: pageSize,
      status,
    };

    return apiClient.get(buildEntriesUrl(baseParams));
  };

  return (
    <Content
      info={{ from: "feed", id: feedId }}
      getEntries={getFeedEntries}
      markAllAsRead={() => markFeedAsRead(feedId)}
    />
  );
};

export default Feed;
