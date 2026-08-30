import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

import { markDuplicatesAsRead } from "@/hooks/useEntryActions"
import {
  contentState,
  setEntriesWithDeduplication,
  setIsArticleListReady,
  setLoadMoreVisible,
  setTotal,
} from "@/store/contentState"
import {
  setHistoryCount,
  setStarredCount,
  setUnreadInfo,
  setUnreadStarredCount,
  setUnreadTodayCount,
} from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import createArticleListRequestKey from "@/utils/article-list-request-key"
import prepareEntry from "@/utils/entry-presentation"
import { extractBasicSearchTerms } from "@/utils/kmp"

const handleResponses = (response) => {
  if (response?.total >= 0) {
    const articles = response.entries.map((entry) => prepareEntry(entry))
    const duplicateEntries = setEntriesWithDeduplication(articles)
    markDuplicatesAsRead(duplicateEntries)
    setTotal(response.total)
    setLoadMoreVisible(articles.length < response.total)
  }
}

const useArticleList = (source, sourceId, getEntries) => {
  const contentSnapshot = useStore(contentState)
  const settingsSnapshot = useStore(settingsState)
  const automaticRequestKey = createArticleListRequestKey({
    content: contentSnapshot,
    settings: settingsSnapshot,
    info: { from: source, id: sourceId },
  })

  const latestRequestId = useRef(0)
  const loadingRequestKey = useRef(null)
  const currentRequestKey = useRef(automaticRequestKey)

  useLayoutEffect(() => {
    currentRequestKey.current = automaticRequestKey
  }, [automaticRequestKey])

  const fetchArticleList = useCallback(async () => {
    const content = contentState.get()
    const settings = settingsState.get()
    const info = { from: source, id: sourceId }
    const requestKey = createArticleListRequestKey({ content, settings, info })

    if (loadingRequestKey.current === requestKey) {
      return
    }

    loadingRequestKey.current = requestKey
    const requestId = ++latestRequestId.current
    const isLatestRequest = () =>
      requestId === latestRequestId.current &&
      requestKey === currentRequestKey.current &&
      requestKey ===
        createArticleListRequestKey({
          content: contentState.get(),
          settings: settingsState.get(),
          info,
        })

    setIsArticleListReady(false)

    try {
      const basicSearchTerms = extractBasicSearchTerms(content.filterString)
      const filterParams = basicSearchTerms ? { search: basicSearchTerms } : {}

      let response
      switch (settings.showStatus) {
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

      if (!isLatestRequest()) {
        return
      }

      if (!content.filterDate) {
        switch (source) {
          case "feed": {
            if (settings.showStatus === "unread") {
              setUnreadInfo((previous) => ({
                ...previous,
                [Number(sourceId)]: response.total,
              }))
            }
            break
          }
          case "history": {
            setHistoryCount(response.total)
            break
          }
          case "starred": {
            if (settings.showStatus === "unread") {
              setUnreadStarredCount(response.total)
            } else {
              setStarredCount(response.total)
            }
            break
          }
          case "today": {
            if (settings.showStatus === "unread") {
              setUnreadTodayCount(response.total)
            }
            break
          }
        }
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
  }, [getEntries, source, sourceId])

  useEffect(() => {
    void fetchArticleList()

    return () => {
      latestRequestId.current += 1
      loadingRequestKey.current = null
    }
  }, [automaticRequestKey, fetchArticleList])

  return { fetchArticleList }
}

export default useArticleList
