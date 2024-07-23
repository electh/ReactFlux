import { Card, Message, Typography } from "@arco-design/web-react";
import {
  IconMinusCircle,
  IconRecord,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import { animated, useSpring } from "@react-spring/web";
import classNames from "classnames";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useSwipeable } from "react-swipeable";

import { useAtomValue } from "jotai";
import { configAtom } from "../../atoms/configAtom";
import { useActiveContent } from "../../hooks/useActiveContent";
import useEntryActions from "../../hooks/useEntryActions";
import { generateRelativeTime } from "../../utils/date";
import FeedIcon from "../ui/FeedIcon";
import "./ArticleCard.css";
import ImageWithLazyLoading from "./ImageWithLazyLoading";

const RenderImage = ({ entry, isThumbnail }) => {
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

const ArticleCardContent = ({ entry, showFeedIcon, mini, children }) => {
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
        style={{
          padding: !entry.imgSrc ? "0" : mini ? "0 10px 0 0" : "0 0 10px 0",
        }}
      >
        <RenderImage entry={entry} isThumbnail={mini} />
      </div>
      <div className={mini ? "article-card-mini-content-text" : ""}>
        <Typography.Text className="article-card-title">
          {entry.title}
        </Typography.Text>
        <Typography.Text className="article-card-info">
          <br />
          {showFeedIcon && (
            <FeedIcon
              feed={entry.feed}
              className={mini ? "feed-icon-mini" : "feed-icon"}
            />
          )}
          {entry.feed.title}
          <br />
          {generateRelativeTime(entry.published_at)}
        </Typography.Text>
        {entry.starred && <IconStarFill className="icon-starred" />}
      </div>
      <div>{children}</div>
    </div>
  );
};

const ArticleCard = ({ entry, handleEntryClick, mini, children }) => {
  const { activeContent } = useActiveContent();
  const config = useAtomValue(configAtom);
  const { markReadOnScroll, showFeedIcon } = config;

  const isSelected = activeContent && entry.id === activeContent.id;

  const { handleToggleStarred, handleToggleStatus } = useEntryActions();

  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeThreshold = 100;
  const initialDampingFactor = 0.5;

  const isStarred = entry.starred;
  const isUnread = entry.status === "unread";

  const handlers = useSwipeable({
    preventScrollOnSwipe: true,
    delta: swipeThreshold / 2,
    onSwiping: (eventData) => {
      const newOffset =
        Math.min(
          Math.abs(eventData.deltaX * initialDampingFactor),
          swipeThreshold,
        ) * Math.sign(eventData.deltaX);
      setSwipeOffset(newOffset);
    },
    onSwiped: async (eventData) => {
      try {
        if (eventData.deltaX > swipeThreshold) {
          await handleToggleStarred(entry);
          Message.success(
            isStarred ? "Unmarked as starred" : "Marked as starred",
          );
        } else if (eventData.deltaX < -swipeThreshold) {
          await handleToggleStatus(entry);
          Message.success(isUnread ? "Marked as read" : "Marked as unread");
        }
      } catch (error) {
        Message.error("Failed to update, please try again");
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

  const styles = useSpring({ x: swipeOffset });

  return (
    <div {...handlers} className="article-card" key={entry.id}>
      <div ref={ref}>
        <animated.div className="swipe-card" style={styles}>
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
        </animated.div>
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
              <IconMinusCircle style={{ color: "#ffffff", fontSize: "24px" }} />
            ) : (
              <IconRecord style={{ color: "#ffffff", fontSize: "24px" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
