import { Message } from "@arco-design/web-react"
import { batch } from "nanostores"

import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setLoadMoreVisible, setTotal } from "@/store/contentState"
import { getDataSessionRevision } from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import { shouldRefreshArticleListTotal } from "@/utils/article-list-filters"
import createArticleListRequestKey from "@/utils/article-list-request-key"
import {
  getEntryMutationSnapshot,
  isEntryMutationSnapshotCurrent,
  subscribeEntryMutationIdle,
} from "@/utils/entry-mutation-state"
import { subscribeEntryStatusMutationEvents } from "@/utils/entry-status-mutation-events"

const COUNT_REFRESH_DELAY_MS = 150

// Reconcile server-side search and changed_at filters without replacing the visible entries.
const subscribeArticleListTotalRefresh = (getEntries, info) => {
  let disposed = false
  let refreshRevision = 0
  let timer
  let homeSettlementPending = false

  const refreshTotal = async (revision) => {
    const content = contentState.get()
    const settings = settingsState.get()
    const mutationSnapshot = getEntryMutationSnapshot()
    const sessionRevision = getDataSessionRevision()
    const requestKey = createArticleListRequestKey({ content, settings, info, sessionRevision })
    const snapshotRevision = content.articleListSnapshotRevision
    const isCurrentRequest = () => {
      const currentContent = contentState.get()
      return (
        !disposed &&
        revision === refreshRevision &&
        sessionRevision === getDataSessionRevision() &&
        requestKey ===
          createArticleListRequestKey({
            content: currentContent,
            settings: settingsState.get(),
            sessionRevision: getDataSessionRevision(),
          }) &&
        snapshotRevision === currentContent.articleListSnapshotRevision &&
        currentContent.isArticleListReady &&
        !currentContent.articleListError
      )
    }

    if (
      !isCurrentRequest() ||
      mutationSnapshot.pendingRequests > 0 ||
      (info.from === "home"
        ? !homeSettlementPending
        : !shouldRefreshArticleListTotal(content, settings))
    ) {
      return
    }

    try {
      const response =
        info.from === "home"
          ? await getEntries({ pageSize: 1 })
          : await getEntries(
              settings.showStatus === "unread" ? "unread" : null,
              settings.showStatus === "starred",
              {
                filterDate: content.filterDate,
                ...(content.filterString && { search: content.filterString }),
                limit: 1,
              },
            )

      if (!isCurrentRequest()) {
        return
      }
      if (!isEntryMutationSnapshotCurrent(mutationSnapshot)) {
        scheduleRefresh()
        return
      }
      if (!Number.isFinite(response?.total) || response.total < 0) {
        throw new TypeError("Invalid entries count response")
      }

      if (info.from === "home") {
        const loadedEligibleCount = new Set(
          contentState
            .get()
            .entries.filter(({ status }) => status === "unread")
            .map(({ id }) => id),
        ).size
        batch(() => {
          setTotal(response.total)
          setLoadMoreVisible(loadedEligibleCount < response.total)
        })
        homeSettlementPending = false
      } else {
        setTotal(response.total)
      }
    } catch (error) {
      if (!isCurrentRequest()) {
        return
      }
      console.error("Failed to refresh the article list count:", error)
      const { polyglot } = polyglotState.get()
      if (polyglot) {
        Message.warning(polyglot.t("app.counts_refresh_error"))
      }
    }
  }

  function scheduleRefresh() {
    clearTimeout(timer)
    const revision = ++refreshRevision
    timer = setTimeout(() => {
      void refreshTotal(revision)
    }, COUNT_REFRESH_DELAY_MS)
  }

  const unsubscribeIdle = subscribeEntryMutationIdle(() => {
    if (info.from !== "home" || homeSettlementPending) {
      scheduleRefresh()
    }
  })
  const unsubscribeStatus =
    info.from === "home"
      ? subscribeEntryStatusMutationEvents((event) => {
          if (
            event.outcome !== "confirmed" ||
            (event.targetStatus !== "read" && event.targetStatus !== "unread") ||
            event.sessionRevision !== getDataSessionRevision()
          ) {
            return
          }
          homeSettlementPending = true
          scheduleRefresh()
        })
      : () => {}

  return () => {
    disposed = true
    clearTimeout(timer)
    unsubscribeIdle()
    unsubscribeStatus()
  }
}

export default subscribeArticleListTotalRefresh
