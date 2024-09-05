import { Spin } from "@arco-design/web-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { forwardRef, useEffect } from "react";

import useLoadMore from "../../hooks/useLoadMore";
import ArticleCard from "./ArticleCard";
import LoadingCards from "./LoadingCards";
import SearchAndSortBar from "./SearchAndSortBar";

import { useInView } from "react-intersection-observer";
import { useSnapshot } from "valtio";
import { configState } from "../../store/configState";
import { contentState } from "../../store/contentState";
import Ripple from "../ui/Ripple.jsx";
import "./ArticleList.css";

const ArticleList = forwardRef(
  ({ loading, getEntries, handleEntryClick, cardsRef }, ref) => {
    const { layout } = useSnapshot(configState);
    const isCompactLayout = layout === "small";

    const {
      filteredEntries,
      filterStatus,
      loadMoreUnreadVisible,
      loadMoreVisible,
    } = useSnapshot(contentState);

    const { loadingMore, handleLoadMore } = useLoadMore();

    const { ref: loadMoreRef, inView } = useInView({
      skip: !(loadMoreVisible || loadMoreUnreadVisible),
    });

    const virtualizer = useVirtualizer({
      count: filteredEntries.length,
      getScrollElement: () => cardsRef.current,
      estimateSize: () => (isCompactLayout ? 120 : 280),
    });

    const virtualItems = virtualizer.getVirtualItems();

    useEffect(() => {
      if (
        inView &&
        !loading &&
        !loadingMore &&
        (loadMoreVisible || loadMoreUnreadVisible)
      ) {
        const timeoutId = setTimeout(() => handleLoadMore(getEntries), 500);
        return () => clearTimeout(timeoutId);
      }
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
                {virtualItems.map((item) => (
                  <div
                    key={item.key}
                    data-index={item.index}
                    ref={virtualizer.measureElement}
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
