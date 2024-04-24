export const includesIgnoreCase = (text, searchText) => {
  return text.toLowerCase().includes(searchText.toLowerCase());
};

export const filterEntries = (
  entries,
  filterType,
  filterStatus,
  filterString,
) => {
  if (!filterString) {
    return entries;
  }

  const isRelevantEntry = (entry) => {
    const textToCheck = filterType === "0" ? entry.title : entry.content;
    return (
      includesIgnoreCase(textToCheck, filterString) &&
      (filterStatus === "all" || entry.status === filterStatus)
    );
  };

  return entries.filter(isRelevantEntry);
};

export const filterEntriesByVisibility = (
  entries,
  infoFrom,
  showAllFeeds,
  hiddenFeedIds,
) => {
  const isVisible = (entry) =>
    showAllFeeds || !hiddenFeedIds.includes(entry.feed.id);
  const isValidFilter = ["all", "today", "category"].includes(infoFrom);
  return isValidFilter ? entries.filter(isVisible) : entries;
};
