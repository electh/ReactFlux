import { Card, Typography } from "@arco-design/web-react";
import { IconStarFill } from "@arco-design/web-react/icon";
import classNames from "classnames";
import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { useStore } from "@nanostores/react";
import useEntryActions from "../../hooks/useEntryActions";
import { contentState } from "../../store/contentState";
import { settingsState } from "../../store/settingsState";
import { generateReadingTime, generateRelativeTime } from "../../utils/date";
import FeedIcon from "../ui/FeedIcon";
import ImageWithLazyLoading from "./ImageWithLazyLoading";
import "./ArticleCard.css";

const ArticleCardImage = ({ entry, isThumbnail }) => {
  if (!entry.imgSrc) {
    return null;
  }

  const imageSize = isThumbnail
    ? { width: "80px", height: "80px" }
    : { width: "100%", height: "160px" };

  return (
    <div className={isThumbnail ? "thumbnail" : "cover-image"}>
      <ImageWithLazyLoading
        alt={entry.id}
        borderRadius={isThumbnail ? "2px" : undefined}
        src={entry.imgSrc}
        status={entry.status}
        width={imageSize.width}
        height={imageSize.height}
      />
    </div>
  );
};

const getMargin = (imgSrc, isMini) => {
  if (!imgSrc) {
    return "0";
  }
  return isMini ? "0" : "0 0 10px 0";
};

const ArticleCardContent = ({ entry, showFeedIcon, mini, children }) => {
  const { showDetailedRelativeTime, showEstimatedReadingTime } =
    useStore(settingsState);
  const contentClass = classNames({
    "article-card-mini-content": mini,
    "article-card-mini-content-padding": mini && showFeedIcon,
  });

  return (
    <div
      className={contentClass}
      style={{
        width: "100%",
        boxSizing: "border-box",
        opacity: entry.status === "unread" ? 1 : 0.5,
      }}
    >
      <div
        className={
          mini
            ? "article-card-image-container-mini"
            : "article-card-image-container"
        }
        style={{ margin: getMargin(entry.imgSrc, mini) }}
      >
        <ArticleCardImage entry={entry} isThumbnail={mini} />
      </div>
      <div className={mini ? "article-card-mini-content-text" : ""}>
        <Typography.Ellipsis
          className="article-card-title"
          rows={2}
          expandable={false}
        >
          {entry.title}
        </Typography.Ellipsis>
        <Typography.Text
          className="article-card-info"
          style={{ lineHeight: "1em" }}
        >
          {showFeedIcon && (
            <FeedIcon
              feed={entry.feed}
              className={mini ? "feed-icon-mini" : "feed-icon"}
            />
          )}
          {entry.feed.title}
          <br />
          {generateRelativeTime(entry.published_at, showDetailedRelativeTime)}
          {showEstimatedReadingTime && (
            <>
              <br />
              {generateReadingTime(entry.reading_time)}
            </>
          )}
        </Typography.Text>
        {entry.starred && <IconStarFill className="icon-starred" />}
      </div>
      <div>{children}</div>
    </div>
  );
};

const ArticleCard = ({ entry, handleEntryClick, mini, children }) => {
  const { markReadOnScroll, showFeedIcon } = useStore(settingsState);
  const { activeContent } = useStore(contentState);

  const isSelected = activeContent && entry.id === activeContent.id;

  const { handleToggleStatus } = useEntryActions();

  const isUnread = entry.status === "unread";

  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(false);
  const toggleStatus = () => handleToggleStatus(entry);
  const threshold = 20;

  const { ref } = useInView({
    skip: shouldSkip,
    onChange: async (inView, entry) => {
      if (!markReadOnScroll || !isUnread) {
        return;
      }
      if (inView) {
        setHasBeenInView(true);
      } else if (hasBeenInView) {
        const { top } = entry.boundingClientRect;
        if (top < threshold) {
          await toggleStatus();
          setShouldSkip(true);
        }
      }
    },
  });

  return (
    <div
      className={
        isSelected ? "article-card card-custom-selected-style" : "article-card"
      }
      key={entry.id}
    >
      <div ref={ref}>
        <Card
          className="card-custom-style"
          data-entry-id={entry.id}
          hoverable
          onClick={() => handleEntryClick(entry)}
          bordered={false}
        >
          <Card.Meta
            description={
              <ArticleCardContent
                entry={entry}
                showFeedIcon={showFeedIcon}
                mini={mini}
              >
                {children}
              </ArticleCardContent>
            }
          />
        </Card>
      </div>
    </div>
  );
};

export default ArticleCard;
