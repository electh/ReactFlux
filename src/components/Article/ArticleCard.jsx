import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon";
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
    <div className="card-thumbnail">
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

const ArticleCard = ({ entry, handleEntryClick, children }) => {
  const {
    markReadOnScroll,
    showFeedIcon,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
  } = useStore(settingsState);
  const { activeContent } = useStore(contentState);
  const isSelected = activeContent && entry.id === activeContent.id;
  const { handleToggleStatus } = useEntryActions();
  const isUnread = entry.status === "unread";

  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isWideImage, setIsWideImage] = useState(false);

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

  const handleImageLoadComplete = (aspectRatio) => {
    setIsWideImage(aspectRatio >= ASPECT_RATIO_THRESHOLD);
  };

  const getLineClamp = () => {
    const hasSideImage = entry.imgSrc && !hasError && !isWideImage;
    return !showEstimatedReadingTime && hasSideImage ? 4 : 3;
  };

  return (
    <div
      ref={ref}
      className={isSelected ? "card-wrapper selected" : "card-wrapper"}
      onClick={() => handleEntryClick(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleEntryClick(entry);
        }
      }}
      data-entry-id={entry.id}
    >
      <div
        className="card-content"
        style={{
          opacity: isUnread ? 1 : 0.5,
        }}
      >
        <div className="card-header">
          <div className="card-meta">
            <div className="card-source">
              {showFeedIcon && (
                <FeedIcon feed={entry.feed} className="feed-icon-mini" />
              )}
              <div className="card-source-content">
                <span className="card-source-title">{entry.feed.title}</span>
                <span className="card-author">{entry.author}</span>
              </div>
            </div>
            <span className="card-time">
              {generateRelativeTime(
                entry.published_at,
                showDetailedRelativeTime,
              )}
            </span>
          </div>

          <h3 className="card-title">{entry.title}</h3>
        </div>

        {entry.imgSrc && !hasError && isWideImage && (
          <div className="card-image-wide">
            <ArticleCardImage
              entry={entry}
              setHasError={setHasError}
              isWideImage={isWideImage}
              onLoadComplete={handleImageLoadComplete}
            />
          </div>
        )}

        <div className="card-body">
          <div className="card-text">
            {showEstimatedReadingTime && (
              <div className="card-reading-time">
                <IconClockCircle />
                <span>{generateReadingTime(entry.reading_time)}</span>
              </div>
            )}
            <p
              className="card-preview"
              style={{ WebkitLineClamp: getLineClamp() }}
            >
              {extractTextFromHtml(sanitizeHtml(entry.content))}
            </p>
            {entry.starred && <IconStarFill className="icon-starred" />}
          </div>

          {entry.imgSrc && !hasError && !isWideImage && (
            <div className="card-image-mini">
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
      {children}
    </div>
  );
};

export default ArticleCard;
