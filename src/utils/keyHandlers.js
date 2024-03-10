// go back to entry list
export const handleEscapeKey = (
  activeContent,
  setActiveContent,
  entryListRef,
) => {
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
export const handleLeftKey = (currentIndex, entries, handleClickEntryList) => {
  if (currentIndex > 0) {
    const prevEntry = entries[currentIndex - 1];
    handleClickEntryList(prevEntry);
    let card = document.querySelector(".card-custom-selected-style");
    if (card) {
      card.scrollIntoView(false);
    }
  }
};

// go to next entry
export const handleRightKey = (currentIndex, entries, handleClickEntryList) => {
  if (currentIndex < entries.length - 1) {
    const nextEntry = entries[currentIndex + 1];
    handleClickEntryList(nextEntry);
    let card = document.querySelector(".card-custom-selected-style");
    if (card) {
      card.scrollIntoView(true);
    }
  }
};

// mark as read or unread
export const handleMKey = (activeContent, handleUpdateEntry) => {
  if (activeContent) {
    handleUpdateEntry();
  }
};

// star or unstar
export const handleSKey = (activeContent, handleStarEntry) => {
  if (activeContent) {
    handleStarEntry();
  }
};
