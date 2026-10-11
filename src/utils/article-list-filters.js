export const hasArticleListFilters = ({ filterDate, filterString, infoFrom }) =>
  Boolean(filterString || (infoFrom !== "today" && filterDate))
