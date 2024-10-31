import { filterByQuery } from "./kmp";

export const includesIgnoreCase = (text, searchText) => {
  return text.toLowerCase().includes(searchText.toLowerCase());
};

export const filterEntries = (entries, filterType, filterString) => {
  if (!filterString || entries.length === 0) {
    return entries;
  }
  return filterByQuery(entries, filterString, [filterType]);
};
