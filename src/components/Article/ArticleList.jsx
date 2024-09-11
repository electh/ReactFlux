import { Spin } from "@arco-design/web-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { forwardRef, useCallback } from "react";

import useLoadMore from "../../hooks/useLoadMore";
import ArticleCard from "./ArticleCard";
import LoadingCards from "./LoadingCards";
import SearchAndSortBar from "./SearchAndSortBar";

import { useStore } from "@nanostores/react";
import { useInView } from "react-intersection-observer";
import SimpleBar from "simplebar-react";
import {
  contentState,
  filteredEntriesState,
  loadMoreVisibleState,
} from "../../store/contentState";
import { settingsState } from "../../store/settingsState";
import { mergeRefs } from "../../utils/refs";
import Ripple from "../ui/Ripple.jsx";
import "./ArticleList.css";

const LoadMoreComponent = ({ getEntries }) => {
  const { isArticleListReady } = useStore(contentState);
  const loadMoreVisible = useStore(loadMoreVisibleState);

  const { loadingMore, handleLoadMore } = useLoadMore();

  const { ref: loadMoreRef } = useInView({
    skip: !loadMoreVisible,
    onChange: async (inView) => {
      if (!inView || !isArticleListReady || loadingMore) {
        return;
      }
      await handleLoadMore(getEntries);
    },
  });

  return (
    isArticleListReady &&
    loadMoreVisible && (
      <div className="load-more-container" ref={loadMoreRef}>
        <Spin loading={loadingMore} style={{ paddingRight: "10px" }} />
        Loading more ...
      </div>
    )
  );
};

const ArticleList = forwardRef(
  ({ getEntries, handleEntryClick, cardsRef }, ref) => {
    const { layout, pageSize } = useStore(settingsState);
    const isCompactLayout = layout === "small";

    const { isArticleListReady } = useStore(contentState);
    const filteredEntries = useStore(filteredEntriesState);
    const lastPercent20StartIndex =
      filteredEntries.length - Math.ceil(pageSize * 0.2) - 1;

    const loadMoreVisible = useStore(loadMoreVisibleState);

    const { loadingMore, handleLoadMore } = useLoadMore();

    const { ref: loadMoreRef } = useInView({
      skip: !loadMoreVisible,
      onChange: async (inView) => {
        if (!inView || !isArticleListReady || loadingMore) {
          return;
        }
        await handleLoadMore(getEntries);
      },
    });

    const virtualizer = useVirtualizer({
      count: filteredEntries.length,
      getScrollElement: () => cardsRef.current,
      estimateSize: () => (isCompactLayout ? 120 : 280),
    });
    const virtualItems = virtualizer.getVirtualItems();

    const getItemRef = useCallback(
      (index) => {
        if (index === lastPercent20StartIndex) {
          return mergeRefs(virtualizer.measureElement, loadMoreRef);
        }
        return virtualizer.measureElement;
      },
      [lastPercent20StartIndex, virtualizer.measureElement, loadMoreRef],
    );

    return (
      <>
        <SearchAndSortBar />
        <SimpleBar className="entry-list" ref={ref}>
          <LoadingCards />
          {isArticleListReady && (
            <div ref={cardsRef}>
              <div
                style={{
                  height: virtualizer.getTotalSize(),
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualItems.map((item) => (
                  <div
                    key={item.key}
                    data-index={item.index}
                    ref={getItemRef(item.index)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${item.start}px)`,
                    }}
                  >
                    <ArticleCard
                      entry={filteredEntries[item.index]}
                      handleEntryClick={handleEntryClick}
                      mini={isCompactLayout}
                    >
                      <Ripple color="var(--color-text-4)" duration={1000} />
                    </ArticleCard>
                  </div>
                ))}
              </div>
            </div>
          )}
          <LoadMoreComponent getEntries={getEntries} />
        </SimpleBar>
      </>
    );
  },
);

export default ArticleList;
