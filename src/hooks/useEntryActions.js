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

  const updateEntries = (entries, activeContent, updateFunction) => {
    return entries.map((entry) =>
      entry.id === activeContent.id ? updateFunction(entry) : entry,
    );
  };

  const updateUI = (newContentStatus, updateFunction) => {
    setActiveContent({ ...activeContent, ...newContentStatus });
    setEntries(updateEntries(entries, activeContent, updateFunction));
    setFilteredEntries(
      updateEntries(filteredEntries, activeContent, updateFunction),
    );
  };

  const handleToggleStatus = async (newStatus) => {
    const response = await updateEntryStatus(activeContent.id, newStatus);
    if (response) {
      updateFeedUnread(activeContent.feed.id, newStatus);
      updateGroupUnread(activeContent.feed.category.id, newStatus);
      if (newStatus === "read") {
        setUnreadTotal(Math.max(0, unreadTotal - 1));
        setUnreadCount(Math.max(0, unreadCount - 1));
        setReadCount(readCount + 1);
        if (isInLast24Hours(activeContent.published_at)) {
          setUnreadToday(Math.max(0, unreadToday - 1));
        }
      } else {
        setUnreadTotal(unreadTotal + 1);
        setUnreadCount(unreadCount + 1);
        setReadCount(Math.max(0, readCount - 1));
        if (isInLast24Hours(activeContent.published_at)) {
          setUnreadToday(unreadToday + 1);
        }
      }
      updateUI({ status: newStatus }, (entry) => ({
        ...entry,
        status: newStatus,
      }));
    }
  };

  const handleToggleStarred = async () => {
    const newStarred = !activeContent.starred;
    const response = await toggleEntryStarredApi(activeContent.id);
    if (response) {
      updateUI({ starred: newStarred }, (entry) => ({
        ...entry,
        starred: newStarred,
      }));
      newStarred === true &&
        Confetti({
          particleCount: 100,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 1 },
        });
      if (newStarred) {
        setStarredCount(starredCount + 1);
      } else {
        setStarredCount(Math.max(0, starredCount - 1));
      }
    }
  };

  const handleFetchContent = async () => {
    const response = await fetchOriginalArticle(activeContent.id);
    if (response) {
      setActiveContent({ ...activeContent, content: response.data.content });
    }
  };

  const toggleEntryStatus = () => {
    const newStatus = activeContent.status === "read" ? "unread" : "read";
    handleToggleStatus(newStatus);
  };

  const toggleEntryStarred = () => {
    handleToggleStarred();
  };

  return { handleFetchContent, toggleEntryStatus, toggleEntryStarred };
};

export default useEntryActions;
