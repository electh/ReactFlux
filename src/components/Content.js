import { useContext, useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import { updateEntryStatus } from "../apis";
import useEntryActions from "../hooks/useEntryActions";
import {
  handleBKey,
  handleEscapeKey,
  handleLeftKey,
  handleMKey,
  handleRightKey,
  handleSKey,
} from "../utils/keyHandlers";
import ActionButtons from "./Articles/ActionButtons";
import ArticleDetail from "./Articles/ArticleDetail";
import ArticleListView from "./Articles/ArticleListView";
import FilterAndMarkPanel from "./Articles/FilterAndMarkPanel";
import "./Content.css";
import { ContentContext } from "./ContentContext";
import "./Transition.css";

export default function Content({ info, getEntries, markAllAsRead }) {
  const {
    activeContent,
    allEntries,
    entries,
    loading,
    setActiveContent,
    setAllEntries,
    setEntries,
    setUnreadTotal,
    unreadTotal,
    updateFeedUnread,
    updateGroupUnread,
  } = useContext(ContentContext);

  const { toggleEntryStarred, toggleEntryStatus } = useEntryActions();

  const [showArticleDetail, setShowArticleDetail] = useState(false);

  const entryListRef = useRef(null);
  const entryDetailRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    setShowArticleDetail(activeContent);
  }, [activeContent]);

  const updateLocalEntryStatus = (entries, entryId, status) => {
    return entries.map((e) => (e.id === entryId ? { ...e, status } : e));
  };

  const handleEntryClick = (entry) => {
    const processEntryClick = async () => {
      setShowArticleDetail(false);

      setTimeout(() => {
        setActiveContent({ ...entry, status: "read" });
      }, 200);

      if (entry.status === "unread") {
        const response = await updateEntryStatus(entry, "read");
        if (response) {
          updateFeedUnread(entry.feed.id, "read");
          updateGroupUnread(entry.feed.category.id, "read");
          setEntries(updateLocalEntryStatus(entries, entry.id, "read"));
          setAllEntries(updateLocalEntryStatus(allEntries, entry.id, "read"));
          setUnreadTotal(unreadTotal - 1);
        }
      }

      if (entryDetailRef.current) {
        entryDetailRef.current.setAttribute("tabIndex", "-1");
        entryDetailRef.current.focus();
        entryDetailRef.current.scrollTo(0, 0);
      }
    };

    processEntryClick();
  };

  useEffect(() => {
    const currentIndex = entries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );
    const keyMap = {
      27: () => handleEscapeKey(activeContent, setActiveContent, entryListRef),
      37: () => handleLeftKey(currentIndex, entries, handleEntryClick),
      39: () => handleRightKey(currentIndex, entries, handleEntryClick),
      66: () => handleBKey(activeContent),
      77: () => handleMKey(activeContent, toggleEntryStatus),
      83: () => handleSKey(activeContent, toggleEntryStarred),
    };

    const handleKeyDown = (event) => {
      const handler = keyMap[event.keyCode];
      if (handler) {
        handler();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContent, entries]);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--color-border-2)",
        }}
        className="entry-col"
      >
        <CSSTransition
          in={!loading}
          timeout={200}
          nodeRef={cardsRef}
          classNames="fade"
        >
          <ArticleListView
            cardsRef={cardsRef}
            loading={loading}
            getEntries={getEntries}
            handleEntryClick={handleEntryClick}
            ref={entryListRef}
          />
        </CSSTransition>
        <FilterAndMarkPanel
          entryDetailRef={entryDetailRef}
          getEntries={getEntries}
          info={info}
          markAllAsRead={markAllAsRead}
          ref={entryListRef}
        />
      </div>
      <CSSTransition
        in={showArticleDetail}
        timeout={200}
        nodeRef={entryDetailRef}
        classNames="fade"
        unmountOnExit
      >
        <ArticleDetail ref={entryDetailRef} />
      </CSSTransition>
      <ActionButtons />
    </>
  );
}
