import Confetti from "canvas-confetti";
import { useContext } from "react";

import { useStore } from "../Store";
import { updateEntryStarred, updateEntryStatus } from "../apis";
import { ContentContext } from "../components/ContentContext";
import { isIn24Hours } from "../utils/Date";

const useEntryActions = () => {
  const unreadToday = useStore((state) => state.unreadToday);
  const setUnreadToday = useStore((state) => state.setUnreadToday);
  const readCount = useStore((state) => state.readCount);
  const setReadCount = useStore((state) => state.setReadCount);

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
      setUnreadTotal(newStatus === "read" ? unreadTotal - 1 : unreadTotal + 1);
      setReadCount(newStatus === "read" ? readCount + 1 : readCount - 1);
      if (isIn24Hours(activeContent.published_at)) {
        setUnreadToday(
          newStatus === "read" ? unreadToday - 1 : unreadToday + 1,
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
