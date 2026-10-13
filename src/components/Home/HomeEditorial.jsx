import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import HomeHighlights from "./HomeHighlights"
import HomeRecent from "./HomeRecent"
import HomeStates from "./HomeStates"

import LoadMoreSentinel from "@/components/Article/LoadMoreSentinel"
import SearchAndSortBar from "@/components/Article/SearchAndSortBar"
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

import "./HomeEditorial.css"

const currentHomeSessionKey = () => {
  const { pageSize, showHiddenFeeds } = settingsState.get()
  return createHomeSessionKey({
    identityKey: getHomeIdentityKey(homeIdentityState.get()),
    pageSize,
    showHiddenFeeds,
    sessionRevision: getDataSessionRevision(),
  })
}

const HomeEditorial = ({
  cardsRef,
  entryListRef,
  getEntries,
  handleEntryClick,
  retryArticleList,
}) => {
  const { articleListError, entries, isArticleListReady, loadMoreVisible, total } = useStore(
    contentState,
    { keys: ["articleListError", "entries", "isArticleListReady", "loadMoreVisible", "total"] },
  )
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
  const hasProjectedEntries =
    projection?.highlightIds.some((id) => id != null) || projection?.recentIds.length > 0
  const isZeroUnread = Boolean(activeSession && total === 0 && !hasProjectedEntries)
  const isInitialLoading = !activeSession && !isArticleListReady && !articleListError
  const isInitialError = !activeSession && isArticleListReady && articleListError
  return (
    <div aria-busy={isInitialLoading} className="home-editorial">
      <SearchAndSortBar fullWidth homeMode />
      <AdaptiveScrollArea
        ref={entryListRef}
        className="home-editorial-scroll"
        scrollableNodeProps={{ ref: cardsRef, tabIndex: -1 }}
        style={{ height: "100%" }}
      >
        <div className="home-editorial-content">
          {isInitialLoading && <HomeStates.Loading />}
          {isInitialError && <HomeStates initialError retryArticleList={retryArticleList} />}
          {projection && !isZeroUnread && (
            <>
              <HomeHighlights
                articleActivation={articleActivation}
                entries={entries}
                highlightIds={projection.highlightIds}
                observeRead={observeRead}
              />
              <HomeRecent
                articleActivation={articleActivation}
                entries={entries}
                highlightIds={projection.highlightIds}
                observeRead={observeRead}
                recentIds={projection.recentIds}
                scrollRootRef={cardsRef}
              />
              <LoadMoreSentinel getEntries={getEntries} scrollRootRef={cardsRef} />
            </>
          )}
          {isZeroUnread && <HomeStates isZeroUnread />}
          {projection && (
            <HomeStates
              refreshError={Boolean(articleListError)}
              retryArticleList={retryArticleList}
            />
          )}
          {projection && isZeroUnread && loadMoreVisible && (
            <LoadMoreSentinel getEntries={getEntries} scrollRootRef={cardsRef} />
          )}
        </div>
      </AdaptiveScrollArea>
    </div>
  )
}

export default HomeEditorial
