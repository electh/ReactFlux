import { Message } from "@arco-design/web-react";
import { updateEntriesStatus } from "../apis";
import { filterByQuery } from "./kmp";

export const includesIgnoreCase = (text, searchText) => {
  return text.toLowerCase().includes(searchText.toLowerCase());
};

export const filterEntries = (entries, filterType, filterString) => {
  if (!filterString) {
    return entries;
  }

  return filterByQuery(entries, filterString, [filterType]);
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

export const removeDuplicateEntries = (entries, option) => {
  if (entries.length === 0 || option === "none") {
    return entries;
  }

  const seenTitles = new Set();
  const seenURLs = new Set();
  const duplicates = [];

  const unreadEntryIds = entries
    .filter((entry) => entry.status === "unread")
    .map((entry) => entry.id);

  const uniqueEntries = entries.filter((entry) => {
    const { title, url, id } = entry;
    if (option === "title" && seenTitles.has(title)) {
      duplicates.push(id);
      return false;
    }

    if (option === "url" && seenURLs.has(url)) {
      duplicates.push(id);
      return false;
    }

    seenTitles.add(title);
    seenURLs.add(url);
    return true;
  });

  const unreadDuplicates = duplicates.filter((id) =>
    unreadEntryIds.includes(id),
  );
  if (unreadDuplicates.length > 0) {
    updateEntriesStatus(unreadDuplicates, "read").catch(() => {
      Message.error("Failed to mark duplicate entries as read");
    });
  }

  return uniqueEntries;
};
