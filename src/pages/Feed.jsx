import { partial } from "lodash-es"
import { useParams } from "react-router"

import { getFeedEntries, markFeedAsRead } from "@/apis"
import Content from "@/components/Content/Content"

const Feed = () => {
  const { id: feedId } = useParams()

  const getEntries = partial(getFeedEntries, feedId)

  return (
    <Content
      getEntries={getEntries}
      info={{ from: "feed", id: feedId }}
      markAllAsRead={() => markFeedAsRead(feedId)}
    />
  )
}

export default Feed
