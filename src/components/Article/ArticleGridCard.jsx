import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { memo, useState } from "react"

import FeedIcon from "@/components/ui/FeedIcon"
import { articleGridCardSettingsState } from "@/store/settingsState"
import { generateReadingTime, generateRelativeTime } from "@/utils/date"

import "./ArticleGridCard.css"

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

const getCoverCandidates = (entry) =>
  entry.coverCandidates?.length
    ? entry.coverCandidates
    : entry.coverSource
      ? [{ height: entry.coverHeight, src: entry.coverSource, width: entry.coverWidth }]
      : []

const ArticleGridCard = ({ entry, previewContent }) => {
  const { showCardSummary, showDetailedRelativeTime, showEstimatedReadingTime, showFeedIcon } =
    useStore(articleGridCardSettingsState)
  const [coverState, setCoverState] = useState(() => ({
    entryId: entry.id,
    failedSources: [],
    loaded: null,
  }))
  const candidates = getCoverCandidates(entry)
  const activeCoverState =
    coverState.entryId === entry.id
      ? coverState
      : { entryId: entry.id, failedSources: [], loaded: null }
  const currentCover =
    candidates.find(({ src }) => !activeCoverState.failedSources.includes(src)) ?? null
  const loadedCover =
    activeCoverState.loaded?.src === currentCover?.src ? activeCoverState.loaded : null
  const aspectRatio = getAspectRatio(
    loadedCover?.width ?? currentCover?.width,
    loadedCover?.height ?? currentCover?.height,
  )
  const isReady = aspectRatio !== null || loadedCover !== null
  const shouldCrop = shouldCropCover(aspectRatio)
  const hasCover = currentCover !== null
  const cardSummary = entry.cardSynopsis || previewContent

  const handleCoverLoad = ({ currentTarget }) => {
    const { naturalHeight, naturalWidth } = currentTarget

    setCoverState((previous) => ({
      entryId: entry.id,
      failedSources: previous.entryId === entry.id ? previous.failedSources : [],
      loaded: { height: naturalHeight, src: currentCover.src, width: naturalWidth },
    }))
  }

  const handleCoverError = () => {
    setCoverState((previous) => ({
      entryId: entry.id,
      failedSources:
        previous.entryId === entry.id
          ? [...new Set([...previous.failedSources, currentCover.src])]
          : [currentCover.src],
      loaded: null,
    }))
  }

  return (
    <div className={classNames("grid-card-content", { "grid-card-content-no-cover": !hasCover })}>
      {hasCover && (
        <div className="grid-card-media">
          <img
            alt=""
            decoding="async"
            height={currentCover.height || undefined}
            loading="lazy"
            src={currentCover.src}
            width={currentCover.width || undefined}
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
