import { useEffect, useState } from "react";

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

const useKeyHandlers = (info, handleEntryClick) => {
  const filteredEntries = useAtomValue(filteredEntriesAtom);
  const filterStatus = useAtomValue(filterStatusAtom);
  const loadMoreUnreadVisible = useAtomValue(loadMoreUnreadVisibleAtom);
  const loadMoreVisible = useAtomValue(loadMoreVisibleAtom);

  const { activeContent, setActiveContent } = useActiveContent();

  const { loadingMore } = useLoadMore();

  const [isLoading, setIsLoading] = useState(false);
  const [checkNext, setCheckNext] = useState(false);

  useEffect(() => {
    if (checkNext && !loadingMore) {
      setIsLoading(false);
      setCheckNext(false);
      handleRightKey();
    }
  }, [checkNext, loadingMore]);

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
  const handleRightKey = () => {
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
      setIsLoading(true);
      setCheckNext(true);
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
