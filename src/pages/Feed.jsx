import { useParams } from "react-router-dom";

import { useAtomValue } from "jotai";
import { buildEntriesUrl } from "../apis";
import { apiClient } from "../apis/axios";
import { configAtom } from "../atoms/configAtom";
import Content from "../components/Content/Content";

const Feed = () => {
  const { id: feedId } = useParams();
  const config = useAtomValue(configAtom);
  const { orderBy, pageSize } = config;

  const getFeedEntries = async (offset = 0, status = null) => {
    const baseParams = {
      baseUrl: `/v1/feeds/${feedId}/entries`,
      orderField: orderBy,
      offset,
      limit: pageSize,
      status,
    };

    const url = buildEntriesUrl(baseParams);
    return apiClient.get(url);
  };

  const markFeedAsRead = async () => {
    return apiClient.put(`/v1/feeds/${feedId}/mark-all-as-read`);
  };

  return (
    <Content
      info={{ from: "feed", id: feedId }}
      getEntries={getFeedEntries}
      markAllAsRead={markFeedAsRead}
    />
  );
};

export default Feed;
