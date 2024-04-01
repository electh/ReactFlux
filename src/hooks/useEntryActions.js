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
  const updateFeedUnreadCount = useStore(
    (state) => state.updateFeedUnreadCount,
  );
  const updateGroupUnreadCount = useStore(
    (state) => state.updateGroupUnreadCount,
  );

  const { setEntries, setFilteredEntries, setUnreadCount, setUnreadEntries } =
    useContext(ContentContext);

  const updateEntries = (entries, updatedEntry) =>
    entries.map((entry) =>
      entry.id === updatedEntry.id ? updatedEntry : entry,
    );

  const handleEntryStatusUpdate = (entry, newStatus) => {
    const {
      id: feedId,
      category: { id: groupId },
    } = entry.feed;
    const isRecent = checkIsInLast24Hours(entry.published_at);

    updateFeedUnreadCount(feedId, newStatus);
    updateGroupUnreadCount(groupId, newStatus);

    if (newStatus === "read") {
      setUnreadTotal((prev) => Math.max(0, prev - 1));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setReadCount((prev) => prev + 1);
      if (isRecent) {
        setUnreadToday((prev) => Math.max(0, prev - 1));
      }
    } else {
      setUnreadTotal((prev) => prev + 1);
      setUnreadCount((prev) => prev + 1);
      setReadCount((prev) => Math.max(0, prev - 1));
      if (isRecent) {
        setUnreadToday((prev) => prev + 1);
      }
    }

    const updatedEntry = { ...entry, status: newStatus };
    setActiveContent(updatedEntry);
    setEntries((prev) => updateEntries(prev, updatedEntry));
    setUnreadEntries((prev) => updateEntries(prev, updatedEntry));
    setFilteredEntries((prev) => updateEntries(prev, updatedEntry));
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
    setActiveContent(updatedEntry);
    setEntries((prev) => updateEntries(prev, updatedEntry));
    setUnreadEntries((prev) => updateEntries(prev, updatedEntry));
    setFilteredEntries((prev) => updateEntries(prev, updatedEntry));
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
    const newStarred = !activeContent.starred;
    handleEntryStarredUpdate(activeContent, newStarred);

    toggleEntryStarredApi(activeContent.id).catch(() => {
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
