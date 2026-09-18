import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useState } from "react"

import FeedIcon from "@/components/ui/FeedIcon"
import { articleCardSettingsState } from "@/store/settingsState"
import { WIDE_IMAGE_RATIO } from "@/utils/constants"
import { generateReadingTime, generateRelativeTime } from "@/utils/date"

import "./ArticleCard.css"

const ArticleCardImage = ({ coverDisplayMode, entry, isWideImage, onError, onLoad }) => {
  const imageSize = isWideImage
    ? { width: "100%", height: "100%" }
    : { width: "80px", height: "80px" }

  const imageStyle = {
    width: imageSize.width,
    height: imageSize.height,
    // When set to banner mode, add maximum height limit and object-fit style
    ...(coverDisplayMode === "banner" && {
      maxHeight: "183px",
      objectFit: "cover",
    }),
  }

  return (
    <div className="card-thumbnail">
      <img
        alt=""
        decoding="async"
        height={entry.coverHeight || undefined}
        loading="lazy"
        src={entry.coverSource}
        style={imageStyle}
        width={entry.coverWidth || undefined}
        onError={onError}
        onLoad={onLoad}
      />
    </div>
  )
}

const getInitialCoverState = (entry, coverDisplayMode) => {
  const width = Number(entry.coverWidth)
  const height = Number(entry.coverHeight)
  const hasDimensions = Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0
  const aspectRatio = hasDimensions ? width / height : null
  const isThumbnailSize = hasDimensions && Math.max(width, height) <= 250

  return {
    aspectRatio,
    coverDisplayMode,
    coverSource: entry.coverSource,
    hasError: false,
    isWideImage:
      coverDisplayMode === "banner" ||
      (coverDisplayMode === "auto" &&
        hasDimensions &&
        aspectRatio >= WIDE_IMAGE_RATIO &&
        !isThumbnailSize),
  }
}

const ArticleCard = ({ entry, previewContent }) => {
  const {
    coverDisplayMode,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    summaryLines,
  } = useStore(articleCardSettingsState)
  const [coverState, setCoverState] = useState(() => getInitialCoverState(entry, coverDisplayMode))
  const shouldShowCover = coverDisplayMode !== "none" && Boolean(entry.coverSource)
  const isCurrentCover =
    coverState.coverDisplayMode === coverDisplayMode && coverState.coverSource === entry.coverSource
  const currentCoverState = isCurrentCover
    ? coverState
    : getInitialCoverState(entry, coverDisplayMode)
  const { aspectRatio, hasError, isWideImage } = currentCoverState
  const shouldRenderCover = shouldShowCover && !hasError

  const handleCoverLoad = ({ currentTarget }) => {
    const width = currentTarget.naturalWidth
    const height = currentTarget.naturalHeight
    const nextAspectRatio = width > 0 && height > 0 ? width / height : null
    const isThumbnailSize = Math.max(width, height) <= 250

    setCoverState({
      aspectRatio: nextAspectRatio,
      coverDisplayMode,
      coverSource: entry.coverSource,
      hasError: false,
      isWideImage:
        coverDisplayMode === "banner" ||
        (coverDisplayMode === "auto" && nextAspectRatio >= WIDE_IMAGE_RATIO && !isThumbnailSize),
    })
  }

  const handleCoverError = () => {
    setCoverState({
      aspectRatio: null,
      coverDisplayMode,
      coverSource: entry.coverSource,
      hasError: true,
      isWideImage: false,
    })
  }

  return (
    <div className="card-content">
      <div className="card-header">
        <div className="card-meta">
          <div className="card-source">
            {showFeedIcon && <FeedIcon className="feed-icon-mini" feed={entry.feed} />}
            <div className="card-source-content">
              <span className="card-source-title">{entry.feed.title}</span>
              {entry.author && <span className="card-author">{entry.author}</span>}
            </div>
          </div>
          <div className="card-time-wrapper">
            <IconStarFill
              aria-hidden="true"
              className="icon-starred"
              style={{ opacity: entry.starred ? 1 : 0 }}
            />
            <time className="card-time" dateTime={entry.published_at}>
              {generateRelativeTime(entry.published_at, showDetailedRelativeTime)}
            </time>
          </div>
        </div>

        <h3 className="article-entry-title card-title">{entry.title}</h3>
      </div>

      {shouldRenderCover && isWideImage && (
        <div
          className="card-image-wide"
          style={{
            "--card-cover-aspect-ratio":
              coverDisplayMode === "banner" ? 16 / 9 : aspectRatio || 16 / 9,
          }}
        >
          <ArticleCardImage
            isWideImage
            coverDisplayMode={coverDisplayMode}
            entry={entry}
            onError={handleCoverError}
            onLoad={handleCoverLoad}
          />
        </div>
      )}

      <div className="card-body">
        <div className="card-text">
          {showEstimatedReadingTime && (
            <div className="card-reading-time">
              <IconClockCircle aria-hidden="true" />
              <span>{generateReadingTime(entry.reading_time)}</span>
            </div>
          )}
          {summaryLines > 0 && (
            <p
              className="card-preview"
              style={{ lineClamp: summaryLines, WebkitLineClamp: summaryLines }}
            >
              {previewContent}
            </p>
          )}
        </div>
        {shouldRenderCover && !isWideImage && (
          <div className="card-image-mini">
            <ArticleCardImage
              coverDisplayMode={coverDisplayMode}
              entry={entry}
              isWideImage={false}
              onError={handleCoverError}
              onLoad={handleCoverLoad}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ArticleCard)
