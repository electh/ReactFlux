import { useContext, useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import useStore from "../../Store";
import { updateEntryStatus } from "../../apis";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import useLoadMore from "../../hooks/useLoadMore";
import ActionButtons from "../Article/ActionButtons";
import ActionButtonsMobile from "../Article/ActionButtonsMobile";
import ArticleDetail from "../Article/ArticleDetail";
import ArticleList from "../Article/ArticleList";
import "./Content.css";
import ContentContext from "./ContentContext";
import FilterAndMarkPanel from "./FilterAndMarkPanel";
import "./Transition.css";

const Content = ({ info, getEntries, markAllAsRead }) => {
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);

  const {
    filteredEntries,
    filterStatus,
    loading,
    offset,
    setEntries,
    setFilteredEntries,
    setLoading,
    setLoadMoreUnreadVisible,
    setLoadMoreVisible,
    setOffset,
    setTotal,
    setUnreadCount,
  } = useContext(ContentContext);

  const {
    handleFetchContent,
    toggleEntryStarred,
    toggleEntryStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const {
    handleBKey,
    handleDKey,
    handleEscapeKey,
    handleLeftKey,
    handleMKey,
    handleRightKey,
    handleSKey,
  } = useKeyHandlers();

  const { getFirstImage } = useLoadMore();

  const [showArticleDetail, setShowArticleDetail] = useState(false);

  const entryListRef = useRef(null);
  const entryDetailRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    setShowArticleDetail(activeContent !== null);
  }, [activeContent]);

  const handleEntryClick = async (entry) => {
    setShowArticleDetail(false);

    setTimeout(() => {
      setActiveContent({ ...entry, status: "read" });
    }, 200);

    if (entry.status === "unread") {
      setTimeout(() => {
        handleEntryStatusUpdate(entry, "read");
      }, 200);

      const response = await updateEntryStatus(entry.id, "read");
      if (!response) {
        handleEntryStatusUpdate(entry, "unread");
      }
    }

    if (entryDetailRef.current) {
      entryDetailRef.current.setAttribute("tabIndex", "-1");
      entryDetailRef.current.focus();
      entryDetailRef.current.scrollTo(0, 0);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const keyMap = {
      27: () => handleEscapeKey(entryListRef),
      37: () => handleLeftKey(handleEntryClick),
      39: () => handleRightKey(handleEntryClick),
      66: () => handleBKey(),
      68: () => handleDKey(handleFetchContent),
      77: () => handleMKey(toggleEntryStatus),
      83: () => handleSKey(toggleEntryStarred),
    };

    const handleKeyDown = (event) => {
      const handler = keyMap[event.keyCode];
      if (handler) {
        handler();
      }
    };

    if (showArticleDetail) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContent, filteredEntries, showArticleDetail]);

  const fetchEntries = async () => {
    const responseAll = await getEntries();
    const responseUnread = await getEntries(offset, "unread");
    return { responseAll, responseUnread };
  };

  const processEntries = (response) => {
    const fetchedArticles = response.data.entries.map(getFirstImage);

    const filteredArticles =
      filterStatus === "all"
        ? fetchedArticles
        : fetchedArticles.filter((a) => a.status === "unread");

    return { fetchedArticles, filteredArticles };
  };

  const updateUI = (
    fetchedArticles,
    filteredArticles,
    responseAll,
    responseUnread,
  ) => {
    setEntries(fetchedArticles);
    setFilteredEntries(filteredArticles);

    setTotal(responseAll.data.total);
    setLoadMoreVisible(fetchedArticles.length < responseAll.data.total);
    setUnreadCount(responseUnread.data.total);
    setLoadMoreUnreadVisible(
      filteredArticles.length < responseUnread.data.total,
    );
  };

  const handleResponses = (responseAll, responseUnread) => {
    if (responseAll?.data?.entries && responseUnread?.data?.total >= 0) {
      const { fetchedArticles, filteredArticles } = processEntries(responseAll);
      updateUI(fetchedArticles, filteredArticles, responseAll, responseUnread);
    }
  };

  const getArticleList = async () => {
    setLoading(true);
    try {
      const { responseAll, responseUnread } = await fetchEntries();
      handleResponses(responseAll, responseUnread);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    getArticleList();
    setActiveContent(null);
    if (entryListRef.current) {
      entryListRef.current.scrollTo(0, 0);
    }
    if (entryDetailRef.current) {
      entryDetailRef.current.scrollTo(0, 0);
    }
    setOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

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
          <ArticleList
            cardsRef={cardsRef}
            loading={loading}
            getEntries={getEntries}
            handleEntryClick={handleEntryClick}
            ref={entryListRef}
          />
        </CSSTransition>
        <FilterAndMarkPanel
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
      <ActionButtonsMobile handleEntryClick={handleEntryClick} />
    </>
  );
};

export default Content;
