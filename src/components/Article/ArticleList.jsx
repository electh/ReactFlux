import { Spin } from "@arco-design/web-react";
import { forwardRef } from "react";

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
  ({ info, loading, getEntries, handleEntryClick, cardsRef }, ref) => {
    const filteredEntries = useAtomValue(filteredEntriesAtom);
    const filterStatus = useAtomValue(filterStatusAtom);
    const loadMoreUnreadVisible = useAtomValue(loadMoreUnreadVisibleAtom);
    const loadMoreVisible = useAtomValue(loadMoreVisibleAtom);

    const { loadingMore, handleLoadMore } = useLoadMore();
    const { layout } = useAtomValue(configAtom);
    const isCompactLayout = layout === "small";

    const { ref: loadMoreRef } = useInView({
      skip: !loadMoreVisible && !loadMoreUnreadVisible,
      onChange: async (inView) => {
        if (
          inView &&
          !loading &&
          !loadingMore &&
          (loadMoreVisible || loadMoreUnreadVisible)
        ) {
          await handleLoadMore(info, getEntries);
        }
      },
    });

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
                >
                  <Ripple color="var(--color-text-4)" duration={1000} />
                </ArticleCard>
              ))}
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
