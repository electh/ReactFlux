import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import {
  contentState,
  setEntries,
  setIsArticleListReady,
  setLoadMoreVisible,
  setTotal,
} from "@/store/contentState"
import {
  dataState,
  setHistoryCount,
  setStarredCount,
  setUnreadInfo,
  setUnreadStarredCount,
  setUnreadTodayCount,
} from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import { parseCoverImage } from "@/utils/images"

const handleResponses = (response) => {
  if (response?.total >= 0) {
    const articles = response.entries.map(parseCoverImage)
    setEntries(articles)
    setTotal(response.total)
    setLoadMoreVisible(articles.length < response.total)
  }
}

const useArticleList = (info, getEntries) => {
  const { filterDate } = useStore(contentState)
  const { isAppDataReady } = useStore(dataState)
  const { showStatus } = useStore(settingsState)

  const isLoading = useRef(false)

  const fetchArticleList = async (getEntries) => {
    if (isLoading.current) {
      return
    }

    isLoading.current = true
    setIsArticleListReady(false)

    try {
      let response

      switch (showStatus) {
        case "starred":
          response = await getEntries(0, null, true)
          break
        case "unread":
          response = await getEntries(0, "unread")
          break
        default:
          response = await getEntries()
          break
      }

      if (!filterDate) {
        switch (info.from) {
          case "feed":
            if (showStatus === "unread") {
              setUnreadInfo((prev) => ({
                ...prev,
                [Number(info.id)]: response.total,
              }))
            }
            break
          case "history":
            setHistoryCount(response.total)
            break
          case "starred":
            if (showStatus === "unread") {
              setUnreadStarredCount(response.total)
            } else {
              setStarredCount(response.total)
            }
            break
          case "today":
            if (showStatus === "unread") {
              setUnreadTodayCount(response.total)
            }
            break
        }
      }

      handleResponses(response)
    } catch (error) {
      console.error("Error fetching articles: ", error)
    } finally {
      isLoading.current = false
      setIsArticleListReady(true)
    }
  }

  useEffect(() => {
    if (isAppDataReady) {
      fetchArticleList(getEntries)
    }
  }, [isAppDataReady])

  return { fetchArticleList }
}

export default useArticleList
