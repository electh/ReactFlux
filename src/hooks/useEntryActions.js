import { Message } from "@arco-design/web-react";
import Confetti from "canvas-confetti";

import { useAtom, useSetAtom } from "jotai";
import {
  getOriginalContent,
  toggleEntryStarred,
  updateEntriesStatus,
} from "../apis";
import {
  activeContentAtom,
  contentState,
  entriesAtom,
  unreadEntriesAtom,
} from "../atoms/contentAtom";
import { dataState, starredCountAtom } from "../atoms/dataAtom";
import { checkIsInLast24Hours } from "../utils/date";

const updateEntries = (entries, updatedEntries) => {
  const updatedEntryIds = updatedEntries.map((entry) => entry.id);
  return entries.map((entry) => {
    if (updatedEntryIds.includes(entry.id)) {
      const updatedEntry = updatedEntries.find((e) => e.id === entry.id);
      return updatedEntry || entry;
    }
    return entry;
  });
};

export const handleEntriesStatusUpdate = (entryList, newStatus) => {
  const feedCountChanges = {};
  let unreadTodayCountChange = 0;
  const { activeContent, entries, unreadEntries, unreadCount, unreadOffset } =
    contentState;
  const { historyCount, unreadInfo, unreadTodayCount } = dataState;

  if (newStatus === "read") {
    contentState.unreadCount = Math.max(0, unreadCount - entryList.length);
    contentState.unreadOffset = Math.max(0, unreadOffset - entryList.length);
    dataState.historyCount += entryList.length;
  } else {
    contentState.unreadCount += entryList.length;
    contentState.unreadEntries += entryList.length;
    dataState.historyCount = Math.max(0, historyCount - entryList.length);
  }

  for (const entry of entryList) {
    const feedId = entry.feed.id;
    const isRecent = checkIsInLast24Hours(entry.published_at);

    if (newStatus === "read") {
      feedCountChanges[feedId] = (feedCountChanges[feedId] || 0) - 1;
      if (isRecent) {
        unreadTodayCountChange -= 1;
      }
    } else {
      feedCountChanges[feedId] = (feedCountChanges[feedId] || 0) + 1;
      if (isRecent) {
        unreadTodayCountChange += 1;
      }
    }
  }
  dataState.unreadTodayCount = Math.max(
    0,
    unreadTodayCount + unreadTodayCountChange,
  );

  const updatedInfo = unreadInfo;
  for (const [feedId, change] of Object.entries(feedCountChanges)) {
    updatedInfo[feedId] = Math.max(0, (updatedInfo[feedId] || 0) + change);
  }
  dataState.unreadInfo = updatedInfo;

  const updatedEntries = entryList.map((entry) => ({
    ...entry,
    status: newStatus,
  }));

  const activeEntry = updatedEntries.find(
    (entry) => entry.id === activeContent?.id,
  );
  if (activeEntry) {
    contentState.activeContent = activeEntry;
  }

  contentState.entries = updateEntries(entries, updatedEntries);
  contentState.unreadEntries = updateEntries(unreadEntries, updatedEntries);
};

const useEntryActions = () => {
  const [activeContent, setActiveContent] = useAtom(activeContentAtom);
  const setStarredCount = useSetAtom(starredCountAtom);
  const setEntries = useSetAtom(entriesAtom);
  const setUnreadEntries = useSetAtom(unreadEntriesAtom);

  const handleEntryStatusUpdate = (entry, newStatus) => {
    handleEntriesStatusUpdate([entry], newStatus);
  };

  const handleEntryStarredUpdate = (entry, newStarred) => {
    if (newStarred) {
      setStarredCount((prev) => prev + 1);
      Confetti({
        particleCount: 100,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 1 },
      });
    } else {
      setStarredCount((prev) => Math.max(0, prev - 1));
    }

    const updatedEntry = { ...entry, starred: newStarred };
    if (activeContent) {
      setActiveContent(updatedEntry);
    }
    setEntries((prev) => updateEntries(prev, [updatedEntry]));
    setUnreadEntries((prev) => updateEntries(prev, [updatedEntry]));
  };

  const handleToggleStatus = async (entry) => {
    const prevStatus = entry.status;
    const newStatus = prevStatus === "read" ? "unread" : "read";
    handleEntryStatusUpdate(entry, newStatus);

    updateEntriesStatus([entry.id], newStatus).catch(() => {
      Message.error(
        `Failed to mark entry as ${newStatus}, please try again later`,
      );
      handleEntryStatusUpdate(entry, prevStatus);
    });
  };

  const handleToggleStarred = async (entry) => {
    const newStarred = !entry.starred;
    handleEntryStarredUpdate(entry, newStarred);

    toggleEntryStarred(entry.id).catch(() => {
      Message.error(
        `Failed to ${
          newStarred ? "star" : "unstar"
        } entry, please try again later`,
      );
      handleEntryStarredUpdate(entry, !newStarred);
    });
  };

  const handleFetchContent = async () => {
    try {
      const response = await getOriginalContent(activeContent.id);
      Message.success("Fetched content successfully");
      setActiveContent({ ...activeContent, content: response.content });
    } catch (error) {
      Message.error("Failed to fetch content, please try again later");
    }
  };

  return {
    handleEntryStatusUpdate,
    handleFetchContent,
    handleToggleStarred,
    handleToggleStatus,
  };
};

export default useEntryActions;
