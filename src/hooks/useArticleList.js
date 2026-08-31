import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

import { markDuplicatesAsRead } from "@/hooks/useEntryActions"
import {
  contentState,
  incrementArticleListSnapshotRevision,
  setArticleListError,
  setEntries,
  setEntriesWithDeduplication,
  setIsArticleListReady,
  setLoadMoreError,
  setLoadMoreVisible,
  setTotal,
} from "@/store/contentState"
import {
  getDataSessionRevision,
  setHistoryCount,
  setStarredCount,
  setUnreadInfo,
  setUnreadStarredCount,
  setUnreadTodayCount,
} from "@/store/dataState"
import { articleListRequestSettingsState, settingsState } from "@/store/settingsState"
import createArticleListRequestKey from "@/utils/article-list-request-key"
import {
  getEntryMutationSnapshot,
  isEntryMutationSnapshotCurrent,
  waitForEntryMutations,
} from "@/utils/entry-mutation-state"
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
  incrementArticleListSnapshotRevision()
}

const useArticleList = (source, sourceId, getEntries) => {
  const contentSnapshot = useStore(contentState, {
    keys: ["articleListRevision", "filterDate", "filterString", "infoFrom", "infoId"],
  })
  const settingsSnapshot = useStore(articleListRequestSettingsState)
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
    const requestSessionRevision = getDataSessionRevision()
    const loadingKey = `${requestSessionRevision}:${requestKey}`

    if (loadingRequestKey.current === loadingKey) {
      return
    }

    loadingRequestKey.current = loadingKey
    const requestId = ++latestRequestId.current
    const isRequestSessionCurrent = () => requestSessionRevision === getDataSessionRevision()
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
      let shouldRetry
      do {
        const mutationSnapshot = getEntryMutationSnapshot()
        if (mutationSnapshot.pendingRequests > 0) {
          const canContinue = await waitForEntryMutations(mutationSnapshot)
          if (!canContinue || !isLatestRequest() || !isRequestSessionCurrent()) {
            return
          }
          shouldRetry = true
          continue
        }

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

        if (!isLatestRequest() || !isRequestSessionCurrent()) {
          return
        }

        shouldRetry = !isEntryMutationSnapshotCurrent(mutationSnapshot)
        if (shouldRetry) {
          const canRetry = await waitForEntryMutations(mutationSnapshot)
          if (!canRetry || !isLatestRequest() || !isRequestSessionCurrent()) {
            return
          }
        }
      } while (shouldRetry)

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
      if (!isLatestRequest() || !isRequestSessionCurrent()) {
        return
      }

      console.error("Error fetching articles:", error)
      setEntries([])
      setTotal(0)
      setLoadMoreVisible(false)
      setArticleListError(true)
    } finally {
      if (requestId === latestRequestId.current && loadingRequestKey.current === loadingKey) {
        loadingRequestKey.current = null
      }
      if (isLatestRequest() && isRequestSessionCurrent()) {
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
