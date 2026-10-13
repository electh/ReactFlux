import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import HomeHighlights from "./HomeHighlights"

import AdaptiveScrollArea from "@/components/ui/AdaptiveScrollArea"
import useArticleCardActivation from "@/hooks/useArticleCardActivation"
import useReadOnScroll from "@/hooks/useReadOnScroll"
import { contentState } from "@/store/contentState"
import { dataState, getDataSessionRevision } from "@/store/dataState"
import { homeIdentityState } from "@/store/homePageState"
import { settingsState } from "@/store/settingsState"
import { subscribeEntryStatusMutationEvents } from "@/utils/entry-status-mutation-events"
import {
  createHomeEditorialSession,
  createHomeSessionKey,
  projectHomeSession,
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

const HomeEditorial = ({ cardsRef, entryListRef, handleEntryClick }) => {
  const { entries } = useStore(contentState, { keys: ["entries"] })
  const articleActivation = useArticleCardActivation(handleEntryClick)
  const observeRead = useReadOnScroll(cardsRef)
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
  const projection = activeSession ? projectHomeSession(activeSession, entries) : null
  return (
    <div aria-busy={!activeSession} className="home-editorial" style={{ flex: 1, minHeight: 0 }}>
      <AdaptiveScrollArea
        ref={entryListRef}
        scrollableNodeProps={{ ref: cardsRef, tabIndex: -1 }}
        style={{ height: "100%" }}
      >
        {projection && (
          <HomeHighlights
            articleActivation={articleActivation}
            entries={entries}
            highlightIds={projection.highlightIds}
            observeRead={observeRead}
          />
        )}
      </AdaptiveScrollArea>
    </div>
  )
}

export default HomeEditorial
