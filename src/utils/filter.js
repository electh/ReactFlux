import { Message } from "@arco-design/web-react";
import { updateEntriesStatus } from "../apis";
import { handleEntriesStatusUpdate } from "../hooks/useEntryActions";
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

  const originalOrder = entries.map((entry, index) => ({
    id: entry.id,
    index,
  }));

  const seenTitles = new Set();
  const seenURLs = new Set();
  const duplicateEntries = [];

  const unreadEntryIds = entries
    .filter((entry) => entry.status === "unread")
    .map((entry) => entry.id);

  const uniqueEntries = entries
    .slice()
    .sort((a, b) => a.id - b.id)
    .filter((entry) => {
      const { title, url } = entry;
      if (
        (option === "title" && seenTitles.has(title)) ||
        (option === "url" && seenURLs.has(url))
      ) {
        duplicateEntries.push(entry);
        return false;
      }

      seenTitles.add(title);
      seenURLs.add(url);
      return true;
    });

  const unreadDuplicates = duplicateEntries.filter((entry) =>
    unreadEntryIds.includes(entry.id),
  );
  const unreadDuplicateIds = unreadDuplicates.map((entry) => entry.id);
  if (unreadDuplicates.length > 0) {
    handleEntriesStatusUpdate(unreadDuplicates, "read");
    updateEntriesStatus(unreadDuplicateIds, "read").catch(() => {
      Message.error("Failed to mark duplicate entries as read");
      handleEntriesStatusUpdate(unreadDuplicates, "unread");
    });
  }

  return uniqueEntries.sort((a, b) => {
    const indexA = originalOrder.find((order) => order.id === a.id).index;
    const indexB = originalOrder.find((order) => order.id === b.id).index;
    return indexA - indexB;
  });
};
