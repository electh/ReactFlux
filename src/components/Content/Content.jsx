import { Message } from "@arco-design/web-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
import FooterPanel from "./FooterPanel.jsx";
import "./Transition.css";

const Content = ({ info, getEntries, markAllAsRead }) => {
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);
  const setReadCount = useStore((state) => state.setReadCount);
  const setStarredCount = useStore((state) => state.setStarredCount);
  const setUnreadToday = useStore((state) => state.setUnreadToday);
  const setUnreadTotal = useStore((state) => state.setUnreadTotal);
  const updateFeedUnreadCount = useStore(
    (state) => state.updateFeedUnreadCount,
  );
  const updateGroupUnreadCount = useStore(
    (state) => state.updateGroupUnreadCount,
  );
  const showAllFeeds = useStore((state) => state.showAllFeeds);
  const hiddenFeedIds = useStore((state) => state.hiddenFeedIds);
  const orderBy = useStore((state) => state.orderBy);
  const orderDirection = useStore((state) => state.orderDirection);

  const {
    entries,
    filteredEntries,
    filterStatus,
    loading,
    setEntries,
    setFilteredEntries,
    setLoading,
    setLoadMoreUnreadVisible,
    setLoadMoreVisible,
    setOffset,
    setTotal,
    setUnreadCount,
    total,
    unreadCount,
  } = useContext(ContentContext);

  const {
    handleFetchContent,
    toggleEntryStarred,
    toggleEntryStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const { getFirstImage } = useLoadMore();

  const [showArticleDetail, setShowArticleDetail] = useState(false);
  const [isFilteredEntriesUpdated, setIsFilteredEntriesUpdated] =
    useState(false);
  const [isShowAllFeedsUpdated, setIsShowAllFeedsUpdated] = useState(false);

  const entryListRef = useRef(null);
  const entryDetailRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    setShowArticleDetail(activeContent !== null);
  }, [activeContent]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setIsShowAllFeedsUpdated(true);
  }, [showAllFeeds]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (info.from === "history") {
      return;
    }
    setTimeout(() => {
      refreshArticleList();
    }, 200);
  }, [orderBy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setTimeout(() => {
      refreshArticleList();
    }, 200);
  }, [orderDirection]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!showAllFeeds && hiddenFeedIds) {
      setFilteredEntries((entries) =>
        entries.filter((entry) => !hiddenFeedIds.includes(entry.feed.id)),
      );
    } else if (isShowAllFeedsUpdated) {
      setFilteredEntries(() => filterArticles(entries));
      setIsShowAllFeedsUpdated(false);
    }
    setIsFilteredEntriesUpdated(true);
  }, [hiddenFeedIds, showAllFeeds]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (unreadCount === 0 || total === 0) {
      return;
    }

    switch (info.from) {
      case "all":
        if (showAllFeeds) {
          setUnreadTotal(() => unreadCount);
        }
        break;
      case "today":
        setUnreadToday(() => unreadCount);
        break;
      case "starred":
        setStarredCount(() => total);
        break;
      case "history":
        setReadCount(() => total);
        break;
      case "feed": {
        const feedId = Number.parseInt(info.id);
        updateFeedUnreadCount(feedId, unreadCount);
        break;
      }
      case "group": {
        const groupId = Number.parseInt(info.id);
        updateGroupUnreadCount(groupId, unreadCount);
        break;
      }
      default:
        break;
    }
  }, [total, unreadCount]);

  const handleEntryClick = useCallback(async (entry) => {
    setShowArticleDetail(false);

    setTimeout(() => {
      setActiveContent({ ...entry, status: "read" });
    }, 200);

    if (entry.status === "unread") {
      setTimeout(() => {
        handleEntryStatusUpdate(entry, "read");
      }, 200);

      updateEntryStatus(entry.id, "read").catch(() => {
        Message.error("Failed to mark entry as read, please try again later");
        handleEntryStatusUpdate(entry, "unread");
      });
    }

    if (entryDetailRef.current) {
      entryDetailRef.current.setAttribute("tabIndex", "-1");
      entryDetailRef.current.focus();
      entryDetailRef.current.scrollTo(0, 0);
    }
  });

  const {
    handleBKey,
    handleDKey,
    handleEscapeKey,
    handleLeftKey,
    handleMKey,
    handleRightKey,
    handleSKey,
  } = useKeyHandlers(
    handleEntryClick,
    getEntries,
    isFilteredEntriesUpdated,
    setIsFilteredEntriesUpdated,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const keyMap = {
      27: () => handleEscapeKey(entryListRef),
      37: () => handleLeftKey(),
      39: () => handleRightKey(),
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
  }, [activeContent, filteredEntries, showArticleDetail]);

  const filterArticles = (articles) => {
    if (filterStatus === "all") {
      return articles;
    }
    return articles.filter((article) => article.status === "unread");
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
      const fetchedArticles = responseAll.data.entries.map(getFirstImage);
      const filteredArticles = filterArticles(fetchedArticles);
      updateUI(fetchedArticles, filteredArticles, responseAll, responseUnread);
    }
  };

  const getArticleList = async () => {
    setLoading(true);
    try {
      const responseAll = await getEntries();
      if (info.from === "history") {
        handleResponses(responseAll, responseAll);
      } else {
        const responseUnread = await getEntries(0, "unread");
        handleResponses(responseAll, responseUnread);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshArticleList = async () => {
    await getArticleList();
    if (entryListRef.current) {
      entryListRef.current.scrollTo(0, 0);
    }
    setOffset(0);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    refreshArticleList();
    setActiveContent(null);
    if (entryDetailRef.current) {
      entryDetailRef.current.scrollTo(0, 0);
    }
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
        <FooterPanel
          info={info}
          refreshArticleList={refreshArticleList}
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
      <ActionButtons
        handleEntryClick={handleEntryClick}
        getEntries={getEntries}
        isFilteredEntriesUpdated={isFilteredEntriesUpdated}
        setIsFilteredEntriesUpdated={setIsFilteredEntriesUpdated}
      />
      <ActionButtonsMobile
        handleEntryClick={handleEntryClick}
        getEntries={getEntries}
        isFilteredEntriesUpdated={isFilteredEntriesUpdated}
        setIsFilteredEntriesUpdated={setIsFilteredEntriesUpdated}
      />
    </>
  );
};

export default Content;
