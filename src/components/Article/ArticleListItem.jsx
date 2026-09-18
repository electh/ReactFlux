import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo } from "react"

import FeedIcon from "@/components/ui/FeedIcon"
import { articleListItemSettingsState } from "@/store/settingsState"
import { generateReadingTime, generateRelativeTime } from "@/utils/date"

import "./ArticleListItem.css"

const MAX_LIST_SUMMARY_LENGTH = 240

const getListSummary = (summary) =>
  summary.length > MAX_LIST_SUMMARY_LENGTH
    ? `${summary.slice(0, MAX_LIST_SUMMARY_LENGTH - 1).trimEnd()}…`
    : summary

const ArticleListItem = ({ entry, previewContent }) => {
  const { showDetailedRelativeTime, showEstimatedReadingTime, showFeedIcon, showListSummary } =
    useStore(articleListItemSettingsState)
  const listSummary = getListSummary(previewContent)

  return (
    <div className="list-entry-content">
      <div className="list-entry-source">
        {showFeedIcon && <FeedIcon className="list-entry-feed-icon" feed={entry.feed} />}
        <span className="list-entry-source-title">{entry.feed.title}</span>
      </div>

      <div className="list-entry-story">
        <h3 className="article-entry-title list-entry-title">{entry.title}</h3>
        {showListSummary && listSummary && (
          <span className="list-entry-summary">
            <span aria-hidden="true" className="list-entry-summary-separator">
              —
            </span>
            {listSummary}
          </span>
        )}
      </div>

      <div className="list-entry-meta">
        {showEstimatedReadingTime && (
          <span className="list-entry-reading-time">
            <IconClockCircle aria-hidden="true" />
            <span>{generateReadingTime(entry.reading_time)}</span>
          </span>
        )}
        <IconStarFill
          aria-hidden="true"
          className="list-entry-star"
          style={{ opacity: entry.starred ? 1 : 0 }}
        />
        <time className="list-entry-time" dateTime={entry.published_at}>
          {generateRelativeTime(entry.published_at, showDetailedRelativeTime)}
        </time>
      </div>
    </div>
  )
}

export default memo(ArticleListItem)
