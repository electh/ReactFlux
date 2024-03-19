export const filterEntries = (
  entries,
  filterType,
  filterStatus,
  filterString,
) => {
  // 0: title 1: content
  if (filterType === "0") {
    return filterStatus === "all"
      ? entries.filter((entry) => entry.title.includes(filterString))
      : entries.filter(
          (entry) =>
            entry.title.includes(filterString) && entry.status === filterStatus,
        );
  }
  return filterStatus === "all"
    ? entries.filter((entry) => entry.content.includes(filterString))
    : entries.filter(
        (entry) =>
          entry.content.includes(filterString) && entry.status === filterStatus,
      );
};
