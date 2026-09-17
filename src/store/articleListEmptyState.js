import { computed } from "nanostores"

import { contentState } from "./contentState"
import { dataState } from "./dataState"
import { settingsState } from "./settingsState"

const getEffectiveStatus = (source, selectedStatus) => {
  if (source === "history") {
    return "all"
  }

  if (["all", "today", "starred"].includes(source)) {
    return selectedStatus === "unread" ? "unread" : "all"
  }

  if (["feed", "category"].includes(source) && ["unread", "starred"].includes(selectedStatus)) {
    return selectedStatus
  }

  return "all"
}

export const resolveArticleListEmptyState = ({
  articleListError,
  catalogLoadState,
  entryCount,
  feedCount,
  filterDate,
  filterString,
  infoFrom: source,
  isArticleListReady,
  showStatus: selectedStatus,
}) => {
  if (!isArticleListReady || articleListError || entryCount > 0) {
    return null
  }

  const hasCatalogSnapshot = Boolean(catalogLoadState?.hasSnapshot)
  if (!hasCatalogSnapshot && !catalogLoadState?.error) {
    return { phase: "waiting-for-catalog" }
  }

  const effectiveStatus = getEffectiveStatus(source, selectedStatus)
  const effectiveDate = source === "today" ? null : filterDate
  const filters = {
    date: effectiveDate,
    query: filterString,
    status: effectiveStatus,
  }

  let reason = "no-articles"
  if (hasCatalogSnapshot && feedCount === 0) {
    reason = "no-feeds"
  } else if (filterString) {
    reason = "no-search-results"
  } else if (effectiveDate) {
    reason = "no-filter-results"
  } else if (effectiveStatus === "unread") {
    reason = "no-unread-articles"
  } else if (effectiveStatus === "starred" || source === "starred") {
    reason = "no-starred-articles"
  }

  return { phase: "empty", reason, filters }
}

export const articleListEmptyState = computed(
  [contentState, dataState, settingsState],
  (content, data, settings) =>
    resolveArticleListEmptyState({
      articleListError: content.articleListError,
      catalogLoadState: data.loadState.catalog,
      entryCount: content.entries.length,
      feedCount: data.feedsData.length,
      filterDate: content.filterDate,
      filterString: content.filterString,
      infoFrom: content.infoFrom,
      isArticleListReady: content.isArticleListReady,
      showStatus: settings.showStatus,
    }),
)
