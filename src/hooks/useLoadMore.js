import { useStore } from "@nanostores/react"
import { atom } from "nanostores"

import { contentState, setEntries, setLoadMoreVisible, setOffset } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { parseCoverImage } from "@/utils/images"
import createSetter from "@/utils/nanostores"

const loadingMoreState = atom(false)
const setLoadingMore = createSetter(loadingMoreState)

const isUniqueEntry = (entry, existingEntries) =>
  !existingEntries.some((existing) => existing.id === entry.id)

const useLoadMore = () => {
  const { offset } = useStore(contentState)
  const { pageSize, showStatus } = useStore(settingsState)

  /* 加载更多 loading*/
  const loadingMore = useStore(loadingMoreState)

  const updateEntries = (newEntries) => {
    const uniqueNewEntries = (existingEntries, entriesToAdd) =>
      entriesToAdd.filter((entry) => isUniqueEntry(entry, existingEntries))

    setEntries((prev) => [...prev, ...uniqueNewEntries(prev, newEntries)])
    setOffset((prev) => prev + pageSize)
  }

  const handleLoadMore = async (getEntries) => {
    setLoadingMore(true)

    try {
      let response

      switch (showStatus) {
        case "starred":
          response = await getEntries(offset + pageSize, null, true)
          break
        case "unread":
          response = await getEntries(offset + pageSize, "unread")
          break
        default:
          response = await getEntries(offset + pageSize)
          break
      }

      if (response?.entries?.length > 0) {
        const newEntries = response.entries.map(parseCoverImage)
        updateEntries(newEntries)
      } else {
        setLoadMoreVisible(false)
      }
    } catch (error) {
      console.error("Error fetching more articles: ", error)
    } finally {
      setLoadingMore(false)
    }
  }

  return { handleLoadMore, loadingMore }
}

export default useLoadMore
