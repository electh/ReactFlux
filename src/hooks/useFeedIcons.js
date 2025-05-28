import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import { getFeedIcon } from "@/apis"
import { authState } from "@/store/authState"
import { defaultIcon, feedIconsState } from "@/store/feedIconsState"

const loadingIcons = new Set()

const useFeedIcons = (id, feed = null) => {
  const auth = useStore(authState)
  const feedIcons = useStore(feedIconsState)

  useEffect(() => {
    if (feedIcons[id] || loadingIcons.has(id)) {
      return
    }

    loadingIcons.add(id)

    if (feed?.icon?.external_icon_id) {
      const iconURL = `${auth.server}/feed/icon/${feed.icon.external_icon_id}`

      feedIconsState.setKey(id, { ...defaultIcon, url: iconURL })
      loadingIcons.delete(id)
    } else {
      getFeedIcon(id)
        .then((data) => {
          const iconURL = `data:${data.data}`
          feedIconsState.setKey(id, { ...defaultIcon, url: iconURL })
          loadingIcons.delete(id)
          return null
        })
        .catch(() => {
          loadingIcons.delete(id)
        })
    }

    return () => {
      loadingIcons.delete(id)
    }
  }, [id])

  return feedIcons[id]
}

export default useFeedIcons
