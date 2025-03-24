import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useMemo, useState, useRef } from "react"

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

  const { coverDisplayMode } = useStore(settingsState)

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
      <img alt={entry.id} src={entry.coverSource} style={imageStyle} />
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
  const {
    markReadOnScroll,
    showFeedIcon,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    coverDisplayMode,
  } = useStore(settingsState)
  const { activeContent } = useStore(contentState)
  const isSelected = activeContent?.id === entry.id
  const { handleToggleStatus } = useEntryActions()
  const isUnread = entry.status === "unread"

  const [hasError, setHasError] = useState(false)
  const [isWideImage, setIsWideImage] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const wasVisible = useRef(false)
  const cardRef = useRef(null)

  useEffect(() => {
    // If the article is read or scroll marking is not enabled, no observation needed
    if (!isUnread || !markReadOnScroll) {
      return
    }

    const markAsRead = async () => await handleToggleStatus(entry)

    const observer = new IntersectionObserver(
      ([entry]) => {
        const { boundingClientRect, rootBounds, isIntersecting } = entry

        // Record status when the article enters the viewport
        if (isIntersecting) {
          wasVisible.current = true
        } else if (wasVisible.current && boundingClientRect.top < rootBounds.top) {
          // Only mark as read when the card is completely above the viewport top and was previously visible
          markAsRead()
          observer.unobserve(entry.target)
        }
      },
      {
        // Set the root element as the scroll container
        root: document.querySelector(".entry-list"),
        // Set threshold to 0, triggered when completely leaving the viewport
        threshold: 0.2,
      },
    )

    const element = cardRef.current
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [entry, markReadOnScroll, handleToggleStatus, isUnread])

  useEffect(() => {
    let isSubscribed = true

    if (entry.coverSource) {
      const img = new Image()
      img.src = entry.coverSource

      img.onload = () => {
        if (isSubscribed) {
          const aspectRatio = img.naturalWidth / img.naturalHeight
          const isThumbnailSize = Math.max(img.width, img.height) <= 250

          // Determine image display mode based on user settings
          if (coverDisplayMode === "auto") {
            setIsWideImage(aspectRatio >= WIDE_IMAGE_RATIO && !isThumbnailSize)
          } else if (coverDisplayMode === "banner") {
            setIsWideImage(true)
          } else if (coverDisplayMode === "thumbnail") {
            setIsWideImage(false)
          }

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
  }, [entry.coverSource, coverDisplayMode])

  const getLineClamp = () => {
    const hasSideImage = entry.coverSource && !hasError && !isWideImage
    return !showEstimatedReadingTime && hasSideImage ? 4 : 3
  }

  const previewContent = useMemo(() => extractTextFromHtml(entry.content), [entry.content])

  return (
    <div
      ref={cardRef}
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
