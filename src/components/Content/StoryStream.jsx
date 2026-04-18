import { Button, Typography } from "@arco-design/web-react"
import { IconEmpty } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import { useEffect, useMemo } from "react"
import SimpleBar from "simplebar-react"
import { Virtualizer } from "virtua"

import LoadingCards from "@/components/Article/LoadingCards"
import StreamArticleCard from "@/components/Article/StreamArticleCard"
import StreamSearchBar from "@/components/Article/StreamSearchBar"
import useLoadMore from "@/hooks/useLoadMore"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"

import "./StoryStream.css"

const STREAM_PRELOAD_AHEAD_COUNT = 3
const STREAM_VIRTUAL_OVERSCAN = 6

const StoryStream = ({
  cardsRef,
  entryListRef,
  getEntries,
  handleEntryClick,
  info,
  markAllAsRead,
  streamVirtualizerRef,
}) => {
  const { activeContent, infoFrom, isArticleListReady, loadMoreVisible } = useStore(contentState)
  const filteredEntries = useStore(filteredEntriesState)
  const { animationsEnabled } = useStore(settingsState)
  const { loadingMore, handleLoadMore } = useLoadMore()
  const canLoadMore = loadMoreVisible && isArticleListReady && !loadingMore

  const checkAndLoadMore = useMemo(
    () =>
      throttle((element) => {
        if (!canLoadMore) {
          return
        }

        const threshold = element.scrollHeight * 0.82
        const scrolledDistance = element.scrollTop + element.clientHeight

        if (scrolledDistance >= threshold) {
          handleLoadMore(getEntries)
        }
      }, 200),
    [canLoadMore, getEntries, handleLoadMore],
  )

  useEffect(() => {
    return () => checkAndLoadMore.cancel()
  }, [checkAndLoadMore])

  const hasEntries = filteredEntries.length > 0
  const activeEntryIndex = useMemo(
    () => filteredEntries.findIndex((entry) => entry.id === activeContent?.id),
    [activeContent?.id, filteredEntries],
  )
  const keepMountedIndexes = useMemo(() => {
    if (activeEntryIndex === -1) {
      return []
    }

    return [activeEntryIndex - 1, activeEntryIndex, activeEntryIndex + 1].filter(
      (index, position, array) =>
        index >= 0 && index < filteredEntries.length && array.indexOf(index) === position,
    )
  }, [activeEntryIndex, filteredEntries.length])

  return (
    <div className="article-container story-stream-layout">
      <div className="story-stream-toolbar">
        <StreamSearchBar
          info={info}
          markAllAsRead={markAllAsRead}
          streamVirtualizerRef={streamVirtualizerRef}
        />
      </div>
      <SimpleBar
        ref={entryListRef}
        className={`entry-list story-stream-list ${animationsEnabled ? "animations-enabled" : ""}`}
        scrollableNodeProps={{
          ref: cardsRef,
          tabIndex: -1,
        }}
      >
        <LoadingCards />
        {isArticleListReady && !hasEntries ? (
          <div className="story-stream-empty">
            <IconEmpty style={{ fontSize: 44 }} />
            <Typography.Text>ReloadedFlux</Typography.Text>
          </div>
        ) : null}
        {isArticleListReady && hasEntries ? (
          <Virtualizer
            ref={streamVirtualizerRef}
            keepMounted={keepMountedIndexes}
            overscan={STREAM_VIRTUAL_OVERSCAN}
            scrollRef={cardsRef}
            onScroll={() => {
              const element = cardsRef.current
              if (element) {
                checkAndLoadMore(element)
              }
            }}
          >
            {filteredEntries.map((entry, index) => (
              <StreamArticleCard
                key={entry.id}
                activeEntry={activeContent?.id === entry.id ? activeContent : null}
                entry={entry}
                handleEntryClick={handleEntryClick}
                infoFrom={infoFrom}
                isSelected={activeContent?.id === entry.id}
                shouldPreload={
                  activeEntryIndex !== -1 &&
                  index > activeEntryIndex &&
                  index <= activeEntryIndex + STREAM_PRELOAD_AHEAD_COUNT
                }
              />
            ))}
            {loadMoreVisible ? (
              <div className="load-more-container story-stream-load-more">
                <Button
                  loading={loadingMore}
                  type="text"
                  onClick={() => handleLoadMore(getEntries)}
                >
                  Loading more ...
                </Button>
              </div>
            ) : null}
          </Virtualizer>
        ) : null}
      </SimpleBar>
    </div>
  )
}

export default StoryStream
