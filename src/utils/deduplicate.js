import { Message } from "@arco-design/web-react";
import { updateEntriesStatus } from "../apis";
import { handleEntriesStatusUpdate } from "../hooks/useEntryActions";

export const removeDuplicateEntries = (entries, option) => {
  if (entries.length === 0 || option === "none") {
    return entries;
  }

  const originalOrder = entries.map((entry, index) => ({
    id: entry.id,
    index,
  }));

  const seenHashes = new Map();
  const seenTitles = new Map();
  const seenURLs = new Map();
  const duplicateEntries = [];

  const uniqueEntries = entries
    .slice()
    .sort((a, b) => a.id - b.id)
    .filter((entry) => {
      const { hash, title, url, id } = entry;

      switch (option) {
        case "hash":
          if (seenHashes.has(hash)) {
            duplicateEntries.push(entry);
            return false;
          }
          seenHashes.set(hash, id);
          break;
        case "title":
          if (seenTitles.has(title)) {
            duplicateEntries.push(entry);
            return false;
          }
          seenTitles.set(title, id);
          break;
        case "url":
          if (seenURLs.has(url)) {
            duplicateEntries.push(entry);
            return false;
          }
          seenURLs.set(url, id);
          break;
        default:
          return true;
      }
      return true;
    });

  const unreadDuplicateIds = duplicateEntries
    .filter((entry) => entry.status === "unread")
    .map((entry) => entry.id);
  if (unreadDuplicateIds.length > 0) {
    handleEntriesStatusUpdate(duplicateEntries, "read");
    updateEntriesStatus(unreadDuplicateIds, "read").catch(() => {
      Message.error("Failed to mark duplicate entries as read");
      handleEntriesStatusUpdate(duplicateEntries, "unread");
    });
  }

  return uniqueEntries.sort((a, b) => {
    const indexA = originalOrder.find((order) => order.id === a.id).index;
    const indexB = originalOrder.find((order) => order.id === b.id).index;
    return indexA - indexB;
  });
};
