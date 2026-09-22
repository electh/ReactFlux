import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import { getFeedIcon } from "@/apis"
import { authState } from "@/store/authState"
import { dataState, getDataSessionRevision } from "@/store/dataState"
import { defaultIcon, feedIconsState } from "@/store/feedIconsState"

const pendingIconRequests = new Map()

const isCurrentIconRequest = (id, request) =>
  pendingIconRequests.get(id) === request && request.sessionRevision === getDataSessionRevision()

const loadFeedIcon = async (id, request) => {
  try {
    const { data: iconData } = await getFeedIcon(id)
    if (!isCurrentIconRequest(id, request)) {
      return
    }

    feedIconsState.setKey(id, { ...defaultIcon, url: `data:${iconData}` })
  } catch {
    // FeedIcon falls back to the website icon when the API icon cannot be loaded.
  } finally {
    if (pendingIconRequests.get(id) === request) {
      pendingIconRequests.delete(id)
    }
  }
}

const useFeedIcons = (id, feed = null) => {
  const { server } = useStore(authState)
  const { sessionRevision } = useStore(dataState, { keys: ["sessionRevision"] })
  const feedIcons = useStore(feedIconsState)
  const feedIcon = feedIcons[id]
  const externalIconId = feed?.icon?.external_icon_id

  useEffect(() => {
    if (externalIconId) {
      pendingIconRequests.delete(id)

      const iconURL = `${server}/feed-icon/${externalIconId}`
      if (feedIcon?.url !== iconURL) {
        feedIconsState.setKey(id, { ...defaultIcon, url: iconURL })
      }
      return
    }

    if (feedIcon) {
      return
    }

    const pendingRequest = pendingIconRequests.get(id)
    if (pendingRequest?.sessionRevision === sessionRevision && pendingRequest.server === server) {
      return
    }

    const request = { server, sessionRevision }
    pendingIconRequests.set(id, request)
    void loadFeedIcon(id, request)
  }, [externalIconId, feedIcon, id, server, sessionRevision])

  return feedIcon
}

export default useFeedIcons
