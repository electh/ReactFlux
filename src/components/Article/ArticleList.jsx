import { Button, Divider, Spin, Typography } from "@arco-design/web-react"
import { IconEmpty, IconExclamationCircle } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import { forwardRef, useCallback, useEffect, useMemo } from "react"
import { useInView } from "react-intersection-observer"
import SimpleBar from "simplebar-react"
import { Virtualizer } from "virtua"

import ArticleCard from "./ArticleCard"
import LoadingCards from "./LoadingCards"

import FadeTransition from "@/components/ui/FadeTransition"
import Ripple from "@/components/ui/Ripple"
import { polyglotState } from "@/hooks/useLanguage"
import useLoadMore from "@/hooks/useLoadMore"
import { contentState, filteredEntriesState } from "@/store/contentState"

import "./ArticleList.css"

const LoadMoreComponent = ({ getEntries }) => {
  const { isArticleListReady, loadMoreVisible } = useStore(contentState)

  const { handleLoadMore, loadMoreError, loadingMore } = useLoadMore()
  const { polyglot } = useStore(polyglotState)

  const { ref: loadMoreRef, inView } = useInView()

  const loadMoreEntries = useCallback(() => {
    if (loadMoreVisible && inView && isArticleListReady && !loadMoreError && !loadingMore) {
      void handleLoadMore(getEntries)
    }
  }, [
    loadMoreVisible,
    inView,
    isArticleListReady,
    loadMoreError,
    loadingMore,
    handleLoadMore,
    getEntries,
  ])

  useEffect(() => {
    const intervalId = setInterval(loadMoreEntries, 500)

    return () => clearInterval(intervalId)
  }, [loadMoreEntries])

  return (
    isArticleListReady &&
    loadMoreVisible && (
      <div ref={loadMoreRef} className="load-more-container">
        {loadMoreError ? (
          <Button size="small" onClick={() => void handleLoadMore(getEntries)}>
            {polyglot.t("actions.retry")}
          </Button>
        ) : (
          <>
            <Spin loading={loadingMore} style={{ paddingRight: "10px" }} />
            {polyglot.t("article_list.loading_more")}
          </>
        )}
      </div>
    )
  )
}

const ArticleList = forwardRef(
  ({ getEntries, handleEntryClick, cardsRef, retryArticleList }, ref) => {
    const { articleListError, filterString, isArticleListReady, loadMoreVisible } =
      useStore(contentState)
    const filteredEntries = useStore(filteredEntriesState)
    const { polyglot } = useStore(polyglotState)

    const { handleLoadMore, loadMoreError, loadingMore } = useLoadMore()
    const canLoadMore = loadMoreVisible && isArticleListReady && !loadMoreError && !loadingMore
    const canRenderResults = isArticleListReady && !articleListError

    const checkAndLoadMore = useMemo(
      () =>
        throttle((element) => {
          if (!canLoadMore) {
            return
          }

          const threshold = element.scrollHeight * 0.8
          const scrolledDistance = element.scrollTop + element.clientHeight
          if (scrolledDistance >= threshold) {
            void handleLoadMore(getEntries)
          }
        }, 200),
      [canLoadMore, handleLoadMore, getEntries],
    )

    return (
      <SimpleBar ref={ref} className="entry-list" scrollableNodeProps={{ ref: cardsRef }}>
        <LoadingCards />
        {isArticleListReady && articleListError && (
          <div className="article-list-state" role="alert">
            <IconExclamationCircle aria-hidden="true" className="article-list-state-icon" />
            <Typography.Text>{polyglot.t("article_list.load_error")}</Typography.Text>
            <Button type="primary" onClick={() => void retryArticleList()}>
              {polyglot.t("actions.retry")}
            </Button>
          </div>
        )}
        {canRenderResults && filterString && filteredEntries.length === 0 && (
          <div className="article-list-state" role="status">
            <IconEmpty aria-hidden="true" className="article-list-state-icon" />
            <Typography.Text>{polyglot.t("article_list.no_search_results")}</Typography.Text>
          </div>
        )}
        {canRenderResults && filteredEntries.length > 0 && (
          <FadeTransition y={20}>
            <Virtualizer
              overscan={10}
              scrollRef={cardsRef}
              onScroll={() => {
                const element = cardsRef.current
                if (element) {
                  checkAndLoadMore(element)
                }
              }}
            >
              {filteredEntries.map((entry, index) => (
                <div key={entry.id}>
                  <ArticleCard entry={entry} handleEntryClick={handleEntryClick}>
                    <Ripple color="var(--color-text-4)" duration={1000} />
                  </ArticleCard>
                  {index < filteredEntries.length - 1 && (
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
  },
)
ArticleList.displayName = "ArticleList"

export default ArticleList
