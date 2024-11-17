import { useStore } from "@nanostores/react"
import { useEffect } from "react"
import { useLocation } from "react-router-dom"

import { setEntries } from "@/store/contentState"
import { feedIconsState } from "@/store/feedIconsState"

const useFeedIconsSync = () => {
  const feedIcons = useStore(feedIconsState)

  const { pathname } = useLocation()

  useEffect(() => {
    setEntries((prev) =>
      prev.map((entry) => {
        const feedIconId = entry.feed.icon.icon_id
        const feedIcon = feedIcons[feedIconId]
        if (entry.isMedia && feedIcon?.width) {
          return {
            ...entry,
            coverSource: feedIcon.url,
          }
        }
        return entry
      }),
    )
  }, [feedIcons, pathname])
}

export default useFeedIconsSync
