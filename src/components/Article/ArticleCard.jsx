import { Card, Message, Typography } from "@arco-design/web-react";
import {
  IconMinusCircle,
  IconRecord,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import classNames from "classnames";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useSwipeable } from "react-swipeable";

import useStore from "../../Store";
import useEntryActions from "../../hooks/useEntryActions";
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

const RenderImage = ({ entry, isThumbnail }) => {
  const imageSize = isThumbnail
    ? { width: "100px", height: "100px" }
    : { width: "100%", height: "160px" };
  if (!entry.imgSrc) {
    return null;
  }

  return (
    <div className={isThumbnail ? "thumbnail" : "cover-image"}>
      <ImageWithLazyLoading
        alt={entry.id}
        borderRadius={isThumbnail ? "4px" : undefined}
        src={entry.imgSrc}
        status={entry.status}
        width={imageSize.width}
        height={imageSize.height}
      />
    </div>
  );
};

const ArticleCardContent = ({ entry, showFeedIcon, mini }) => {
  const contentClass = classNames({
    "article-card-mini-content": mini,
    "article-card-mini-content-padding": mini && showFeedIcon,
  });

  return (
    <div className={contentClass}>
      <div style={{ padding: mini ? "0 8px 0 0" : "0 0 8px 0" }}>
        <RenderImage entry={entry} isThumbnail={mini} />
      </div>
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
    </div>
  );
};

const ArticleCard = ({ entry, handleEntryClick, mini }) => {
  const activeContent = useStore((state) => state.activeContent);
  const showFeedIcon = useStore((state) => state.showFeedIcon);
  const markReadOnScroll = useStore((state) => state.markReadOnScroll);

  const isSelected = activeContent && entry.id === activeContent.id;

  const { handleToggleStarred, handleToggleStatus } = useEntryActions();

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const swipeThreshold = 50;
  const actionContainerWidth = 54;

  const isStarred = entry.starred;
  const isUnread = entry.status === "unread";

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const newOffset =
        Math.min(Math.abs(eventData.deltaX), swipeThreshold) *
        Math.sign(eventData.deltaX);
      setSwipeOffset(newOffset);
    },
    onSwiped: (eventData) => {
      if (eventData.deltaX > swipeThreshold) {
        handleToggleStarred(entry).then(() =>
          Message.success(
            isStarred ? "Unmarked as starred" : "Marked as starred",
          ),
        );
      } else if (eventData.deltaX < -swipeThreshold) {
        handleToggleStatus(entry).then(() =>
          Message.success(isUnread ? "Marked as read" : "Marked as unread"),
        );
      }
      setSwipeOffset(0);
    },
  });

  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(false);
  const toggleStatus = () => handleToggleStatus(entry);
  const threshold = 20;

  const { ref } = useInView({
    skip: shouldSkip,
    onChange: (inView, entry) => {
      if (!markReadOnScroll || !isUnread) {
        return;
      }
      if (inView) {
        setHasBeenInView(true);
      } else if (hasBeenInView) {
        const { top } = entry.boundingClientRect;
        if (top < threshold) {
          toggleStatus();
          setShouldSkip(true);
        }
      }
    },
  });

  return (
    <div
      {...handlers}
      className="article-card"
      style={{ visibility: isVisible ? "visible" : "hidden" }}
      key={entry.id}
    >
      <div ref={ref}>
        <motion.div
          className="swipe-card"
          style={{ x: swipeOffset }}
          initial={{ x: actionContainerWidth }}
          animate={{ x: swipeOffset }}
          transition={{ type: "tween" }}
          onAnimationComplete={() => setIsVisible(true)}
        >
          <div className="swipe-action left">
            {isStarred ? (
              <IconStarFill style={{ color: "#ffcd00" }} />
            ) : (
              <IconStar />
            )}
          </div>
          <Card
            className={classNames(
              "swipe-content",
              "card-custom-style",
              "card-custom-hover-style",
              {
                "card-custom-selected-style": isSelected,
              },
            )}
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
                />
              }
            />
          </Card>
          <div className="swipe-action right">
            {isUnread ? <IconMinusCircle /> : <IconRecord />}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArticleCard;
