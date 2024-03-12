import { useContext } from "react";

import { updateEntryStarred, updateEntryStatus } from "../apis";
import { ContentContext } from "../components/ContentContext";

const useEntryActions = () => {
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
