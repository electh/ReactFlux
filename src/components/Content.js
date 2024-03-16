import { useContext, useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import { useStore } from "../Store";
import { updateEntryStatus } from "../apis";
import useEntryActions from "../hooks/useEntryActions";
import useKeyHandlers from "../hooks/useKeyHandlers";
import { isInLast24Hours } from "../utils/Date";
import ActionButtons from "./Articles/ActionButtons";
import ArticleDetail from "./Articles/ArticleDetail";
import ArticleListView from "./Articles/ArticleListView";
import FilterAndMarkPanel from "./Articles/FilterAndMarkPanel";
import "./Content.css";
import { ContentContext } from "./ContentContext";
import "./Transition.css";

export default function Content({ info, getEntries, markAllAsRead }) {
  const unreadTotal = useStore((state) => state.unreadTotal);
  const unreadToday = useStore((state) => state.unreadToday);
  const readCount = useStore((state) => state.readCount);
  const setUnreadTotal = useStore((state) => state.setUnreadTotal);
  const setUnreadToday = useStore((state) => state.setUnreadToday);
  const setReadCount = useStore((state) => state.setReadCount);

  const {
    activeContent,
    allEntries,
    entries,
    loading,
    setActiveContent,
    setAllEntries,
    setEntries,
    updateFeedUnread,
    updateGroupUnread,
  } = useContext(ContentContext);

  const { toggleEntryStarred, toggleEntryStatus } = useEntryActions();
  const {
    handleBKey,
    handleEscapeKey,
    handleLeftKey,
    handleMKey,
    handleRightKey,
    handleSKey,
  } = useKeyHandlers();

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
          setUnreadTotal(Math.max(0, unreadTotal - 1));
          setReadCount(readCount + 1);
          if (isInLast24Hours(entry.published_at)) {
            setUnreadToday(Math.max(0, unreadToday - 1));
          }
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
    const keyMap = {
      27: () => handleEscapeKey(entryListRef),
      37: () => handleLeftKey(handleEntryClick),
      39: () => handleRightKey(handleEntryClick),
      66: () => handleBKey(),
      77: () => handleMKey(toggleEntryStatus),
      83: () => handleSKey(toggleEntryStarred),
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
      <ActionButtons handleEntryClick={handleEntryClick} />
    </>
  );
}
