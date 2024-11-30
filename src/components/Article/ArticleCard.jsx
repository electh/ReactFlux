import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useMemo, useState } from "react"
import { useInView } from "react-intersection-observer"

import FeedIcon from "@/components/ui/FeedIcon"
import useEntryActions from "@/hooks/useEntryActions"
import { contentState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { WIDE_IMAGE_RATIO } from "@/utils/constants"
import { generateReadingTime, generateRelativeTime } from "@/utils/date"
import "./ArticleCard.css"

const ArticleCardImage = ({ entry, isWideImage }) => {
  const imageSize = isWideImage
    ? { width: "100%", height: "100%" }
    : { width: "80px", height: "80px" }

  return (
    <div className="card-thumbnail">
      <img
        alt={entry.id}
        src={entry.coverSource}
        style={{
          width: imageSize.width,
          height: imageSize.height,
        }}
      />
    </div>
  )
}

const extractTextFromHtml = (html) => {
  if (!html) {
    return ""
  }

  return html
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&nbsp;/g, " ") // Replace space entities
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec)) // Handle numeric HTML entities
    .replace(/&([a-z]+);/g, (_match, entity) => {
      // Handle named HTML entities
      const entities = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
      }
      return entities[entity] || ""
    })
    .trim()
}

const ArticleCard = ({ entry, handleEntryClick, children }) => {
  const { markReadOnScroll, showFeedIcon, showDetailedRelativeTime, showEstimatedReadingTime } =
    useStore(settingsState)
  const { activeContent } = useStore(contentState)
  const isSelected = activeContent && entry.id === activeContent.id
  const { handleToggleStatus } = useEntryActions()
  const isUnread = entry.status === "unread"

  const [hasBeenInView, setHasBeenInView] = useState(false)
  const [shouldSkip, setShouldSkip] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isWideImage, setIsWideImage] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const toggleStatus = () => handleToggleStatus(entry)
  const threshold = 20

  const { ref } = useInView({
    skip: shouldSkip,
    onChange: async (inView, entry) => {
      if (!markReadOnScroll || !isUnread) {
        return
      }

      if (inView) {
        setHasBeenInView(true)
      } else if (hasBeenInView) {
        const { top } = entry.boundingClientRect
        if (top < threshold) {
          await toggleStatus()
          setShouldSkip(true)
        }
      }
    },
  })

  useEffect(() => {
    let isSubscribed = true

    if (entry.coverSource) {
      const img = new Image()
      img.src = entry.coverSource

      img.onload = () => {
        if (isSubscribed) {
          const aspectRatio = img.naturalWidth / img.naturalHeight
          const isThumbnailSize = Math.max(img.width, img.height) <= 250
          setIsWideImage(aspectRatio >= WIDE_IMAGE_RATIO && !isThumbnailSize)
          setIsImageLoaded(true)
        }
      }

      img.onerror = () => {
        if (isSubscribed) {
          setHasError(true)
        }
      }

      return () => {
        isSubscribed = false
        img.src = ""
        img.onload = null
        img.onerror = null
      }
    }
  }, [entry.coverSource])

  const getLineClamp = () => {
    const hasSideImage = entry.coverSource && !hasError && !isWideImage
    return !showEstimatedReadingTime && hasSideImage ? 4 : 3
  }

  const previewContent = useMemo(() => extractTextFromHtml(entry.content), [entry.content])

  return (
    <div
      ref={ref}
      className={isSelected ? "card-wrapper selected" : "card-wrapper"}
      data-entry-id={entry.id}
      onClick={() => handleEntryClick(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleEntryClick(entry)
        }
      }}
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
              {showFeedIcon && <FeedIcon className="feed-icon-mini" feed={entry.feed} />}
              <div className="card-source-content">
                <span className="card-source-title">{entry.feed.title}</span>
                <span className="card-author">{entry.author}</span>
              </div>
            </div>
            <div className="card-time-wrapper">
              <span className="card-star">
                <IconStarFill className="icon-starred" style={{ opacity: entry.starred ? 1 : 0 }} />
              </span>
              <span className="card-time">
                {generateRelativeTime(entry.published_at, showDetailedRelativeTime)}
              </span>
            </div>
          </div>

          <h3 className="card-title">{entry.title}</h3>
        </div>

        {entry.coverSource && !hasError && isImageLoaded && isWideImage && (
          <div className="card-image-wide">
            <ArticleCardImage entry={entry} isWideImage={isWideImage} setHasError={setHasError} />
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
              style={{ lineClamp: getLineClamp(), WebkitLineClamp: getLineClamp() }}
            >
              {previewContent}
            </p>
          </div>
          {entry.coverSource && !hasError && isImageLoaded && !isWideImage && (
            <div className="card-image-mini">
              <ArticleCardImage entry={entry} isWideImage={isWideImage} setHasError={setHasError} />
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

export default ArticleCard
