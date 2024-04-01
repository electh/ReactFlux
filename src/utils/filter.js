const includesIgnoreCase = (text, searchText) => {
  return text.toLowerCase().includes(searchText.toLowerCase());
};

const filterEntries = (entries, filterType, filterStatus, filterString) => {
  // 0: title 1: content
  if (filterType === "0") {
    return filterStatus === "all"
      ? entries.filter((entry) => includesIgnoreCase(entry.title, filterString))
      : entries.filter(
          (entry) =>
            includesIgnoreCase(entry.title, filterString) &&
            entry.status === filterStatus,
        );
  }
  return filterStatus === "all"
    ? entries.filter((entry) => includesIgnoreCase(entry.content, filterString))
    : entries.filter(
        (entry) =>
          includesIgnoreCase(entry.content, filterString) &&
          entry.status === filterStatus,
      );
};

const filterEntriesByVisibility = (
  entries,
  info,
  showAllFeeds,
  hiddenFeedIds,
) => {
  const isVisible = (entry) =>
    showAllFeeds || !hiddenFeedIds.includes(entry.feed.id);
  return info.from === "all" || info.from === "today"
    ? entries.filter(isVisible)
    : entries;
};

export { includesIgnoreCase, filterEntries, filterEntriesByVisibility };
