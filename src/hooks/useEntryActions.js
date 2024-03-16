import Confetti from "canvas-confetti";
import { useContext } from "react";

import { useStore } from "../Store";
import { updateEntryStarred, updateEntryStatus } from "../apis";
import { ContentContext } from "../components/ContentContext";
import { isInLast24Hours } from "../utils/Date";

const useEntryActions = () => {
  const unreadToday = useStore((state) => state.unreadToday);
  const setUnreadToday = useStore((state) => state.setUnreadToday);
  const readCount = useStore((state) => state.readCount);
  const setReadCount = useStore((state) => state.setReadCount);
  const starredCount = useStore((state) => state.starredCount);
  const setStarredCount = useStore((state) => state.setStarredCount);

  const {
    activeContent,
    allEntries,
    entries,
    setActiveContent,
    setAllEntries,
    setEntries,
    setUnreadTotal,
    unreadTotal,
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
    setAllEntries(updateEntries(allEntries, activeContent, updateFunction));
  };

  const handleToggleStatus = async (newStatus) => {
    const response = await updateEntryStatus(activeContent);
    if (response) {
      updateFeedUnread(activeContent.feed.id, newStatus);
      updateGroupUnread(activeContent.feed.category.id, newStatus);
      setUnreadTotal(
        newStatus === "read" ? Math.max(0, unreadTotal - 1) : unreadTotal + 1,
      );
      setReadCount(
        newStatus === "read" ? readCount + 1 : Math.max(0, readCount - 1),
      );
      if (isInLast24Hours(activeContent.published_at)) {
        setUnreadToday(
          newStatus === "read" ? Math.max(0, unreadToday - 1) : unreadToday + 1,
        );
      }
      updateUI({ status: newStatus }, (entry) => ({
        ...entry,
        status: newStatus,
      }));
    }
  };

  const handleToggleStarred = async () => {
    const newStarred = !activeContent.starred;
    const response = await updateEntryStarred(activeContent);
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
      setStarredCount(
        newStarred ? starredCount + 1 : Math.max(0, starredCount - 1),
      );
    }
  };

  const toggleEntryStatus = () => {
    const newStatus = activeContent.status === "read" ? "unread" : "read";
    handleToggleStatus(newStatus);
  };

  const toggleEntryStarred = () => {
    handleToggleStarred();
  };

  return { toggleEntryStatus, toggleEntryStarred };
};

export default useEntryActions;
