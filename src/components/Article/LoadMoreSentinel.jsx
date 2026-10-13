import { Button, Spin } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"

import { polyglotState } from "@/hooks/useLanguage"
import useLoadMore from "@/hooks/useLoadMore"
import { contentState } from "@/store/contentState"

import "./ArticleList.css"

const isElementVisibleInRoot = (element, root) => {
  if (!element || !root) {
    return false
  }

  const elementRect = element.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  return elementRect.bottom >= rootRect.top && elementRect.top <= rootRect.bottom
}

const LoadMoreSentinel = ({ getEntries, scrollRootRef }) => {
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

export default LoadMoreSentinel
