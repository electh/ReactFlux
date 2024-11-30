import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import { getFeedIcon } from "@/apis"
import { defaultIcon, feedIconsState } from "@/store/feedIconsState"

const loadingIcons = new Set()

const useFeedIcons = (id) => {
  const feedIcons = useStore(feedIconsState)

  useEffect(() => {
    if (feedIcons[id] || loadingIcons.has(id)) {
      return
    }

    loadingIcons.add(id)

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

    return () => {
      loadingIcons.delete(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return feedIcons[id]
}

export default useFeedIcons
