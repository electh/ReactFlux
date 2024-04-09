import { Message } from "@arco-design/web-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import useStore from "../../Store";
import { updateEntryStatus } from "../../apis";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import useLoadMore from "../../hooks/useLoadMore";
import { filterEntriesByVisibility } from "../../utils/filter.js";
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
  const initData = useStore((state) => state.initData);
  const isInitCompleted = useStore((state) => state.isInitCompleted);

  const {
    entries,
    entryDetailRef,
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
    setUnreadEntries,
    setUnreadOffset,
    total,
    unreadCount,
    unreadEntries,
  } = useContext(ContentContext);

  const {
    handleFetchContent,
    handleToggleStarred,
    handleToggleStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const { getFirstImage } = useLoadMore(info);

  const [showArticleDetail, setShowArticleDetail] = useState(false);
  const [isFilteredEntriesUpdated, setIsFilteredEntriesUpdated] =
    useState(false);
  const [isFirstRenderCompleted, setIsFirstRenderCompleted] = useState(false);

  const entryListRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    setShowArticleDetail(activeContent !== null);
  }, [activeContent]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!isFirstRenderCompleted || info.from === "history") {
      return;
    }
    setTimeout(() => {
      refreshArticleList();
    }, 200);
  }, [orderBy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!isFirstRenderCompleted) {
      return;
    }
    setTimeout(() => {
      refreshArticleList();
    }, 200);
  }, [orderDirection]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setFilteredEntries(() => {
      if (["all", "today", "group"].includes(info.from) && !showAllFeeds) {
        const targetEntries = filterStatus === "all" ? entries : unreadEntries;
        return targetEntries.filter(
          (entry) => !hiddenFeedIds.includes(entry.feed.id),
        );
      }

      return filterStatus === "all" ? entries : unreadEntries;
    });

    setIsFilteredEntriesUpdated(true);
  }, [filterStatus, hiddenFeedIds, showAllFeeds]);

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

  const handleEntryClick = async (entry) => {
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
  };

  const {
    handleBKey,
    handleDKey,
    handleEscapeKey,
    handleLeftKey,
    handleMKey,
    handleRightKey,
    handleSKey,
  } = useKeyHandlers(info, handleEntryClick, getEntries);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const keyMap = {
      27: () => handleEscapeKey(entryListRef),
      37: () => handleLeftKey(),
      39: () => handleRightKey(info),
      66: () => handleBKey(),
      68: () => handleDKey(handleFetchContent),
      77: () => handleMKey(handleToggleStatus),
      83: () => handleSKey(handleToggleStarred),
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

  const updateUI = (articles, articlesUnread, responseAll, responseUnread) => {
    setEntries(articles);
    setUnreadEntries(articlesUnread);

    if (filterStatus === "all") {
      setFilteredEntries(
        filterEntriesByVisibility(articles, info, showAllFeeds, hiddenFeedIds),
      );
    } else {
      setFilteredEntries(
        filterEntriesByVisibility(
          articlesUnread,
          info,
          showAllFeeds,
          hiddenFeedIds,
        ),
      );
    }

    setTotal(responseAll.data.total);
    setLoadMoreVisible(articles.length < responseAll.data.total);
    setUnreadCount(responseUnread.data.total);
    setLoadMoreUnreadVisible(articlesUnread.length < responseUnread.data.total);
  };

  const handleResponses = (responseAll, responseUnread) => {
    if (responseAll?.data?.entries && responseUnread?.data?.total >= 0) {
      const articles = responseAll.data.entries.map(getFirstImage);
      const articlesUnread = responseUnread.data.entries.map(getFirstImage);
      updateUI(articles, articlesUnread, responseAll, responseUnread);
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
    if (entryListRef.current) {
      entryListRef.current.scrollTo(0, 0);
    }
    setOffset(0);
    setUnreadOffset(0);
    if (!isInitCompleted) {
      initData();
      return;
    }
    await getArticleList();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (activeContent) {
      setActiveContent(null);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isInitCompleted) {
      getArticleList().then(() => setIsFirstRenderCompleted(true));
    }
  }, [isInitCompleted]);

  return (
    <>
      <div className="entry-col">
        <CSSTransition
          in={!loading}
          timeout={200}
          nodeRef={cardsRef}
          classNames="fade"
        >
          <ArticleList
            info={info}
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
        info={info}
        handleEntryClick={handleEntryClick}
        getEntries={getEntries}
        isFilteredEntriesUpdated={isFilteredEntriesUpdated}
        setIsFilteredEntriesUpdated={setIsFilteredEntriesUpdated}
      />
      <ActionButtonsMobile
        info={info}
        handleEntryClick={handleEntryClick}
        getEntries={getEntries}
        isFilteredEntriesUpdated={isFilteredEntriesUpdated}
        setIsFilteredEntriesUpdated={setIsFilteredEntriesUpdated}
      />
    </>
  );
};

export default Content;
