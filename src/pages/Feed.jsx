import { useParams } from "react-router-dom";

import { useAtomValue } from "jotai";
import { buildEntriesUrl, markFeedAsRead } from "../apis";
import { apiClient } from "../apis/axios";
import { configAtom } from "../atoms/configAtom";
import Content from "../components/Content/Content";

const Feed = () => {
  const { id: feedId } = useParams();
  const { orderBy, pageSize } = useAtomValue(configAtom);

  const getFeedEntries = async (status = null, afterId = null) => {
    const baseParams = {
      baseUrl: `/v1/feeds/${feedId}/entries`,
      orderField: orderBy,
      limit: pageSize,
      status,
      afterId,
    };

    return apiClient.get(buildEntriesUrl(baseParams));
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
