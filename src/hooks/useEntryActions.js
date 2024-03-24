import Confetti from "canvas-confetti";
import { useContext } from "react";

import useStore from "../Store";
import {
  fetchOriginalArticle,
  toggleEntryStarred as toggleEntryStarredApi,
  updateEntryStatus,
} from "../apis";
import ContentContext from "../components/Content/ContentContext";
import { isInLast24Hours } from "../utils/Date";

const useEntryActions = () => {
  const unreadTotal = useStore((state) => state.unreadTotal);
  const setUnreadTotal = useStore((state) => state.setUnreadTotal);
  const unreadToday = useStore((state) => state.unreadToday);
  const setUnreadToday = useStore((state) => state.setUnreadToday);
  const readCount = useStore((state) => state.readCount);
  const setReadCount = useStore((state) => state.setReadCount);
  const starredCount = useStore((state) => state.starredCount);
  const setStarredCount = useStore((state) => state.setStarredCount);
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);

  const {
    entries,
    filteredEntries,
    setEntries,
    setFilteredEntries,
    setUnreadCount,
    unreadCount,
    updateFeedUnread,
    updateGroupUnread,
  } = useContext(ContentContext);

  const updateEntries = (entries, entry, updateFunction) => {
    return entries.map((e) => (e.id === entry.id ? updateFunction(e) : e));
  };

  const updateUI = (entry, newContentStatus, updateFunction) => {
    setActiveContent({ ...entry, ...newContentStatus });
    setEntries(updateEntries(entries, entry, updateFunction));
    setFilteredEntries(updateEntries(filteredEntries, entry, updateFunction));
  };

  const handleEntryStatusUpdate = (entry, newStatus) => {
    const { feed } = entry;
    const feedId = feed.id;
    const groupId = feed.category.id;

    updateFeedUnread(feedId, newStatus);
    updateGroupUnread(groupId, newStatus);

    if (newStatus === "read") {
      setUnreadTotal(Math.max(0, unreadTotal - 1));
      setUnreadCount(Math.max(0, unreadCount - 1));
      setReadCount(readCount + 1);
      if (isInLast24Hours(entry.published_at)) {
        setUnreadToday(Math.max(0, unreadToday - 1));
      }
    } else {
      setUnreadTotal(unreadTotal + 1);
      setUnreadCount(unreadCount + 1);
      setReadCount(Math.max(0, readCount - 1));
      if (isInLast24Hours(entry.published_at)) {
        setUnreadToday(unreadToday + 1);
      }
    }

    updateUI(entry, { status: newStatus }, (entry) => ({
      ...entry,
      status: newStatus,
    }));
  };

  const handleEntryStarredUpdate = (entry, newStarred) => {
    if (newStarred) {
      setStarredCount(starredCount + 1);
      Confetti({
        particleCount: 100,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 1 },
      });
    } else {
      setStarredCount(Math.max(0, starredCount - 1));
    }

    updateUI(entry, { starred: newStarred }, (entry) => ({
      ...entry,
      starred: newStarred,
    }));
  };

  const handleToggleStatus = async () => {
    const prevStatus = activeContent.status;
    const newStatus = activeContent.status === "read" ? "unread" : "read";
    handleEntryStatusUpdate(activeContent, newStatus);

    const response = await updateEntryStatus(activeContent.id, newStatus);
    if (!response) {
      handleEntryStatusUpdate(activeContent, prevStatus);
    }
  };

  const handleToggleStarred = async () => {
    const { id } = activeContent;
    const newStarred = !activeContent.starred;
    handleEntryStarredUpdate(activeContent, newStarred);

    const response = await toggleEntryStarredApi(id);
    if (!response) {
      handleEntryStarredUpdate(activeContent, !newStarred);
    }
  };

  const handleFetchContent = async () => {
    const response = await fetchOriginalArticle(activeContent.id);
    if (response) {
      setActiveContent({ ...activeContent, content: response.data.content });
    }
  };

  const toggleEntryStatus = () => {
    handleToggleStatus();
  };

  const toggleEntryStarred = () => {
    handleToggleStarred();
  };

  return {
    handleEntryStatusUpdate,
    handleFetchContent,
    toggleEntryStarred,
    toggleEntryStatus,
  };
};

export default useEntryActions;
