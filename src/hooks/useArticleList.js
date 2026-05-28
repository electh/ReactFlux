import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import {
  contentState,
  setEntriesWithDeduplication,
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
import createArticleListRequestKey from "@/utils/article-list-request-key"
import { parseCoverImage } from "@/utils/images"
import { extractBasicSearchTerms } from "@/utils/kmp"

const handleResponses = (response) => {
  if (response?.total >= 0) {
    const articles = response.entries.map((entry) => parseCoverImage(entry))
    setEntriesWithDeduplication(articles)
    setTotal(response.total)
    setLoadMoreVisible(articles.length < response.total)
  }
}

const useArticleList = (info, getEntries) => {
  const content = useStore(contentState)
  const { filterDate, filterString } = content
  const { isAppDataReady } = useStore(dataState)
  const settings = useStore(settingsState)
  const { showStatus } = settings

  const latestRequestId = useRef(0)
  const loadingRequestKey = useRef(null)

  const fetchArticleList = async (getEntries) => {
    const requestKey = createArticleListRequestKey({ content, settings, info })
    if (loadingRequestKey.current === requestKey) {
      return
    }

    loadingRequestKey.current = requestKey
    const requestId = ++latestRequestId.current
    const isLatestRequest = () => requestId === latestRequestId.current

    setIsArticleListReady(false)

    try {
      let response

      // Build filter params with search query
      // Extract basic search terms
      const filterParams = {}
      const basicSearchTerms = extractBasicSearchTerms(filterString)
      if (basicSearchTerms) {
        filterParams.search = basicSearchTerms
      }

      switch (showStatus) {
        case "starred": {
          response = await getEntries(null, true, filterParams)
          break
        }
        case "unread": {
          response = await getEntries("unread", false, filterParams)
          break
        }
        default: {
          response = await getEntries(null, false, filterParams)
          break
        }
      }

      if (!filterDate) {
        switch (info.from) {
          case "feed": {
            if (showStatus === "unread") {
              setUnreadInfo((prev) => ({
                ...prev,
                [Number(info.id)]: response.total,
              }))
            }
            break
          }
          case "history": {
            setHistoryCount(response.total)
            break
          }
          case "starred": {
            if (showStatus === "unread") {
              setUnreadStarredCount(response.total)
            } else {
              setStarredCount(response.total)
            }
            break
          }
          case "today": {
            if (showStatus === "unread") {
              setUnreadTodayCount(response.total)
            }
            break
          }
        }
      }

      if (!isLatestRequest()) {
        return
      }

      handleResponses(response)
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      if (isLatestRequest()) {
        loadingRequestKey.current = null
        setIsArticleListReady(true)
      }
    }
  }

  useEffect(() => {
    if (isAppDataReady) {
      fetchArticleList(getEntries)
    }
  }, [isAppDataReady])

  useEffect(() => {
    return () => {
      latestRequestId.current += 1
      loadingRequestKey.current = null
    }
  }, [])

  return { fetchArticleList }
}

export default useArticleList
