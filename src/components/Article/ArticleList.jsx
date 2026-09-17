import { Button, Divider, Spin, Typography } from "@arco-design/web-react"
import { IconEmpty, IconExclamationCircle } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { forwardRef, useCallback, useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { Virtualizer } from "virtua"

import ArticleCard from "./ArticleCard"
import ArticleEntry from "./ArticleEntry"
import ArticleGridCard from "./ArticleGridCard"
import ArticleListItem from "./ArticleListItem"
import LoadingCards from "./LoadingCards"

import AdaptiveScrollArea from "@/components/ui/AdaptiveScrollArea"
import FadeTransition from "@/components/ui/FadeTransition"
import useArticleCardActivation from "@/hooks/useArticleCardActivation"
import useArticleListLayout from "@/hooks/useArticleListLayout"
import { polyglotState } from "@/hooks/useLanguage"
import useLoadMore from "@/hooks/useLoadMore"
import useReadOnScroll from "@/hooks/useReadOnScroll"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { articleListLayoutState } from "@/store/settingsState"

import "./ArticleList.css"

const ENTRY_PRESENTERS = {
  card: ArticleGridCard,
  column: ArticleCard,
  list: ArticleListItem,
}

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
    const articleListLayout = useStore(articleListLayoutState)
    const articleActivation = useArticleCardActivation(handleEntryClick)
    const observeRead = useReadOnScroll(cardsRef)
    const canRenderResults = isArticleListReady && !articleListError
    const EntryPresenter = ENTRY_PRESENTERS[articleListLayout] ?? ArticleCard
    const isCardLayout = articleListLayout === "card"
    const {
      cardColumnCount,
      handleVirtualizerScroll,
      setScrollRoot,
      virtualItems,
      virtualizerKey,
      virtualizerRef,
    } = useArticleListLayout({
      entries: filteredEntries,
      layout: articleListLayout,
      scrollRootRef: cardsRef,
    })

    return (
      <AdaptiveScrollArea
        ref={ref}
        className={`entry-list entry-list-layout-${articleListLayout}`}
        scrollableNodeProps={{ ref: setScrollRoot, tabIndex: 0 }}
      >
        <LoadingCards cardColumnCount={cardColumnCount} layout={articleListLayout} />
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
          <FadeTransition role="list">
            <Virtualizer
              key={virtualizerKey}
              ref={virtualizerRef}
              bufferSize={300}
              data={virtualItems}
              scrollRef={cardsRef}
              onScroll={handleVirtualizerScroll}
            >
              {(item, index) => {
                if (isCardLayout) {
                  return (
                    <div
                      key={`card-row-${item[0].id}`}
                      className="article-card-grid-row"
                      role="presentation"
                      style={{ "--article-card-grid-columns": cardColumnCount }}
                    >
                      {item.map((entry) => (
                        <div key={entry.id} className="article-card-grid-cell" role="listitem">
                          <ArticleEntry
                            articleActivation={articleActivation}
                            entry={entry}
                            layout={articleListLayout}
                            observeRead={observeRead}
                            presenter={EntryPresenter}
                          />
                        </div>
                      ))}
                    </div>
                  )
                }

                return (
                  <div key={item.id} role="listitem">
                    <ArticleEntry
                      articleActivation={articleActivation}
                      entry={item}
                      layout={articleListLayout}
                      observeRead={observeRead}
                      presenter={EntryPresenter}
                    />
                    {index < virtualItems.length - 1 && (
                      <Divider className="article-list-divider" />
                    )}
                  </div>
                )
              }}
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
