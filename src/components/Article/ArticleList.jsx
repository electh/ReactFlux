import { Button } from "@arco-design/web-react";
import { IconArrowDown } from "@arco-design/web-react/icon";
import React, { forwardRef, useContext } from "react";
import isURL from "validator/es/lib/isURL";

import useStore from "../../Store";
import useLoadMore from "../../hooks/useLoadMore";
import { extractProtocolAndHostname } from "../../utils/url";
import ContentContext from "../Content/ContentContext";
import ArticleCard from "./ArticleCard";
import ArticleCardMini from "./ArticleCardMini";
import LoadingCards from "./LoadingCards";
import SearchAndSortBar from "./SearchAndSortBar.jsx";

const ArticleList = forwardRef(
  ({ info, loading, getEntries, handleEntryClick, cardsRef }, ref) => {
    const {
      filteredEntries,
      filterStatus,
      loadMoreUnreadVisible,
      loadMoreVisible,
    } = useContext(ContentContext);

    const { loadingMore, handleLoadMore } = useLoadMore();
    const layout = useStore((state) => state.layout);

    return (
      <div
        className="entry-list"
        ref={ref}
        style={{
          overflowY: "auto",
          padding: "10px 10px 0 10px",
          width: "302px",
          backgroundColor: "var(--color-fill-1)",
          flex: "1",
        }}
      >
        <SearchAndSortBar />
        <LoadingCards loading={loading} />
        {loading ? null : (
          <div ref={cardsRef}>
            {filteredEntries.map((entry) => {
              if (!isURL(entry.feed.site_url)) {
                entry.feed.site_url = extractProtocolAndHostname(
                  entry.feed.feed_url,
                );
              }

              const ArticleComponent =
                layout === "small" ? ArticleCardMini : ArticleCard;
              return (
                <ArticleComponent
                  key={entry.id}
                  entry={entry}
                  handleEntryClick={handleEntryClick}
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
              onClick={() => handleLoadMore(info, getEntries)}
              loading={loadingMore}
              long={true}
              style={{ margin: "10px auto", display: "block" }}
            >
              {!loadingMore && <IconArrowDown />}Load more
            </Button>
          )}
      </div>
    );
  },
);

export default ArticleList;
