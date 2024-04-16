import { Button } from "@arco-design/web-react";
import { IconArrowDown } from "@arco-design/web-react/icon";
import React, { forwardRef, useContext } from "react";
import isURL from "validator/es/lib/isURL";

import { useConfig } from "../../hooks/useConfig";
import useLoadMore from "../../hooks/useLoadMore";
import { extractProtocolAndHostname } from "../../utils/url";
import ContentContext from "../Content/ContentContext";
import ArticleCard from "./ArticleCard";
import LoadingCards from "./LoadingCards";
import SearchAndSortBar from "./SearchAndSortBar";

import "./ArticleList.css";

const ArticleList = forwardRef(
  ({ info, loading, getEntries, handleEntryClick, cardsRef }, ref) => {
    const {
      filteredEntries,
      filterStatus,
      loadMoreUnreadVisible,
      loadMoreVisible,
    } = useContext(ContentContext);

    const { loadingMore, handleLoadMore } = useLoadMore();
    const { config } = useConfig();
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
                if (!isURL(entry.feed.site_url)) {
                  entry.feed.site_url = extractProtocolAndHostname(
                    entry.feed.feed_url,
                  );
                }

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
