import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

import { markDuplicatesAsRead } from "@/hooks/useEntryActions"
import {
  contentState,
  setArticleListError,
  setEntries,
  setEntriesWithDeduplication,
  setIsArticleListReady,
  setLoadMoreError,
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

const handleResponses = (response) => {
  const isValidResponse =
    Array.isArray(response?.entries) && Number.isFinite(response?.total) && response.total >= 0
  if (!isValidResponse) {
    throw new TypeError("Invalid entries response")
  }

  const preparedEntries = response.entries.map((entry) => prepareEntry(entry))
  const duplicateEntries = setEntriesWithDeduplication(preparedEntries)
  markDuplicatesAsRead(duplicateEntries)
  setTotal(response.total)
  setLoadMoreVisible(preparedEntries.length < response.total)
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
  const currentRequestKey = useRef(null)

  useLayoutEffect(() => {
    if (currentRequestKey.current === automaticRequestKey) {
      return
    }

    currentRequestKey.current = automaticRequestKey
    setArticleListError(false)
    setLoadMoreError(false)
    setIsArticleListReady(false)
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

    setArticleListError(false)
    setLoadMoreError(false)
    setIsArticleListReady(false)

    try {
      const filterParams = content.filterString ? { search: content.filterString } : {}

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

      handleResponses(response)

      if (!content.filterDate && !content.filterString) {
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
    } catch (error) {
      if (!isLatestRequest()) {
        return
      }

      console.error("Error fetching articles:", error)
      setEntries([])
      setTotal(0)
      setLoadMoreVisible(false)
      setArticleListError(true)
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
