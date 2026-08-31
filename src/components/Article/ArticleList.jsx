import { Button, Divider, Spin, Typography } from "@arco-design/web-react"
import { IconEmpty, IconExclamationCircle } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { forwardRef, useCallback, useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { Virtualizer } from "virtua"

import ArticleCard from "./ArticleCard"
import LoadingCards from "./LoadingCards"

import AdaptiveScrollArea from "@/components/ui/AdaptiveScrollArea"
import FadeTransition from "@/components/ui/FadeTransition"
import { polyglotState } from "@/hooks/useLanguage"
import useLoadMore from "@/hooks/useLoadMore"
import useReadOnScroll from "@/hooks/useReadOnScroll"
import { contentState, filteredEntriesState } from "@/store/contentState"

import "./ArticleList.css"

const isElementVisibleInRoot = (element, root) => {
  if (!element || !root) {
    return false
  }

  const elementRect = element.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  return elementRect.bottom >= rootRect.top && elementRect.top <= rootRect.bottom
}

const LoadMoreComponent = ({ getEntries, scrollRootRef }) => {
  const { isArticleListReady, loadMoreVisible } = useStore(contentState, {
    keys: ["isArticleListReady", "loadMoreVisible"],
  })
  const { handleLoadMore, loadMoreError, loadingMore } = useLoadMore()
  const { polyglot } = useStore(polyglotState)
  const { ref: inViewRef, inView } = useInView()
  const autoLoadArmedRef = useRef(true)
  const loadMoreElementRef = useRef(null)
  const [autoLoadRevision, setAutoLoadRevision] = useState(0)
  const setLoadMoreRef = useCallback(
    (element) => {
      loadMoreElementRef.current = element
      inViewRef(element)
    },
    [inViewRef],
  )
  const requestLoadMore = useCallback(() => {
    autoLoadArmedRef.current = false
    return handleLoadMore(getEntries).finally(() => {
      requestAnimationFrame(() => {
        if (isElementVisibleInRoot(loadMoreElementRef.current, scrollRootRef.current)) {
          autoLoadArmedRef.current = true
          setAutoLoadRevision((revision) => revision + 1)
        }
      })
    })
  }, [getEntries, handleLoadMore, scrollRootRef])

  useEffect(() => {
    if (!inView) {
      autoLoadArmedRef.current = true
      return
    }

    if (
      autoLoadArmedRef.current &&
      loadMoreVisible &&
      isArticleListReady &&
      !loadMoreError &&
      !loadingMore
    ) {
      void requestLoadMore()
    }
  }, [
    autoLoadRevision,
    inView,
    isArticleListReady,
    loadMoreError,
    loadingMore,
    loadMoreVisible,
    requestLoadMore,
  ])

  return (
    isArticleListReady &&
    loadMoreVisible && (
      <div ref={setLoadMoreRef} className="load-more-container">
        {loadMoreError ? (
          <Button size="small" onClick={() => void requestLoadMore()}>
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
    const { articleListError, filterString, isArticleListReady } = useStore(contentState, {
      keys: ["articleListError", "filterString", "isArticleListReady"],
    })
    const filteredEntries = useStore(filteredEntriesState)
    const { polyglot } = useStore(polyglotState)
    const observeRead = useReadOnScroll(cardsRef)
    const canRenderResults = isArticleListReady && !articleListError

    return (
      <AdaptiveScrollArea ref={ref} className="entry-list" scrollableNodeProps={{ ref: cardsRef }}>
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
          <FadeTransition>
            <Virtualizer bufferSize={300} data={filteredEntries} scrollRef={cardsRef}>
              {(entry, index) => (
                <div key={entry.id}>
                  <ArticleCard
                    entry={entry}
                    handleEntryClick={handleEntryClick}
                    observeRead={observeRead}
                  />
                  {index < filteredEntries.length - 1 && (
                    <Divider
                      style={{
                        margin: "8px 0",
                        borderBottom: "1px solid var(--color-border-2)",
                      }}
                    />
                  )}
                </div>
              )}
            </Virtualizer>
          </FadeTransition>
        )}
        <LoadMoreComponent getEntries={getEntries} scrollRootRef={cardsRef} />
      </AdaptiveScrollArea>
    )
  },
)
ArticleList.displayName = "ArticleList"

export default ArticleList
