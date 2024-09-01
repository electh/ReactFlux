import { Message } from "@arco-design/web-react";
import Confetti from "canvas-confetti";

import { useSetAtom } from "jotai";
import {
  getOriginalContent,
  toggleEntryStarred,
  updateEntriesStatus,
} from "../apis";
import {
  entriesAtom,
  unreadCountAtom,
  unreadEntriesAtom,
  unreadOffsetAtom,
} from "../atoms/contentAtom";
import {
  historyCountAtom,
  starredCountAtom,
  unreadInfoAtom,
  unreadTodayCountAtom,
} from "../atoms/dataAtom";
import { checkIsInLast24Hours } from "../utils/date";
import { useActiveContent } from "./useActiveContent";

const useEntryActions = () => {
  const setUnreadInfo = useSetAtom(unreadInfoAtom);
  const setUnreadTodayCount = useSetAtom(unreadTodayCountAtom);
  const setHistoryCount = useSetAtom(historyCountAtom);
  const setStarredCount = useSetAtom(starredCountAtom);
  const { activeContent, setActiveContent } = useActiveContent();

  const setEntries = useSetAtom(entriesAtom);
  const setUnreadCount = useSetAtom(unreadCountAtom);
  const setUnreadEntries = useSetAtom(unreadEntriesAtom);
  const setUnreadOffset = useSetAtom(unreadOffsetAtom);

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

  const handleEntryStatusUpdate = (entry, newStatus) => {
    handleEntriesStatusUpdate([entry], newStatus);
  };

  const handleEntriesStatusUpdate = (entries, newStatus) => {
    const feedCountChanges = {};
    let unreadTodayCountChange = 0;

    if (newStatus === "read") {
      setUnreadCount((prev) => Math.max(0, prev - entries.length));
      setUnreadOffset((prev) => Math.max(0, prev - entries.length));
      setHistoryCount((prev) => prev + entries.length);
    } else {
      setUnreadCount((prev) => prev + entries.length);
      setUnreadOffset((prev) => prev + entries.length);
      setHistoryCount((prev) => Math.max(0, prev - entries.length));
    }

    for (const entry of entries) {
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

    setUnreadInfo((prev) => {
      const updatedInfo = { ...prev };
      for (const [feedId, change] of Object.entries(feedCountChanges)) {
        updatedInfo[feedId] = Math.max(0, (updatedInfo[feedId] || 0) + change);
      }
      return updatedInfo;
    });

    setUnreadTodayCount((prev) => Math.max(0, prev + unreadTodayCountChange));

    const updatedEntries = entries.map((entry) => ({
      ...entry,
      status: newStatus,
    }));

    const activeEntry = updatedEntries.find(
      (entry) => entry.id === activeContent?.id,
    );
    if (activeEntry) {
      setActiveContent(activeEntry);
    }

    setEntries((prev) => updateEntries(prev, updatedEntries));
    setUnreadEntries((prev) => updateEntries(prev, updatedEntries));
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
