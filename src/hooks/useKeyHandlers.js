import { useContext, useEffect, useState } from "react";

import useStore from "../Store";
import ContentContext from "../components/Content/ContentContext";
import { scrollToElement } from "../utils/scroll.js";
import { isMobileWidth } from "../utils/viewport.js";
import useLoadMore from "./useLoadMore.js";

const useKeyHandlers = (info, handleEntryClick, getEntries) => {
  const {
    entryDetailRef,
    filteredEntries,
    filterStatus,
    loadMoreUnreadVisible,
    loadMoreVisible,
  } = useContext(ContentContext);

  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);

  const { handleLoadMore } = useLoadMore();

  const [isLoading, setIsLoading] = useState(false);
  const [checkNext, setCheckNext] = useState(false);

  useEffect(() => {
    const entryList = document.querySelector(".entry-list");
    if (!entryList || !isMobileWidth()) {
      return;
    }

    if (activeContent) {
      entryList.style.visibility = "hidden";
    } else {
      entryList.style.visibility = "visible";
    }
  }, [activeContent]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (checkNext && !isLoading) {
      handleRightKey(info);
      setCheckNext(false);
    }
  }, [isLoading, checkNext]);

  // go back to entry list
  const handleEscapeKey = (entryListRef) => {
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
  const handleRightKey = (info) => {
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
      handleLoadMore(info, getEntries)
        .then(() => setCheckNext(true))
        .finally(() => setIsLoading(false));
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
