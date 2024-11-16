import { useStore } from "@nanostores/react"
import { map } from "nanostores"
import { useEffect } from "react"

import { getFeedIcon } from "@/apis"

const defaultIcon = { url: null, width: null, height: null }
export const feedIconsState = map({ 0: defaultIcon })
export const resetFeedIcons = () => feedIconsState.set({ 0: defaultIcon })
export const updateFeedIcon = (id, feedIconChanges) =>
  feedIconsState.setKey(id, { ...feedIconsState.get()[id], ...feedIconChanges })
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
  }, [id, feedIcons])

  return feedIcons[id]
}

export default useFeedIcons
