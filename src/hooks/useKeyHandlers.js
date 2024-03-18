import { useContext } from "react";

import ContentContext from "../components/Content/ContentContext";

const useKeyHandlers = () => {
  const { activeContent, setActiveContent, entries } =
    useContext(ContentContext);

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
  };

  // go to previous entry
  const handleLeftKey = (handleEntryClick) => {
    const currentIndex = entries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );
    if (currentIndex > 0) {
      const prevEntry = entries[currentIndex - 1];
      handleEntryClick(prevEntry);
      const card = document.querySelector(".card-custom-selected-style");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  };

  // go to next entry
  const handleRightKey = (handleEntryClick) => {
    const currentIndex = entries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );
    if (currentIndex < entries.length - 1) {
      const nextEntry = entries[currentIndex + 1];
      handleEntryClick(nextEntry);
      const card = document.querySelector(".card-custom-selected-style");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // open link externally
  const handleBKey = () => {
    if (activeContent) {
      window.open(activeContent.url, "_blank");
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
    handleMKey,
    handleSKey,
  };
};

export default useKeyHandlers;
