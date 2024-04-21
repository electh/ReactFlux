import { Button } from "@arco-design/web-react";
import { IconArrowDown } from "@arco-design/web-react/icon";
import { forwardRef } from "react";

import useLoadMore from "../../hooks/useLoadMore";
import ArticleCard from "./ArticleCard";
import LoadingCards from "./LoadingCards";
import SearchAndSortBar from "./SearchAndSortBar";

import { useAtomValue } from "jotai";
import { configAtom } from "../../atoms/configAtom";
import {
  filterStatusAtom,
  filteredEntriesAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
} from "../../atoms/contentAtom";
import "./ArticleList.css";

const ArticleList = forwardRef(
  ({ info, loading, getEntries, handleEntryClick, cardsRef }, ref) => {
    const filteredEntries = useAtomValue(filteredEntriesAtom);
    const filterStatus = useAtomValue(filterStatusAtom);
    const loadMoreUnreadVisible = useAtomValue(loadMoreUnreadVisibleAtom);
    const loadMoreVisible = useAtomValue(loadMoreVisibleAtom);

    const { loadingMore, handleLoadMore } = useLoadMore();
    const config = useAtomValue(configAtom);
    const { layout } = config;
    const mini = layout === "small";

    return (
      <>
        <SearchAndSortBar info={info} />
        <div className="entry-list" ref={ref}>
          <LoadingCards loading={loading} />
          {loading ? null : (
            <div ref={cardsRef}>
              {filteredEntries.map((entry) => {
                return (
                  <ArticleCard
                    key={entry.id}
                    entry={entry}
                    handleEntryClick={handleEntryClick}
                    mini={mini}
                  />
                );
              })}
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
