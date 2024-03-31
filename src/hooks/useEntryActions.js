import { Message } from "@arco-design/web-react";
import Confetti from "canvas-confetti";
import { useContext } from "react";

import useStore from "../Store";
import {
  fetchOriginalArticle,
  toggleEntryStarred as toggleEntryStarredApi,
  updateEntryStatus,
} from "../apis";
import ContentContext from "../components/Content/ContentContext";
import { checkIsInLast24Hours } from "../utils/date";

const useEntryActions = () => {
  const setUnreadTotal = useStore((state) => state.setUnreadTotal);
  const setUnreadToday = useStore((state) => state.setUnreadToday);
  const setReadCount = useStore((state) => state.setReadCount);
  const setStarredCount = useStore((state) => state.setStarredCount);
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);
  const updateFeedUnread = useStore((state) => state.updateFeedUnreadCount);
  const updateGroupUnread = useStore((state) => state.updateGroupUnreadCount);

  const { setEntries, setFilteredEntries, setUnreadCount, setUnreadEntries } =
    useContext(ContentContext);

  const updateEntries = (entries, entry) =>
    entries.map((e) => (e.id === entry.id ? entry : e));

  const handleEntryStatusUpdate = (entry, newStatus) => {
    const {
      id: feedId,
      category: { id: groupId },
    } = entry.feed;
    const isRecent = checkIsInLast24Hours(entry.published_at);

    updateFeedUnread(feedId, newStatus);
    updateGroupUnread(groupId, newStatus);

    if (newStatus === "read") {
      setUnreadTotal((current) => Math.max(0, current - 1));
      setUnreadCount((current) => Math.max(0, current - 1));
      setReadCount((current) => current + 1);
      if (isRecent) {
        setUnreadToday((current) => Math.max(0, current - 1));
      }
    } else {
      setUnreadTotal((current) => current + 1);
      setUnreadCount((current) => current + 1);
      setReadCount((current) => Math.max(0, current - 1));
      if (isRecent) {
        setUnreadToday((current) => current + 1);
      }
    }

    const updatedEntry = { ...entry, status: newStatus };
    setActiveContent(updatedEntry);
    setEntries((prevEntries) => updateEntries(prevEntries, updatedEntry));
    setUnreadEntries((prevEntries) => updateEntries(prevEntries, updatedEntry));
    setFilteredEntries((prevEntries) =>
      updateEntries(prevEntries, updatedEntry),
    );
  };

  const handleEntryStarredUpdate = (entry, newStarred) => {
    if (newStarred) {
      setStarredCount((current) => current + 1);
      Confetti({
        particleCount: 100,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 1 },
      });
    } else {
      setStarredCount((current) => Math.max(0, current - 1));
    }

    const updatedEntry = { ...entry, starred: newStarred };
    setActiveContent(updatedEntry);
    setEntries((prevEntries) => updateEntries(prevEntries, updatedEntry));
    setUnreadEntries((prevEntries) => updateEntries(prevEntries, updatedEntry));
    setFilteredEntries((prevEntries) =>
      updateEntries(prevEntries, updatedEntry),
    );
  };

  const handleToggleStatus = async () => {
    const prevStatus = activeContent.status;
    const newStatus = prevStatus === "read" ? "unread" : "read";
    handleEntryStatusUpdate(activeContent, newStatus);

    updateEntryStatus(activeContent.id, newStatus).catch(() => {
      Message.error(
        `Failed to mark entry as ${newStatus}, please try again later`,
      );
      handleEntryStatusUpdate(activeContent, prevStatus);
    });
  };

  const handleToggleStarred = async () => {
    const { id } = activeContent;
    const newStarred = !activeContent.starred;
    handleEntryStarredUpdate(activeContent, newStarred);

    toggleEntryStarredApi(id).catch(() => {
      Message.error(
        `Failed to ${
          newStarred ? "star" : "unstar"
        } entry, please try again later`,
      );
      handleEntryStarredUpdate(activeContent, !newStarred);
    });
  };

  const handleFetchContent = async () => {
    fetchOriginalArticle(activeContent.id)
      .then((response) => {
        Message.success("Fetched content successfully");
        setActiveContent({ ...activeContent, content: response.data.content });
      })
      .catch(() => {
        Message.error("Failed to fetch content, please try again later");
      });
  };

  return {
    handleEntryStatusUpdate,
    handleFetchContent,
    handleToggleStarred,
    handleToggleStatus,
  };
};

export default useEntryActions;
