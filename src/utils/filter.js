import dayjs from "dayjs";

import { filterByQuery } from "./kmp";

export const includesIgnoreCase = (text, searchText) => {
  return text.toLowerCase().includes(searchText.toLowerCase());
};

export const filterByDate = (entries, filterDate) => {
  return entries.filter((entry) => {
    const entryDate = dayjs(entry.published_at);
    return entryDate.isSame(filterDate, "day");
  });
};

export const filterEntries = (
  entries,
  filterDate,
  filterType,
  filterString,
) => {
  if (!filterDate && !filterString) {
    return entries;
  }

  const filteredEntries = filterByDate(entries, filterDate);

  if (filterString) {
    return filterByQuery(filteredEntries, filterString, [filterType]);
  }

  return filteredEntries;
};
