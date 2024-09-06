import { Spin } from "@arco-design/web-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { forwardRef } from "react";

import useLoadMore from "../../hooks/useLoadMore";
import ArticleCard from "./ArticleCard";
import LoadingCards from "./LoadingCards";
import SearchAndSortBar from "./SearchAndSortBar";

import { useStore } from "@nanostores/react";
import { useInView } from "react-intersection-observer";
import {
  contentState,
  filteredEntriesState,
  loadMoreUnreadVisibleState,
  loadMoreVisibleState,
} from "../../store/contentState";
import { settingsState } from "../../store/settingsState";
import Ripple from "../ui/Ripple.jsx";
import "./ArticleList.css";

const ArticleList = forwardRef(
  ({ getEntries, handleEntryClick, cardsRef }, ref) => {
    const { layout } = useStore(settingsState);
    const isCompactLayout = layout === "small";

    const { filterStatus, loading } = useStore(contentState);
    const filteredEntries = useStore(filteredEntriesState);
    const loadMoreUnreadVisible = useStore(loadMoreUnreadVisibleState);
    const loadMoreVisible = useStore(loadMoreVisibleState);

    const { loadingMore, handleLoadMore } = useLoadMore();

    const { ref: loadMoreRef } = useInView({
      skip: !(loadMoreVisible || loadMoreUnreadVisible),
      onChange: async (inView) => {
        if (!inView || loading || loadingMore) {
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

    return (
      <>
        <SearchAndSortBar />
        <div className="entry-list" ref={ref}>
          <LoadingCards />
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
