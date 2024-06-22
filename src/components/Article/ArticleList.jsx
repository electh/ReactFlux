import { Spin } from "@arco-design/web-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { forwardRef, useEffect } from "react";

import useLoadMore from "../../hooks/useLoadMore";
import ArticleCard from "./ArticleCard";
import LoadingCards from "./LoadingCards";
import SearchAndSortBar from "./SearchAndSortBar";

import { useAtomValue } from "jotai";
import { useInView } from "react-intersection-observer";
import { configAtom } from "../../atoms/configAtom";
import {
  filterStatusAtom,
  filteredEntriesAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
} from "../../atoms/contentAtom";
import Ripple from "../ui/Ripple.jsx";
import "./ArticleList.css";

const ArticleList = forwardRef(
  ({ loading, getEntries, handleEntryClick, cardsRef }, ref) => {
    const filteredEntries = useAtomValue(filteredEntriesAtom);
    const filterStatus = useAtomValue(filterStatusAtom);
    const loadMoreUnreadVisible = useAtomValue(loadMoreUnreadVisibleAtom);
    const loadMoreVisible = useAtomValue(loadMoreVisibleAtom);

    const { loadingMore, handleLoadMore } = useLoadMore();
    const { layout } = useAtomValue(configAtom);
    const isCompactLayout = layout === "small";

    const { ref: loadMoreRef, inView } = useInView({
      skip: !loadMoreVisible && !loadMoreUnreadVisible,
    });

    const virtualizer = useVirtualizer({
      count: filteredEntries.length,
      getScrollElement: () => cardsRef.current,
      estimateSize: () => (isCompactLayout ? 120 : 280),
    });

    const items = virtualizer.getVirtualItems();

    useEffect(() => {
      let interval;
      if (
        inView &&
        !loading &&
        !loadingMore &&
        (loadMoreVisible || loadMoreUnreadVisible)
      ) {
        const executeLoadMore = async () => {
          await handleLoadMore(getEntries);
        };

        executeLoadMore();

        interval = setInterval(executeLoadMore, 1000);
      } else if (interval) {
        clearInterval(interval);
      }

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }, [
      inView,
      loading,
      loadingMore,
      loadMoreVisible,
      loadMoreUnreadVisible,
      handleLoadMore,
      getEntries,
    ]);

    return (
      <>
        <SearchAndSortBar />
        <div className="entry-list" ref={ref}>
          <LoadingCards loading={loading} />
          {!loading && (
            <div ref={cardsRef}>
              <div
                style={{
                  height: virtualizer.getTotalSize(),
                  width: "100%",
                  position: "relative",
                }}
              >
                {items.map((virtualItem) => (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <ArticleCard
                      entry={filteredEntries[virtualItem.index]}
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
          {!loading &&
            (filterStatus === "all"
              ? loadMoreVisible
              : loadMoreUnreadVisible) && (
              <div className="load-more-container" ref={loadMoreRef}>
                <Spin loading={loadingMore} style={{ paddingRight: "10px" }} />
                Loading more ...
              </div>
            )}
        </div>
      </>
    );
  },
);

export default ArticleList;
