import { Divider, Spin } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { forwardRef, useCallback, useEffect, useMemo } from "react"
import { useInView } from "react-intersection-observer"
import SimpleBar from "simplebar-react"

import ArticleCard from "./ArticleCard"
import LoadingCards from "./LoadingCards"

import FadeTransition from "@/components/ui/FadeTransition"
import Ripple from "@/components/ui/Ripple"
import useLoadMore from "@/hooks/useLoadMore"
import { contentState, filteredEntriesState } from "@/store/contentState"

import "./ArticleList.css"

const LoadMoreComponent = ({ getEntries }) => {
  const { isArticleListReady, loadMoreVisible } = useStore(contentState)

  const { loadingMore, handleLoadMore } = useLoadMore()

  const { ref: loadMoreRef, inView } = useInView()

  const loadMoreEntries = useCallback(async () => {
    if (loadMoreVisible && inView && isArticleListReady && !loadingMore) {
      await handleLoadMore(getEntries)
    }
  }, [loadMoreVisible, inView, isArticleListReady, loadingMore, handleLoadMore, getEntries])

  useEffect(() => {
    const intervalId = setInterval(loadMoreEntries, 500)

    return () => clearInterval(intervalId)
  }, [loadMoreEntries])

  return (
    isArticleListReady &&
    loadMoreVisible && (
      <div ref={loadMoreRef} className="load-more-container">
        <Spin loading={loadingMore} style={{ paddingRight: "10px" }} />
        Loading more ...
      </div>
    )
  )
}

const ArticleList = forwardRef(({ getEntries, handleEntryClick, cardsRef }, ref) => {
  const { isArticleListReady, loadMoreVisible } = useStore(contentState)
  const filteredEntries = useStore(filteredEntriesState)

  const { loadingMore, handleLoadMore } = useLoadMore()

  const items = useMemo(() => filteredEntries, [filteredEntries])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => cardsRef.current,
    estimateSize: () => 160,
    overscan: 10,
  })

  const virtualItems = virtualizer.getVirtualItems()

  const canLoadMore = loadMoreVisible && isArticleListReady && !loadingMore

  const checkAndLoadMore = useCallback(
    (scrollElement) => {
      if (!canLoadMore) {
        return
      }

      const { scrollTop, clientHeight, scrollHeight } = scrollElement
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

      if (scrollPercentage >= 0.8) {
        handleLoadMore(getEntries)
      }
    },
    [canLoadMore, handleLoadMore, getEntries],
  )

  useEffect(() => {
    const { scrollElement } = virtualizer
    if (!scrollElement) {
      return
    }

    const handleScroll = () => checkAndLoadMore(scrollElement)
    scrollElement.addEventListener("scroll", handleScroll)

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll)
    }
  }, [virtualizer, checkAndLoadMore])

  return (
    <SimpleBar ref={ref} className="entry-list" scrollableNodeProps={{ ref: cardsRef }}>
      <LoadingCards />
      {isArticleListReady && (
        <FadeTransition
          y={20}
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((item) => (
            <div
              key={item.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${item.start}px)`,
              }}
            >
              <ArticleCard entry={filteredEntries[item.index]} handleEntryClick={handleEntryClick}>
                <Ripple color="var(--color-text-4)" duration={1000} />
              </ArticleCard>
              {item.index < filteredEntries.length - 1 && (
                <Divider
                  style={{
                    margin: "8px 0",
                    borderBottom: "1px solid var(--color-border-2)",
                  }}
                />
              )}
            </div>
          ))}
        </FadeTransition>
      )}
      <LoadMoreComponent getEntries={getEntries} />
    </SimpleBar>
  )
})
ArticleList.displayName = "ArticleList"

export default ArticleList
