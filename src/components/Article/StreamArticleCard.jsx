import { Button, Tag, Typography } from "@arco-design/web-react"
import {
  IconCloudDownload,
  IconLaunch,
  IconMinusCircle,
  IconRecord,
  IconSave,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"

import ArticleBodyRenderer from "./ArticleBodyRenderer"

import { updateEntriesStatus } from "@/apis"
import AiSpark from "@/components/icons/AiSpark"
import CustomTooltip from "@/components/ui/CustomTooltip"
import FeedIcon from "@/components/ui/FeedIcon"
import useEntryActions from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { dataState } from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import {
  freezeMediaLoading,
  observeIframeLoadState,
  unfreezeMediaLoading,
} from "@/utils/content-freeze"
import { generateReadableDate, generateReadingTime, generateRelativeTime } from "@/utils/date"
import { Message } from "@/utils/feedback"
import { getEntryImageSources, preloadImageMetadata } from "@/utils/images"

import "./StreamArticleCard.css"

const isInteractiveTarget = (target) =>
  target.closest("a, button, input, textarea, select, [role='button']")

const withStopPropagation = (callback) => (event) => {
  event.stopPropagation()
  callback()
}

const hasExpandedSelection = () => {
  if (globalThis.window === undefined) {
    return false
  }

  const selection = globalThis.window.getSelection()
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim())
}

