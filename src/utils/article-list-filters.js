export const hasArticleListFilters = ({ filterDate, filterString, infoFrom }) =>
  Boolean(filterString || (infoFrom !== "today" && filterDate))

export const shouldRefreshArticleListTotal = (content, { showStatus }) => {
  if (["starred", "history"].includes(content.infoFrom) || showStatus === "unread") {
    return hasArticleListFilters(content)
  }

  // Status/star changes cannot affect an all-status published-date or full-text query.
  return ["feed", "category"].includes(content.infoFrom) && showStatus === "starred"
}
