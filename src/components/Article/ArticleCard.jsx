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
import { memo, useLayoutEffect, useMemo, useRef, useState } from "react"

import FeedIcon from "@/components/ui/FeedIcon"
import useEntryActions from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import useLongPressContextMenu from "@/hooks/useLongPressContextMenu"
import { contentState, createEntrySelectedState } from "@/store/contentState"
import { hasIntegrationsState } from "@/store/dataState"
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

const ArticleCard = ({ entry, handleEntryClick, observeRead }) => {
  const {
    coverDisplayMode,
    enableContextMenu,
    markReadOnScroll,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    summaryLines,
  } = useStore(articleCardSettingsState)
  const { infoFrom } = useStore(contentState, { keys: ["infoFrom"] })
  const hasIntegrations = useStore(hasIntegrationsState)
  const { polyglot } = useStore(polyglotState)
  const selectedState = useMemo(() => createEntrySelectedState(entry.id), [entry.id])
  const isSelected = useStore(selectedState)
  const isUnread = entry.status === "unread"
  const isStarred = entry.starred

  const {
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
    handleOpenLinkExternally,
  } = useEntryActions()

  const [coverState, setCoverState] = useState(() => getInitialCoverState(entry, coverDisplayMode))
  const { dropdownProps, longPressProps } = useLongPressContextMenu({
    disabled: !enableContextMenu,
  })

  const cardRef = useRef(null)
  const shouldShowCover = coverDisplayMode !== "none" && Boolean(entry.coverSource)
  const isCurrentCover =
    coverState.coverDisplayMode === coverDisplayMode && coverState.coverSource === entry.coverSource
  const currentCoverState = isCurrentCover
    ? coverState
    : getInitialCoverState(entry, coverDisplayMode)
  const { aspectRatio, hasError, isWideImage } = currentCoverState
  const shouldRenderCover = shouldShowCover && !hasError

  useLayoutEffect(() => {
    if (!isUnread || !markReadOnScroll || infoFrom === "history") {
      return
    }

    return observeRead(cardRef.current, entry)
  }, [entry, infoFrom, isUnread, markReadOnScroll, observeRead])

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

  const previewContent = useMemo(() => extractTextFromHtml(entry.content), [entry.content])

  return (
    <Dropdown
      {...dropdownProps}
      disabled={!enableContextMenu}
      position="bl"
      trigger="contextMenu"
      droplist={
        <Menu className="mobile-action-menu">
          <Menu.Item key="open-in-browser" onClick={() => handleOpenLinkExternally(entry)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("article_card.open_link_externally_tooltip")}</span>
              <IconLaunch aria-hidden="true" />
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
              {isUnread ? (
                <IconMinusCircle aria-hidden="true" />
              ) : (
                <IconRecord aria-hidden="true" />
              )}
            </div>
          </Menu.Item>

          <Menu.Item key="toggle-starred" onClick={() => handleToggleStarred(entry)}>
            <div className="settings-menu-item">
              <span>
                {isStarred
                  ? polyglot.t("article_card.unstar_tooltip")
                  : polyglot.t("article_card.star_tooltip")}
              </span>
              {isStarred ? (
                <IconStarFill aria-hidden="true" style={{ color: "#ffcd00" }} />
              ) : (
                <IconStar aria-hidden="true" />
              )}
            </div>
          </Menu.Item>

          {hasIntegrations && (
            <Menu.Item
              key="save-to-third-party-services"
              onClick={() => handleSaveToThirdPartyServices(entry)}
            >
              <div className="settings-menu-item">
                <span>{polyglot.t("article_card.save_to_third_party_services_tooltip")}</span>
                <IconSave aria-hidden="true" />
              </div>
            </Menu.Item>
          )}
        </Menu>
      }
    >
      <div
        ref={cardRef}
        {...longPressProps}
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
        <div className={`card-content ${isUnread ? "unread" : "read"}`}>
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
                  <IconClockCircle />
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
      </div>
    </Dropdown>
  )
}

export default memo(ArticleCard)
