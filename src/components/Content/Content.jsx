import { Message } from "@arco-design/web-react";
import { useContext, useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import { useAtomValue } from "jotai";
import useStore from "../../Store";
import { updateEntriesStatus } from "../../apis";
import { configAtom } from "../../atoms/configAtom";
import { hiddenFeedIdsAtom, isAppDataReadyAtom } from "../../atoms/dataAtom";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import { useLoadData } from "../../hooks/useLoadData";
import useLoadMore from "../../hooks/useLoadMore";
import { filterEntriesByVisibility } from "../../utils/filter";
import ArticleDetail from "../Article/ArticleDetail";
import ArticleList from "../Article/ArticleList";
import "./Content.css";
import ContentContext from "./ContentContext";
import FooterPanel from "./FooterPanel";
import "./Transition.css";

const Content = ({ info, getEntries, markAllAsRead }) => {
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);

  const hiddenFeedIds = useAtomValue(hiddenFeedIdsAtom);
  const isAppDataReady = useAtomValue(isAppDataReadyAtom);
  const { loadData } = useLoadData();
  const config = useAtomValue(configAtom);
  const { orderBy, orderDirection, showAllFeeds } = config;

  const {
    entries,
    entryDetailRef,
    filteredEntries,
    filterStatus,
    isArticleFocused,
    loading,
    setEntries,
    setFilteredEntries,
    setIsArticleFocused,
    setLoading,
    setLoadMoreUnreadVisible,
    setLoadMoreVisible,
    setOffset,
    setTotal,
    setUnreadCount,
    setUnreadEntries,
    setUnreadOffset,
    unreadEntries,
  } = useContext(ContentContext);

  const {
    handleFetchContent,
    handleToggleStarred,
    handleToggleStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const { parseFirstImage } = useLoadMore(info);

  const [isFilteredEntriesUpdated, setIsFilteredEntriesUpdated] =
    useState(false);
  const [isFirstRenderCompleted, setIsFirstRenderCompleted] = useState(false);

  const entryListRef = useRef(null);
  const cardsRef = useRef(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!isFirstRenderCompleted || info.from === "history") {
      return;
    }
    refreshArticleList();
  }, [orderBy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    refreshArticleList();
  }, [info, orderDirection]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setFilteredEntries(() => {
      if (["all", "today", "category"].includes(info.from) && !showAllFeeds) {
        const targetEntries = filterStatus === "all" ? entries : unreadEntries;
        return targetEntries.filter(
          (entry) => !hiddenFeedIds.includes(entry.feed.id),
        );
      }

      return filterStatus === "all" ? entries : unreadEntries;
    });

    setIsFilteredEntriesUpdated(true);
  }, [filterStatus, hiddenFeedIds, showAllFeeds]);

  const handleEntryClick = async (entry) => {
    setActiveContent(null);

    setTimeout(() => {
      setActiveContent({ ...entry, status: "read" });
    }, 200);

    if (entry.status === "unread") {
      setTimeout(() => {
        handleEntryStatusUpdate(entry, "read");
      }, 200);

      updateEntriesStatus([entry.id], "read").catch(() => {
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
      77: () => handleMKey(() => handleToggleStatus(activeContent)),
      83: () => handleSKey(() => handleToggleStarred(activeContent)),
    };

    const handleKeyDown = (event) => {
      const handler = keyMap[event.keyCode];
      if (handler) {
        handler();
      }
    };

    if (isArticleFocused) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeContent, filteredEntries, isArticleFocused]);

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
      const articles = responseAll.data.entries.map(parseFirstImage);
      const articlesUnread = responseUnread.data.entries.map(parseFirstImage);
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
    if (!isAppDataReady) {
      loadData();
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
    if (isAppDataReady) {
      try {
        getArticleList();
        setIsFirstRenderCompleted(true);
        setIsArticleFocused(true);
      } catch (error) {
        Message.error("Failed to fetch articles, please try again later");
      }
    }
  }, [isAppDataReady]);

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
        in={activeContent != null}
        timeout={200}
        nodeRef={entryDetailRef}
        classNames="fade"
        unmountOnExit
      >
        <ArticleDetail
          info={info}
          handleEntryClick={handleEntryClick}
          getEntries={getEntries}
          isFilteredEntriesUpdated={isFilteredEntriesUpdated}
          setIsFilteredEntriesUpdated={setIsFilteredEntriesUpdated}
          ref={entryDetailRef}
        />
      </CSSTransition>
    </>
  );
};

export default Content;
