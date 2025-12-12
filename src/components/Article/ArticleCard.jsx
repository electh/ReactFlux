import { Divider, Dropdown, Menu } from "@arco-design/web-react/es"
import {
  IconClockCircle,
  IconLaunch,
  IconMinusCircle,
  IconRecord,
  IconSave,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useMemo, useRef, useState } from "react"

import FeedIcon from "@/components/ui/FeedIcon"
import useEntryActions from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState } from "@/store/contentState"
import { dataState } from "@/store/dataState"
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
    .replaceAll(/<[^>]*>/g, "") // Remove all HTML tags
    .replaceAll("&nbsp;", " ") // Replace space entities
    .replaceAll(/&#(\d+);/g, (_match, dec) => String.fromCodePoint(dec)) // Handle numeric HTML entities
    .replaceAll(/&([a-z]+);/g, (_match, entity) => {
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
    coverDisplayMode,
    enableContextMenu,
    markReadOnScroll,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
  } = useStore(settingsState)
  const { activeContent, infoFrom } = useStore(contentState)
  const { hasIntegrations } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const isSelected = activeContent?.id === entry.id
  const isUnread = entry.status === "unread"
  const isStarred = entry.starred

  const {
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
    handleOpenLinkExternally,
  } = useEntryActions()

  const [hasError, setHasError] = useState(false)
  const [isWideImage, setIsWideImage] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const wasVisible = useRef(false)
  const cardRef = useRef(null)

  useEffect(() => {
    // If the article is read or scroll marking is not enabled, no observation needed
    if (!isUnread || !markReadOnScroll || infoFrom === "history") {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const observerEntry of entries) {
          const { boundingClientRect, rootBounds, isIntersecting } = observerEntry

          // Record status when the article enters the viewport
          if (isIntersecting) {
            wasVisible.current = true
          } else if (wasVisible.current && boundingClientRect.top < rootBounds.top) {
            // Only mark as read when the card is completely above the viewport top and was previously visible
            handleToggleStatus(entry)
            observer.unobserve(observerEntry.target)
          }
        }
      },
      {
        // Set the root element as the scroll container
        root: document.querySelector(".entry-list"),
        // Set threshold to 0.2
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
  }, [entry, markReadOnScroll, infoFrom, isUnread, isImageLoaded, isWideImage])

  useEffect(() => {
    let isSubscribed = true

    if (entry.coverSource) {
      const img = new Image()
      img.src = entry.coverSource

      const handleLoad = () => {
        if (isSubscribed) {
          const aspectRatio = img.naturalWidth / img.naturalHeight
          const isThumbnailSize = Math.max(img.width, img.height) <= 250

          // Determine image display mode based on user settings
          switch (coverDisplayMode) {
            case "auto": {
              setIsWideImage(aspectRatio >= WIDE_IMAGE_RATIO && !isThumbnailSize)
              break
            }
            case "banner": {
              setIsWideImage(true)
              break
            }
            case "thumbnail": {
              setIsWideImage(false)
              break
            }
            // No default
          }

          setIsImageLoaded(true)
        }
      }

      img.addEventListener("load", handleLoad)

      const handleError = () => {
        if (isSubscribed) {
          setHasError(true)
        }
      }

      img.addEventListener("error", handleError)

      return () => {
        isSubscribed = false
        img.src = ""
        img.removeEventListener("load", handleLoad)
        img.removeEventListener("error", handleError)
      }
    }
  }, [entry.coverSource, coverDisplayMode])

  const getLineClamp = () => {
    const hasSideImage = entry.coverSource && !hasError && !isWideImage
    return !showEstimatedReadingTime && hasSideImage ? 4 : 3
  }

  const previewContent = useMemo(() => extractTextFromHtml(entry.content), [entry.content])

  return (
    <Dropdown
      disabled={!enableContextMenu}
      position="bl"
      trigger="contextMenu"
      droplist={
        <Menu>
          <Menu.Item key="open-in-browser" onClick={() => handleOpenLinkExternally(entry)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("article_card.open_link_externally_tooltip")}</span>
              <IconLaunch />
            </div>
          </Menu.Item>

          <Divider style={{ margin: "4px 0" }} />

          <Menu.Item key="toggle-status" onClick={() => handleToggleStatus(entry)}>
            <div className="settings-menu-item">
              <span>
                {isUnread
                  ? polyglot.t("article_card.mark_as_read_tooltip")
                  : polyglot.t("article_card.mark_as_unread_tooltip")}
              </span>
              {isUnread ? <IconMinusCircle /> : <IconRecord />}
            </div>
          </Menu.Item>

          <Menu.Item key="toggle-starred" onClick={() => handleToggleStarred(entry)}>
            <div className="settings-menu-item">
              <span>
                {isStarred
                  ? polyglot.t("article_card.unstar_tooltip")
                  : polyglot.t("article_card.star_tooltip")}
              </span>
              {isStarred ? <IconStarFill style={{ color: "#ffcd00" }} /> : <IconStar />}
            </div>
          </Menu.Item>

          {hasIntegrations && (
            <Menu.Item
              key="save-to-third-party-services"
              onClick={() => handleSaveToThirdPartyServices(entry)}
            >
              <div className="settings-menu-item">
                <span>{polyglot.t("article_card.save_to_third_party_services_tooltip")}</span>
                <IconSave />
              </div>
            </Menu.Item>
          )}
        </Menu>
      }
    >
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
                  <IconStarFill
                    className="icon-starred"
                    style={{ opacity: entry.starred ? 1 : 0 }}
                  />
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
                <ArticleCardImage
                  entry={entry}
                  isWideImage={isWideImage}
                  setHasError={setHasError}
                />
              </div>
            )}
          </div>
        </div>
        {children}
      </div>
    </Dropdown>
  )
}

export default ArticleCard
