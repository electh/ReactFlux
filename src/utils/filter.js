export const includesIgnoreCase = (text, searchText) => {
  return text.toLowerCase().includes(searchText.toLowerCase());
};

export const filterEntries = (entries, filterType, filterString) => {
  if (!filterString) {
    return entries;
  }

  const getRelevantText = (entry) => {
    if (filterType === "0") {
      return entry.title;
    }
    if (filterType === "1") {
      return entry.content;
    }
    if (filterType === "2") {
      return entry.author;
    }
  };

  const isRelevantEntry = (entry) =>
    includesIgnoreCase(getRelevantText(entry), filterString);

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
