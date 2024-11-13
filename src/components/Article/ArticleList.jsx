import { Divider, Spin } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { forwardRef, useCallback, useEffect, useMemo } from "react"
import { useInView } from "react-intersection-observer"
import SimpleBar from "simplebar-react"
import { Virtualizer } from "virtua"

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

  const canLoadMore = loadMoreVisible && isArticleListReady && !loadingMore

  const checkAndLoadMore = useCallback(
    (element) => {
      if (!canLoadMore) {
        return
      }

      const threshold = element.scrollHeight * 0.8
      const scrolledDistance = element.scrollTop + element.clientHeight
      if (scrolledDistance >= threshold) {
        handleLoadMore(getEntries)
      }
    },
    [canLoadMore, handleLoadMore, getEntries],
  )

  return (
    <SimpleBar ref={ref} className="entry-list" scrollableNodeProps={{ ref: cardsRef }}>
      <LoadingCards />
      {isArticleListReady && (
        <FadeTransition y={20}>
          <Virtualizer
            overscan={10}
            scrollRef={cardsRef}
            onRangeChange={() => {
              const element = cardsRef.current
              if (element) {
                checkAndLoadMore(element)
              }
            }}
          >
            {items.map((entry, index) => (
              <div key={entry.id}>
                <ArticleCard entry={entry} handleEntryClick={handleEntryClick}>
                  <Ripple color="var(--color-text-4)" duration={1000} />
                </ArticleCard>
                {index < items.length - 1 && (
                  <Divider
                    style={{
                      margin: "8px 0",
                      borderBottom: "1px solid var(--color-border-2)",
                    }}
                  />
                )}
              </div>
            ))}
          </Virtualizer>
        </FadeTransition>
      )}
      <LoadMoreComponent getEntries={getEntries} />
    </SimpleBar>
  )
})
ArticleList.displayName = "ArticleList"

export default ArticleList
