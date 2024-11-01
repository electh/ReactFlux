import { Card, Typography } from "@arco-design/web-react";
import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon";
import classNames from "classnames";
import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { useStore } from "@nanostores/react";
import useEntryActions from "../../hooks/useEntryActions";
import { contentState } from "../../store/contentState";
import { settingsState } from "../../store/settingsState";
import { generateReadingTime, generateRelativeTime } from "../../utils/date";
import sanitizeHtml from "../../utils/sanitizeHtml";
import FeedIcon from "../ui/FeedIcon";
import ImageWithLazyLoading from "./ImageWithLazyLoading";
import "./ArticleCard.css";

const ASPECT_RATIO_THRESHOLD = 4 / 3;

const ArticleCardImage = ({
  entry,
  setHasError,
  isWideImage,
  onLoadComplete,
}) => {
  const imageSize = isWideImage
    ? { width: "100%", height: "100%" }
    : { width: "80px", height: "80px" };

  const handleImageLoad = (e) => {
    const img = e.target;
    if (img) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      onLoadComplete(aspectRatio);
    }
  };

  return (
    <div className={"thumbnail"}>
      <ImageWithLazyLoading
        alt={entry.id}
        borderRadius={"2px"}
        src={entry.imgSrc}
        status={entry.status}
        width={imageSize.width}
        height={imageSize.height}
        setHasError={setHasError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

const extractTextFromHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const ArticleCardContent = ({ entry, showFeedIcon, children }) => {
  const { showDetailedRelativeTime, showEstimatedReadingTime } =
    useStore(settingsState);

  const [hasError, setHasError] = useState(false);
  const [isWideImage, setIsWideImage] = useState(false);

  const contentClass = classNames({
    "article-card-mini-content": true,
    "article-card-mini-content-padding": showFeedIcon,
  });

  const handleImageLoadComplete = (aspectRatio) => {
    setIsWideImage(aspectRatio >= ASPECT_RATIO_THRESHOLD);
  };

  return (
    <div
      className={contentClass}
      style={{
        width: "100%",
        boxSizing: "border-box",
        opacity: entry.status === "unread" ? 1 : 0.5,
      }}
    >
      <div className="article-card-mini-content-text">
        <div className="article-card-header">
          <div className="article-card-meta">
            <Typography.Text
              className="article-card-info article-title"
              style={{ lineHeight: "1em" }}
            >
              {showFeedIcon && (
                <FeedIcon feed={entry.feed} className="feed-icon-mini" />
              )}
              {entry.feed.title}
            </Typography.Text>
            <Typography.Text
              className="article-card-info published-time"
              style={{ lineHeight: "1em" }}
            >
              {generateRelativeTime(
                entry.published_at,
                showDetailedRelativeTime,
              )}
            </Typography.Text>
          </div>
          <Typography.Ellipsis
            className="article-card-info"
            style={{ lineHeight: "1em" }}
            rows={1}
            expandable={false}
          >
            {entry.author}
          </Typography.Ellipsis>
          <Typography.Ellipsis
            className="article-card-title"
            rows={2}
            expandable={false}
          >
            {entry.title}
          </Typography.Ellipsis>
        </div>
        {entry.imgSrc && !hasError && isWideImage && (
          <div className="article-card-image-container-wide">
            <ArticleCardImage
              entry={entry}
              setHasError={setHasError}
              isWideImage={isWideImage}
              onLoadComplete={handleImageLoadComplete}
            />
          </div>
        )}
        <div className="article-card-body">
          <div className="article-card-content">
            <Typography.Text
              className="article-card-info"
              style={{ lineHeight: "1em" }}
            >
              <div style={{ marginBottom: 8 }}>
                {showEstimatedReadingTime && (
                  <>
                    <IconClockCircle />{" "}
                    {generateReadingTime(entry.reading_time)}
                  </>
                )}
              </div>
            </Typography.Text>
            <Typography.Ellipsis
              className="article-card-preview"
              rows={3}
              expandable={false}
            >
              {extractTextFromHtml(sanitizeHtml(entry.content))}
            </Typography.Ellipsis>
            <Typography.Text
              className="article-card-info"
              style={{ lineHeight: "1em" }}
            >
              {entry.starred && <IconStarFill className="icon-starred" />}
            </Typography.Text>
          </div>
          {entry.imgSrc && !hasError && !isWideImage && (
            <div className="article-card-image-container-mini">
              <ArticleCardImage
                entry={entry}
                setHasError={setHasError}
                isWideImage={isWideImage}
                onLoadComplete={handleImageLoadComplete}
              />
            </div>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

const ArticleCard = ({ entry, handleEntryClick, children }) => {
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
              <ArticleCardContent entry={entry} showFeedIcon={showFeedIcon}>
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
