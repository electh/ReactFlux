import { Button } from "@arco-design/web-react";
import { IconArrowDown } from "@arco-design/web-react/icon";
import { forwardRef, useEffect } from "react";

import useLoadMore from "../../hooks/useLoadMore";
import ArticleCard from "./ArticleCard";
import LoadingCards from "./LoadingCards";
import SearchAndSortBar from "./SearchAndSortBar";

import { useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../../atoms/configAtom";
import {
  currentEntriesAtom,
  filterStatusAtom,
  filteredEntriesAtom,
  filteredEntriesRefreshAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
} from "../../atoms/contentAtom";
import "./ArticleList.css";

const ArticleList = forwardRef(
  ({ info, loading, getEntries, handleEntryClick, cardsRef }, ref) => {
    const currentEntries = useAtomValue(currentEntriesAtom);
    const filteredEntries = useAtomValue(filteredEntriesAtom);
    const triggerRefreshFilteredEntries = useSetAtom(
      filteredEntriesRefreshAtom,
    );
    const filterStatus = useAtomValue(filterStatusAtom);
    const loadMoreUnreadVisible = useAtomValue(loadMoreUnreadVisibleAtom);
    const loadMoreVisible = useAtomValue(loadMoreVisibleAtom);

    const { loadingMore, handleLoadMore } = useLoadMore();
    const { layout } = useAtomValue(configAtom);
    const isCompactLayout = layout === "small";

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      triggerRefreshFilteredEntries((prev) => prev + 1);
    }, [currentEntries]);

    return (
      <>
        <SearchAndSortBar />
        <div className="entry-list" ref={ref}>
          <LoadingCards loading={loading} />
          {loading ? null : (
            <div ref={cardsRef}>
              {filteredEntries.map((entry) => (
                <ArticleCard
                  key={entry.id}
                  entry={entry}
                  handleEntryClick={handleEntryClick}
                  mini={isCompactLayout}
                />
              ))}
            </div>
          )}
          {!loading &&
            (filterStatus === "all"
              ? loadMoreVisible
              : loadMoreUnreadVisible) && (
              <Button
                className="load-more-button"
                loading={loadingMore}
                long={true}
                onClick={() => handleLoadMore(info, getEntries)}
              >
                {!loadingMore && <IconArrowDown />}Load more
              </Button>
            )}
        </div>
      </>
    );
  },
);

export default ArticleList;
