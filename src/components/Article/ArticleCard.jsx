import { Card, Message, Typography } from "@arco-design/web-react";
import {
  IconMinusCircle,
  IconRecord,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import classNames from "classnames";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useSwipeable } from "react-swipeable";

import { useStore } from "@nanostores/react";
import { motion } from "framer-motion";
import useEntryActions from "../../hooks/useEntryActions";
import { polyglotState } from "../../hooks/useLanguage";
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

const getPadding = (imgSrc, isMini) => {
  if (!imgSrc) {
    return "0";
  }
  return isMini ? "0 10px 0 0" : "0 0 10px 0";
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
      <div style={{ padding: getPadding(entry.imgSrc, mini) }}>
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
  const { markReadOnScroll, showFeedIcon, swipeCardEnabled } =
    useStore(settingsState);
  const { activeContent } = useStore(contentState);
  const { polyglot } = useStore(polyglotState);

  const isSelected = activeContent && entry.id === activeContent.id;

  const { handleToggleStarred, handleToggleStatus } = useEntryActions();

  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeThreshold = 60;
  const initialDampingFactor = 0.5;

  const isStarred = entry.starred;
  const isUnread = entry.status === "unread";

  const handlers = useSwipeable({
    preventScrollOnSwipe: true,
    delta: swipeThreshold / 2,
    onSwiping: (eventData) => {
      if (!swipeCardEnabled) {
        return;
      }

      const newOffset =
        Math.min(
          Math.abs(eventData.deltaX * initialDampingFactor),
          swipeThreshold,
        ) * Math.sign(eventData.deltaX);
      setSwipeOffset(newOffset);
    },
    onSwiped: async (eventData) => {
      if (!swipeCardEnabled) {
        return;
      }

      try {
        if (eventData.deltaX > swipeThreshold) {
          await handleToggleStarred(entry);
          Message.success(
            isStarred
              ? polyglot.t("article_card.unstarred")
              : polyglot.t("article_card.starred"),
          );
        } else if (eventData.deltaX < -swipeThreshold) {
          await handleToggleStatus(entry);
          Message.success(
            isUnread
              ? polyglot.t("article_card.marked_as_read")
              : polyglot.t("article_card.marked_as_unread"),
          );
        }
      } catch (error) {
        console.error("Failed to update entry: ", error);
        Message.error(polyglot.t("article_card.update_failed"));
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
    <div className="article-card" key={entry.id} {...handlers}>
      <div ref={ref}>
        <motion.div
          className="swipe-card"
          style={{ x: swipeOffset }}
          animate={{ x: swipeOffset }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
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
                >
                  {children}
                </ArticleCardContent>
              }
            />
          </Card>
        </motion.div>
        {swipeCardEnabled && (
          <div className="swipe-actions">
            <div className="swipe-action left">
              {isStarred ? (
                <IconStarFill style={{ color: "#ffcd00", fontSize: "24px" }} />
              ) : (
                <IconStar style={{ color: "#ffffff", fontSize: "24px" }} />
              )}
            </div>
            <div className="swipe-action right">
              {isUnread ? (
                <IconMinusCircle
                  style={{ color: "#ffffff", fontSize: "24px" }}
                />
              ) : (
                <IconRecord style={{ color: "#ffffff", fontSize: "24px" }} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleCard;