const StreamArticleCard = ({
  activeEntry,
  entry,
  handleEntryClick,
  infoFrom,
  isSelected,
  shouldPreload,
}) => {
  const navigate = useNavigate()
  const { hasIntegrations } = useStore(dataState)
  const {
    aiProvider,
    articleWidth,
    markReadOnScroll,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    streamRenderSelectedOnly,
    titleAlignment,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

  const {
    handleEntryStatusUpdate,
    handleFetchContent,
    handleOpenLinkExternally,
    handleSaveToThirdPartyServices,
    handleSummarizeContent,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions()

  const currentEntry = activeEntry ?? entry
  const isUnread = currentEntry.status === "unread"
  const isStarred = currentEntry.starred
  const hasAiSummary = currentEntry.content?.includes("ai-summary")

  const [fetchingEntryId, setFetchingEntryId] = useState(null)
  const [summarizingEntryId, setSummarizingEntryId] = useState(null)
  const isFetchingOriginal = fetchingEntryId === currentEntry.id
  const isSummarizing = summarizingEntryId === currentEntry.id
  const contentMaxWidth = isBelowMedium ? "100%" : `${articleWidth}%`
  const previewText = useMemo(() => currentEntry.previewText || "", [currentEntry.previewText])
  const titleClassName = isUnread
    ? "stream-story-title"
    : "stream-story-title stream-story-title-read"
  const cardRef = useRef(null)
  const wasEverSelectedRef = useRef(false)
  const wasVisible = useRef(false)

  useEffect(() => {
    wasVisible.current = false

    if (
      !markReadOnScroll ||
      infoFrom === "history" ||
      currentEntry.status !== "unread" ||
      typeof IntersectionObserver !== "function"
    ) {
      return
    }

    const element = cardRef.current
    const rootElement = element?.closest(".simplebar-content-wrapper")

    if (!element || !rootElement) {
      return
    }

    let isCancelled = false

    const markEntryAsRead = () => {
      handleEntryStatusUpdate(currentEntry, "read")
      updateEntriesStatus([currentEntry.id], "read").catch(() => {
        Message.error(polyglot.t("content.mark_as_read_error"))

        if (!isCancelled) {
          handleEntryStatusUpdate(currentEntry, "unread")
        }
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const observerEntry of entries) {
          const { boundingClientRect, rootBounds, isIntersecting } = observerEntry

          if (isIntersecting) {
            wasVisible.current = true
            continue
          }

          if (
            wasVisible.current &&
            rootBounds &&
            boundingClientRect.top < rootBounds.top &&
            currentEntry.status === "unread"
          ) {
            wasVisible.current = false
            observer.unobserve(observerEntry.target)
            markEntryAsRead()
          }
        }
      },
      {
        root: rootElement,
        threshold: 0.2,
      },
    )

    observer.observe(element)

    return () => {
      isCancelled = true
      wasVisible.current = false
      observer.disconnect()
    }
  }, [currentEntry, handleEntryStatusUpdate, infoFrom, isSelected, markReadOnScroll, polyglot])

  useEffect(() => {
    if (!shouldPreload || isSelected) {
      return
    }

    for (const imageSource of getEntryImageSources(entry)) {
      void preloadImageMetadata(imageSource)
    }
  }, [entry, isSelected, shouldPreload])

  // Freeze/unfreeze media loading when navigating away from / back to this card.
  // When the user presses J/K to move past a card, this cancels incomplete image
  // downloads and iframe loading. Prevents wasted bandwidth and layout shifts from
  // images loading in cards the user has already scrolled past.
  // Only applies to cards that were previously selected — cards that were never
  // active are left alone so their content can load normally.
  useEffect(() => {
    if (isSelected) {
      wasEverSelectedRef.current = true
    }
  }, [isSelected])

  useEffect(() => {
    const body = cardRef.current?.querySelector(".article-content")
    return observeIframeLoadState(body)
  }, [currentEntry.id, isSelected, streamRenderSelectedOnly])

  useLayoutEffect(() => {
    if (isSelected || !wasEverSelectedRef.current) {
      return
    }

    // Scope to .article-content to avoid freezing the feed icon in the header
    const body = cardRef.current?.querySelector(".article-content")
    if (!body) {
      return
    }

    freezeMediaLoading(body)
    return () => unfreezeMediaLoading(body)
  }, [isSelected])

  const selectEntry = () => {
    if (!isSelected) {
      handleEntryClick(entry)
    }
  }

  const handleCardClick = (event) => {
    if (isSelected) {
      return
    }

    if (isInteractiveTarget(event.target)) {
      return
    }

    if (hasExpandedSelection()) {
      return
    }

    selectEntry()
  }

  return (
    <article
      ref={cardRef}
      data-entry-id={entry.id}
      tabIndex={isSelected ? -1 : 0}
      className={
        isSelected ? "card-wrapper stream-story-card selected" : "card-wrapper stream-story-card"
      }
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (isSelected) {
          return
        }

        if ((event.key === "Enter" || event.key === " ") && !isInteractiveTarget(event.target)) {
          event.preventDefault()
          selectEntry()
        }
      }}
    >
      <div className="stream-story-topline">
        <Typography.Title
          className={titleClassName}
          heading={4}
          style={{ maxWidth: contentMaxWidth }}
        >
          <button
            className="stream-story-title-link"
            type="button"
            onClick={(event) => {
              event.stopPropagation()

              if (hasExpandedSelection()) {
                return
              }

              handleOpenLinkExternally(currentEntry)
            }}
          >
            {showFeedIcon && <FeedIcon className="feed-icon-topline" feed={currentEntry.feed} />}
            <span className="stream-story-title-text">{currentEntry.title}</span>
          </button>
        </Typography.Title>
        <div className="stream-story-actions">
          <CustomTooltip
            mini
            content={
              isUnread
                ? polyglot.t("article_card.mark_as_read_tooltip")
                : polyglot.t("article_card.mark_as_unread_tooltip")
            }
          >
            <Button
              icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
              shape="circle"
              size="small"
              onClick={withStopPropagation(() => handleToggleStatus(currentEntry))}
            />
          </CustomTooltip>
          <CustomTooltip
            mini
            content={
              isStarred
                ? polyglot.t("article_card.unstar_tooltip")
                : polyglot.t("article_card.star_tooltip")
            }
          >
            <Button
              icon={isStarred ? <IconStarFill style={{ color: "#ffcd00" }} /> : <IconStar />}
              shape="circle"
              size="small"
              onClick={withStopPropagation(() => handleToggleStarred(currentEntry))}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("article_card.fetch_original_tooltip")}>
            <Button
              icon={<IconCloudDownload />}
              loading={isFetchingOriginal}
              shape="circle"
              size="small"
              onClick={withStopPropagation(async () => {
                setFetchingEntryId(currentEntry.id)
                await handleFetchContent(currentEntry)
                setFetchingEntryId(null)
              })}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("article_card.summarize_tooltip")}>
            <Button
              disabled={aiProvider === "none" || hasAiSummary}
              icon={<AiSpark />}
              loading={isSummarizing}
              shape="circle"
              size="small"
              onClick={withStopPropagation(async () => {
                setSummarizingEntryId(currentEntry.id)
                await handleSummarizeContent(currentEntry)
                setSummarizingEntryId(null)
              })}
            />
          </CustomTooltip>
          {hasIntegrations ? (
            <CustomTooltip
              mini
              content={polyglot.t("article_card.save_to_third_party_services_tooltip")}
            >
              <Button
                icon={<IconSave />}
                shape="circle"
                size="small"
                onClick={withStopPropagation(() => handleSaveToThirdPartyServices(currentEntry))}
              />
            </CustomTooltip>
          ) : null}
          <CustomTooltip mini content={polyglot.t("article_card.open_link_externally_tooltip")}>
            <Button
              icon={<IconLaunch />}
              shape="circle"
              size="small"
              onClick={withStopPropagation(() => handleOpenLinkExternally(currentEntry))}
            />
          </CustomTooltip>
        </div>
      </div>
      <div className="stream-story-expanded">
        <div
          className="stream-story-meta"
          style={{ maxWidth: contentMaxWidth, textAlign: titleAlignment }}
        >
          <div className="stream-story-source">
            <span className="stream-story-source-title">{currentEntry.feed.title}</span>
            {currentEntry.author ? (
              <span className="stream-story-author">{currentEntry.author}</span>
            ) : null}
          </div>
          {currentEntry.feed.category?.title ? (
            <span className="stream-story-meta-item">
              <Tag
                className="stream-story-category"
                size="small"
                onClick={(event) => {
                  event.stopPropagation()
                  navigate(`/category/${currentEntry.feed.category.id}`)
                }}
              >
                {currentEntry.feed.category.title}
              </Tag>
            </span>
          ) : null}
          <span className="stream-story-meta-item">
            {generateReadableDate(currentEntry.published_at)}
          </span>
          <span className="stream-story-meta-item">
            {generateRelativeTime(currentEntry.published_at, showDetailedRelativeTime)}
          </span>
          {showEstimatedReadingTime ? (
            <span className="stream-story-meta-item">
              {generateReadingTime(currentEntry.reading_time)}
            </span>
          ) : null}
        </div>
        {isSelected || !streamRenderSelectedOnly ? (
          <ArticleBodyRenderer entry={currentEntry} maxWidth={contentMaxWidth} />
        ) : (
          <p className="stream-story-preview" style={{ maxWidth: contentMaxWidth }}>
            {previewText}
          </p>
        )}
      </div>
    </article>
  )
}

export default memo(StreamArticleCard)
