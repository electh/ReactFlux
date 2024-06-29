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

  const updateEntries = (entries, updatedEntry) =>
    entries.map((entry) =>
      entry.id === updatedEntry.id ? updatedEntry : entry,
    );

  const handleEntryStatusUpdate = (entry, newStatus) => {
    const feedId = entry.feed.id;
    const isRecent = checkIsInLast24Hours(entry.published_at);

    if (newStatus === "read") {
      setUnreadInfo((prev) => ({
        ...prev,
        [feedId]: Math.max(0, prev[feedId] - 1),
      }));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setUnreadOffset((prev) => Math.max(0, prev - 1));
      setHistoryCount((prev) => prev + 1);
      if (isRecent) {
        setUnreadTodayCount((prev) => Math.max(0, prev - 1));
      }
    } else {
      setUnreadInfo((prev) => ({ ...prev, [feedId]: prev[feedId] + 1 }));
      setUnreadCount((prev) => prev + 1);
      setUnreadOffset((prev) => prev + 1);
      setHistoryCount((prev) => Math.max(0, prev - 1));
      if (isRecent) {
        setUnreadTodayCount((prev) => prev + 1);
      }
    }

    const updatedEntry = { ...entry, status: newStatus };
    if (activeContent?.id === updatedEntry.id) {
      setActiveContent(updatedEntry);
    }
    setEntries((prev) => updateEntries(prev, updatedEntry));
    setUnreadEntries((prev) => updateEntries(prev, updatedEntry));
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
    setEntries((prev) => updateEntries(prev, updatedEntry));
    setUnreadEntries((prev) => updateEntries(prev, updatedEntry));
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
      setActiveContent({ ...activeContent, content: response.data.content });
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
