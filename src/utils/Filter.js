export const filterEntries = (
  entries,
  filterType,
  filterStatus,
  filterString,
) => {
  if (filterType === "0") {
    return filterStatus === "all"
      ? entries.filter((entry) => entry.title.includes(filterString))
      : entries.filter(
          (entry) =>
            entry.title.includes(filterString) && entry.status === filterStatus,
        );
  } else {
    return filterStatus === "all"
      ? entries.filter((entry) => entry.content.includes(filterString))
      : entries.filter(
          (entry) =>
            entry.content.includes(filterString) &&
            entry.status === filterStatus,
        );
  }
};
