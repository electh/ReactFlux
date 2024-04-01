const includesIgnoreCase = (str, searchValue) => {
  return str.toLowerCase().includes(searchValue.toLowerCase());
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
  return info.from === "all" || info.from === "today"
    ? entries.filter(
        (entry) => showAllFeeds || !hiddenFeedIds.includes(entry.feed.id),
      )
    : entries;
};

export { includesIgnoreCase, filterEntries, filterEntriesByVisibility };
