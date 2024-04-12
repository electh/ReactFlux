import { Card, Typography } from "@arco-design/web-react";
import { IconStarFill } from "@arco-design/web-react/icon";
import classNames from "classnames";
import React from "react";

import useStore from "../../Store";
import { generateRelativeTime } from "../../utils/date";
import "./ArticleCard.css";
import ImageWithLazyLoading from "./ImageWithLazyLoading";

const FeedIcon = ({ url, mini }) => (
  <img
    className={mini ? "feed-icon-mini" : "feed-icon"}
    src={`https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`}
    alt="Feed icon"
  />
);

const renderImage = (entry, isThumbnail) => {
  const imageSize = isThumbnail
    ? { width: "100px", height: "100px" }
    : { width: "100%", height: "160px" };
  const className = isThumbnail ? "thumbnail" : "cover-image";

  return (
    entry.imgSrc && (
      <div className={className}>
        <ImageWithLazyLoading
          alt={entry.id}
          borderRadius={isThumbnail ? "4px" : undefined}
          src={entry.imgSrc}
          status={entry.status}
          width={imageSize.width}
          height={imageSize.height}
        />
      </div>
    )
  );
};

const ArticleCardContent = ({ entry, showFeedIcon, mini }) => {
  const contentClass = classNames({
    "article-card-mini-content": mini,
    "article-card-mini-content-padding": mini && showFeedIcon,
  });

  const imageSection = mini ? renderImage(entry, true) : null;

  return (
    <div className={contentClass}>
      <div className={mini ? "article-card-mini-content-text" : ""}>
        <Typography.Text
          className={entry.status === "unread" ? "title-unread" : "title-read"}
        >
          {entry.title}
        </Typography.Text>
        <Typography.Text className="article-info">
          <br />
          {showFeedIcon && <FeedIcon url={entry.feed.site_url} mini={mini} />}
          {entry.feed.title}
          <br />
          {generateRelativeTime(entry.published_at)}
        </Typography.Text>
        {entry.starred && <IconStarFill className="icon-starred" />}
      </div>
      {imageSection}
    </div>
  );
};

const ArticleCard = ({ entry, handleEntryClick, mini }) => {
  const activeContent = useStore((state) => state.activeContent);
  const showFeedIcon = useStore((state) => state.showFeedIcon);

  const isSelected = activeContent && entry.id === activeContent.id;

  const entryClickHandler = () => handleEntryClick(entry);

  const coverImage = mini ? null : renderImage(entry, false);

  return (
    <div className="article-card" key={entry.id}>
      <Card
        className={classNames("card-custom-style", "card-custom-hover-style", {
          "card-custom-selected-style": isSelected,
        })}
        cover={coverImage}
        data-entry-id={entry.id}
        hoverable
        onClick={entryClickHandler}
      >
        <Card.Meta
          description={
            <ArticleCardContent
              entry={entry}
              showFeedIcon={showFeedIcon}
              mini={mini}
            />
          }
        />
      </Card>
    </div>
  );
};

export default ArticleCard;
