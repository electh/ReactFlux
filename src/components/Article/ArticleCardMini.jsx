import { Card, Typography } from "@arco-design/web-react";
import { IconStarFill } from "@arco-design/web-react/icon";
import classNames from "classnames";
import React from "react";

import useStore from "../../Store";
import { generateRelativeTime } from "../../utils/date";
import "./ArticleCard.css";
import ImageWithLazyLoading from "./ImageWithLazyLoading";

const FeedIcon = ({ url }) => (
  <img
    className="feed-icon-mini"
    src={`https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`}
    alt="Icon"
  />
);

const ArticleMiniCardContent = ({ entry, showFeedIcon }) => (
  <div
    className={`article-card-mini-content ${
      showFeedIcon ? "article-card-mini-content-padding" : ""
    }`}
  >
    <div className="article-card-mini-content-text">
      <Typography.Text
        className={entry.status === "unread" ? "title-unread" : "title-read"}
      >
        {entry.title}
      </Typography.Text>
      <Typography.Text className="article-info">
        <br />
        {showFeedIcon && <FeedIcon url={entry.feed.site_url} />}
        {entry.feed.title}
        <br />
        {generateRelativeTime(entry.published_at)}
      </Typography.Text>
      {entry.starred && <IconStarFill className="icon-starred" />}
    </div>
    {entry.imgSrc && (
      <div className="thumbnail">
        <ImageWithLazyLoading
          alt={entry.id}
          borderRadius="4px"
          height="100px"
          src={entry.imgSrc}
          status={entry.status}
          width={"100px"}
        />
      </div>
    )}
  </div>
);

const ArticleCardMini = ({ entry, handleEntryClick }) => {
  const activeContent = useStore((state) => state.activeContent);
  const showFeedIcon = useStore((state) => state.showFeedIcon);

  const isSelected = activeContent && entry.id === activeContent.id;

  const entryClickHandler = () => handleEntryClick(entry);

  return (
    <div className="article-card" key={entry.id}>
      <Card
        className={classNames("card-custom-style", "card-custom-hover-style", {
          "card-custom-selected-style": isSelected,
        })}
        data-entry-id={entry.id}
        hoverable
        onClick={entryClickHandler}
      >
        <Card.Meta
          description={
            <ArticleMiniCardContent entry={entry} showFeedIcon={showFeedIcon} />
          }
        />
      </Card>
    </div>
  );
};

export default ArticleCardMini;
