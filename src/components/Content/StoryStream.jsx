import { Avatar, Button, Typography } from "@arco-design/web-react"
import { IconBook, IconEmpty } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import { useEffect, useMemo, useState } from "react"
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

  // virtua lays out the next card from an *estimated* size for the (expanded,
  // selected) first card before it has measured it, so on a fresh category swap
  // card #2 briefly paints at ~40px down — overlapping the tall selected card as
  // a floating ghost — until the ResizeObserver remeasures (the 1-2s flash).
  // Rather than show that glitch frame, keep the freshly-mounted list invisible
  // (it still lays out + measures off-screen) and show the loading skeleton until
  // the layout has settled: no card overlaps its predecessor. Then reveal.
  const settleKey = `${infoFrom}:${isArticleListReady}:${filteredEntries.length}`
  const [streamSettled, setStreamSettled] = useState(false)
  const [settledKey, setSettledKey] = useState(settleKey)
  // Adjust state during render when the list identity changes (the React-blessed
  // "derive state from props" pattern), so the new list never paints in its
  // unsettled state for even one frame.
  if (settledKey !== settleKey) {
    setSettledKey(settleKey)
    setStreamSettled(false)
  }

  useEffect(() => {
    if (!isArticleListReady || !hasEntries) {
      return
    }

    let stopped = false
    let frame = 0
    const MAX_FRAMES = 40 // ~0.6s safety: always reveal even if measure never "settles".

    const isLaidOut = () => {
      const scroller = entryListRef.current?.getScrollElement?.()
      if (!scroller) {
        return false
      }
      const scRect = scroller.getBoundingClientRect()
      const cards = [...scroller.querySelectorAll(".card-wrapper")]
      if (cards.length === 0) {
        return false
      }
      let prevBottom = -Infinity
      for (const card of cards) {
        const rect = card.getBoundingClientRect()
        const top = rect.top - scRect.top
        // Any card overlapping the previous one (virtua not yet remeasured) =
        // not settled.
        if (top < prevBottom - 4) {
          return false
        }
        prevBottom = rect.bottom - scRect.top
      }
      return true
    }

    const tick = () => {
      if (stopped) {
        return
      }
      frame += 1
      if (isLaidOut() || frame >= MAX_FRAMES) {
        setStreamSettled(true)
        return
      }
      requestAnimationFrame(tick)
    }
    // Start after the current paint so virtua has mounted its children.
    const raf = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [settleKey, isArticleListReady, hasEntries, entryListRef])

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
        {/* While fetching, show the skeleton cards. While the freshly mounted
            virtua list is still laying out (not yet settled), show the brand
            book icon pulsing as a loading indicator — this masks the
            floating-card glitch without leaving a blank gap. */}
        {!isArticleListReady && <LoadingCards />}
        {isArticleListReady && hasEntries && !streamSettled ? (
          <div aria-busy="true" aria-live="polite" className="story-stream-settling">
            <Avatar className="story-stream-settling-icon" size={48}>
              <IconBook style={{ color: "var(--color-bg-1)" }} />
            </Avatar>
          </div>
        ) : null}
        {isArticleListReady && !hasEntries ? (
          <div className="story-stream-empty">
            <IconEmpty style={{ fontSize: 44 }} />
            <Typography.Text>ReloadedFlux</Typography.Text>
          </div>
        ) : null}
        {isArticleListReady && hasEntries ? (
          <div
            className="story-stream-virtualizer"
            style={
              streamSettled
                ? undefined
                : // Keep it mounted so virtua measures, but invisible and out of
                  // flow so the skeleton above is what the user sees.
                  { position: "absolute", visibility: "hidden", pointerEvents: "none" }
            }
          >
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
          </div>
        ) : null}
      </SimpleBar>
    </div>
  )
}

export default StoryStream
