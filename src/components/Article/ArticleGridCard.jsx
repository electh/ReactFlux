import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { memo, useState } from "react"

import FeedIcon from "@/components/ui/FeedIcon"
import { articleGridCardSettingsState } from "@/store/settingsState"
import { generateReadingTime, generateRelativeTime } from "@/utils/date"

import "./ArticleGridCard.css"

const MAX_CARD_SUMMARY_LENGTH = 320
const MIN_COVER_ASPECT_RATIO = 3 / 2
const MAX_COVER_ASPECT_RATIO = 2

const getAspectRatio = (width, height) => {
  const numericWidth = Number(width)
  const numericHeight = Number(height)
  if (
    !Number.isFinite(numericWidth) ||
    numericWidth <= 0 ||
    !Number.isFinite(numericHeight) ||
    numericHeight <= 0
  ) {
    return null
  }

  return numericWidth / numericHeight
}

const shouldCropCover = (aspectRatio) =>
  aspectRatio !== null &&
  aspectRatio >= MIN_COVER_ASPECT_RATIO &&
  aspectRatio <= MAX_COVER_ASPECT_RATIO

const getInitialCoverState = (entry) => {
  const aspectRatio = getAspectRatio(entry.coverWidth, entry.coverHeight)

  return {
    coverSource: entry.coverSource,
    hasError: false,
    isReady: aspectRatio !== null,
    shouldCrop: aspectRatio === null ? false : shouldCropCover(aspectRatio),
  }
}

const getCardSummary = (summary) =>
  summary.length > MAX_CARD_SUMMARY_LENGTH
    ? `${summary.slice(0, MAX_CARD_SUMMARY_LENGTH - 1).trimEnd()}…`
    : summary

const ArticleGridCard = ({ entry, previewContent }) => {
  const { showCardSummary, showDetailedRelativeTime, showEstimatedReadingTime, showFeedIcon } =
    useStore(articleGridCardSettingsState)
  const [coverState, setCoverState] = useState(() => getInitialCoverState(entry))
  const isCurrentCover = coverState.coverSource === entry.coverSource
  const currentCoverState = isCurrentCover ? coverState : getInitialCoverState(entry)
  const { hasError, isReady, shouldCrop } = currentCoverState
  const hasCover = Boolean(entry.coverSource) && !hasError
  const cardSummary = getCardSummary(previewContent)

  const handleCoverLoad = (event) => {
    const { naturalHeight, naturalWidth } = event.currentTarget

    setCoverState({
      coverSource: entry.coverSource,
      hasError: false,
      isReady: true,
      shouldCrop: shouldCropCover(getAspectRatio(naturalWidth, naturalHeight)),
    })
  }

  const handleCoverError = () => {
    setCoverState({
      coverSource: entry.coverSource,
      hasError: true,
      isReady: false,
      shouldCrop: false,
    })
  }

  return (
    <div className={classNames("grid-card-content", { "grid-card-content-no-cover": !hasCover })}>
      {hasCover && (
        <div className="grid-card-media">
          <img
            alt=""
            decoding="async"
            height={entry.coverHeight || undefined}
            loading="lazy"
            src={entry.coverSource}
            width={entry.coverWidth || undefined}
            className={classNames("grid-card-cover", {
              "grid-card-cover-ready": isReady,
              "grid-card-cover-cropped": shouldCrop,
            })}
            onError={handleCoverError}
            onLoad={handleCoverLoad}
          />
        </div>
      )}

      <div className="grid-card-copy">
        <div className="grid-card-meta">
          <div className="grid-card-source">
            {showFeedIcon && <FeedIcon className="grid-card-feed-icon" feed={entry.feed} />}
            <span>{entry.feed.title}</span>
          </div>
          <time className="grid-card-time" dateTime={entry.published_at}>
            {generateRelativeTime(entry.published_at, showDetailedRelativeTime)}
          </time>
        </div>

        <h3 className="article-entry-title grid-card-title">{entry.title}</h3>

        {showCardSummary && cardSummary && <p className="grid-card-summary">{cardSummary}</p>}

        <div className="grid-card-footer">
          {showEstimatedReadingTime && (
            <span className="grid-card-reading-time">
              <IconClockCircle aria-hidden="true" />
              <span>{generateReadingTime(entry.reading_time)}</span>
            </span>
          )}
          <IconStarFill
            aria-hidden="true"
            className="grid-card-star"
            style={{ opacity: entry.starred ? 1 : 0 }}
          />
        </div>
      </div>
    </div>
  )
}

export default memo(ArticleGridCard)
