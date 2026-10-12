import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import AdaptiveScrollArea from "@/components/ui/AdaptiveScrollArea"
import { contentState } from "@/store/contentState"
import { dataState, getDataSessionRevision } from "@/store/dataState"
import { homeIdentityState } from "@/store/homePageState"
import { settingsState } from "@/store/settingsState"
import { subscribeEntryStatusMutationEvents } from "@/utils/entry-status-mutation-events"
import {
  createHomeEditorialSession,
  createHomeSessionKey,
  transitionHomeSession,
} from "@/utils/home-editorial-session"
import { getHomeIdentityKey } from "@/utils/home-page"

const currentHomeSessionKey = () => {
  const { pageSize, showHiddenFeeds } = settingsState.get()
  return createHomeSessionKey({
    identityKey: getHomeIdentityKey(homeIdentityState.get()),
    pageSize,
    showHiddenFeeds,
    sessionRevision: getDataSessionRevision(),
  })
}

const HomeEditorial = ({ entryListRef }) => {
  const identity = useStore(homeIdentityState)
  const { sessionRevision } = useStore(dataState, { keys: ["sessionRevision"] })
  const { pageSize, showHiddenFeeds } = useStore(settingsState, {
    keys: ["pageSize", "showHiddenFeeds"],
  })
  const requestKey = createHomeSessionKey({
    identityKey: getHomeIdentityKey(identity),
    pageSize,
    showHiddenFeeds,
    sessionRevision,
  })
  const [session, setSession] = useState(null)

  useEffect(() => {
    let disposed = false
    const refreshSession = () => {
      if (disposed || requestKey !== currentHomeSessionKey()) {
        return
      }
      const content = contentState.get()
      if (
        content.infoFrom !== "home" ||
        !content.isArticleListReady ||
        content.articleListError ||
        !content.articleListSnapshotRevision
      ) {
        return
      }
      setSession((previous) => {
        if (
          previous?.requestKey === requestKey &&
          previous.snapshotRevision === content.articleListSnapshotRevision
        ) {
          return previous
        }
        return {
          ...createHomeEditorialSession({
            requestKey,
            sessionRevision: getDataSessionRevision(),
            entries: content.entries,
            scrollRoot: entryListRef.current?.contentWrapperEl ?? entryListRef.current?.el ?? null,
          }),
          snapshotRevision: content.articleListSnapshotRevision,
        }
      })
    }
    const unsubscribe = contentState.listen(refreshSession)
    queueMicrotask(refreshSession)
    return () => {
      disposed = true
      unsubscribe()
    }
  }, [entryListRef, requestKey])

  useEffect(
    () =>
      subscribeEntryStatusMutationEvents((event) => {
        if (requestKey !== currentHomeSessionKey()) {
          return
        }
        setSession((previous) => {
          if (previous?.requestKey !== requestKey) {
            return previous
          }
          return transitionHomeSession(previous, event, contentState.get().entries)
        })
      }),
    [requestKey],
  )

  const activeSession = session?.requestKey === requestKey ? session : null
  return (
    <div aria-busy={!activeSession} className="home-editorial" style={{ flex: 1, minHeight: 0 }}>
      <AdaptiveScrollArea
        ref={entryListRef}
        scrollableNodeProps={{ tabIndex: -1 }}
        style={{ height: "100%" }}
      />
    </div>
  )
}

export default HomeEditorial
