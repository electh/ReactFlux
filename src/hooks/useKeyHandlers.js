import { useEffect, useState } from "react";

import { Message } from "@arco-design/web-react";
import { useAtomValue } from "jotai";
import {
  filterStatusAtom,
  filteredEntriesAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
} from "../atoms/contentAtom";
import { scrollToElement } from "../utils/scroll";
import { useActiveContent } from "./useActiveContent";
import useLoadMore from "./useLoadMore";

const useKeyHandlers = (info, handleEntryClick, getEntries) => {
  const filteredEntries = useAtomValue(filteredEntriesAtom);
  const filterStatus = useAtomValue(filterStatusAtom);
  const loadMoreUnreadVisible = useAtomValue(loadMoreUnreadVisibleAtom);
  const loadMoreVisible = useAtomValue(loadMoreVisibleAtom);

  const { activeContent, setActiveContent } = useActiveContent();

  const { handleLoadMore } = useLoadMore();

  const [isLoading, setIsLoading] = useState(false);
  const [checkNext, setCheckNext] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (checkNext && !isLoading) {
      handleRightKey(info);
      setCheckNext(false);
    }
  }, [isLoading, checkNext]);

  // go back to entry list
  const handleEscapeKey = (entryListRef, entryDetailRef) => {
    if (!activeContent) {
      return;
    }
    setActiveContent(null);
    if (entryListRef.current) {
      entryListRef.current.setAttribute("tabIndex", "-1");
      entryListRef.current.focus();
    }
    if (entryDetailRef.current) {
      entryDetailRef.current.scrollTo(0, 0);
    }
  };

  // go to previous entry
  const handleLeftKey = () => {
    const currentIndex = filteredEntries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );
    if (currentIndex > 0) {
      const prevEntry = filteredEntries[currentIndex - 1];
      handleEntryClick(prevEntry);
      scrollToElement(".card-custom-selected-style", "end");
    }
  };

  // go to next entry
  const handleRightKey = async (info) => {
    if (isLoading) {
      return;
    }

    const currentIndex = filteredEntries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );
    const isLastEntry = currentIndex === filteredEntries.length - 1;

    if (
      isLastEntry &&
      ((filterStatus === "all" && loadMoreVisible) || loadMoreUnreadVisible)
    ) {
      try {
        setIsLoading(true);
        await handleLoadMore(info, getEntries);
        setCheckNext(true);
      } catch (error) {
        Message.error("Failed to load more articles, please try again later");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (currentIndex === -1) {
      const entryList = document.querySelector(".entry-list");
      if (entryList) {
        entryList.scrollTo(0, 0);
      }
    }

    if (currentIndex < filteredEntries.length - 1) {
      const nextEntry = filteredEntries[currentIndex + 1];
      handleEntryClick(nextEntry);
      setCheckNext(false);
      scrollToElement(".card-custom-selected-style");
    }
  };

  // open link externally
  const handleBKey = () => {
    if (activeContent) {
      window.open(activeContent.url, "_blank");
    }
  };

  // fetch original article
  const handleDKey = (handleFetchContent) => {
    if (activeContent) {
      handleFetchContent();
    }
  };

  // mark as read or unread
  const handleMKey = (handleUpdateEntry) => {
    if (activeContent) {
      handleUpdateEntry();
    }
  };

  // star or unstar
  const handleSKey = (handleStarEntry) => {
    if (activeContent) {
      handleStarEntry();
    }
  };

  return {
    handleEscapeKey,
    handleLeftKey,
    handleRightKey,
    handleBKey,
    handleDKey,
    handleMKey,
    handleSKey,
  };
};

export default useKeyHandlers;
