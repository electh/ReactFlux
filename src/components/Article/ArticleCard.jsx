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

  const [hasError, setHasError] = useState(false)
  const [isWideImage, setIsWideImage] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const toggleStatus = async () => await handleToggleStatus(entry)
  const hasBeenVisible = useRef(false)
  const cardRef = useRef(null)

  useEffect(() => {
    // 如果文章已读或未启用滚动标记已读,则不需要观察
    if (entry.status === "read" || !markReadOnScroll) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardRect = entry.boundingClientRect
          const rootRect = entry.rootBounds

          // 当文章进入视口时记录状态
          if (entry.isIntersecting) {
            hasBeenVisible.current = true
          }
          // 只有当卡片完全在视口顶部以上,且之前显示过时才标记已读
          else if (hasBeenVisible.current && cardRect.top < rootRect.top) {
            // console.log(cardRect.bottom, rootRect.top, '标记已读');
            toggleStatus(entry)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        // 设置根元素为滚动容器
        root: document.querySelector(".entry-list"),
        // 设置阈值为0,表示完全离开视口时触发
        threshold: 0.2,
      },
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [entry, markReadOnScroll])

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
