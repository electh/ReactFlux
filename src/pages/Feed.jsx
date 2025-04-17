import { useParams } from "react-router"

import { buildEntriesUrl, markFeedAsRead } from "@/apis"
import apiClient from "@/apis/ofetch"
import Content from "@/components/Content/Content"
import { getSettings } from "@/store/settingsState"

const Feed = () => {
  const { id: feedId } = useParams()
  const orderBy = getSettings("orderBy")
  const pageSize = getSettings("pageSize")

  const getFeedEntries = async (offset = 0, status = null, starred = false) => {
    const baseParams = {
      baseUrl: `/v1/feeds/${feedId}/entries`,
      orderField: orderBy,
      offset,
      limit: pageSize,
      status,
    }

    const extraParams = { starred }

    return apiClient.get(buildEntriesUrl(baseParams, extraParams))
  }

  return (
    <Content
      getEntries={getFeedEntries}
      info={{ from: "feed", id: feedId }}
      markAllAsRead={() => markFeedAsRead(feedId)}
    />
  )
}

export default Feed
