import { Message } from "@arco-design/web-react";
import { useContext, useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import { useAtom, useAtomValue } from "jotai";
import useStore from "../../Store";
import { updateEntriesStatus } from "../../apis";
import { configAtom } from "../../atoms/configAtom";
import {
  hiddenFeedIdsAtom,
  historyDataAtom,
  isAppDataReadyAtom,
  starredDataAtom,
  unreadTodayDataAtom,
} from "../../atoms/dataAtom";
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

  const [unreadTodayData, setUnreadTodayData] = useAtom(unreadTodayDataAtom);
  const [starredData, setStarredData] = useAtom(starredDataAtom);
  const [historyData, setHistoryData] = useAtom(historyDataAtom);

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

  const updateUI = (articles, unreadArticles, total, unreadCount) => {
    setEntries(articles);
    setUnreadEntries(unreadArticles);

    const targetArticles = filterStatus === "all" ? articles : unreadArticles;
    setFilteredEntries(
      filterEntriesByVisibility(
        targetArticles,
        info,
        showAllFeeds,
        hiddenFeedIds,
      ),
    );

    setTotal(total);
    setLoadMoreVisible(articles.length < total);
    setUnreadCount(unreadCount);
    setLoadMoreUnreadVisible(unreadArticles.length < unreadCount);
  };

  const handleResponses = (responseAll, responseUnread) => {
    const articles = responseAll.data.entries.map(parseFirstImage);
    const unreadArticles = responseUnread.data.entries.map(parseFirstImage);
    const { total } = responseAll.data;
    const { total: unreadCount } = responseUnread.data;

    updateUI(articles, unreadArticles, total, unreadCount);
  };

  const getArticleList = async (refresh = false) => {
    setLoading(true);
    try {
      let responseAll;
      let responseUnread;

      if (refresh) {
        responseAll = await getEntries();
        if (info.from === "starred") {
          setStarredData(responseAll.data);
        } else if (info.from === "history") {
          setHistoryData(responseAll.data);
        }
        responseUnread =
          info.from === "history" ? responseAll : await getEntries(0, "unread");
        handleResponses(responseAll, responseUnread);
      } else {
        responseUnread = await getEntries(0, "unread");
      }

      switch (info.from) {
        case "today": {
          if (refresh) {
            setUnreadTodayData(responseUnread.data);
            responseAll = await getEntries();
          }
          const articlesToday = (
            refresh ? responseAll.data : unreadTodayData
          ).entries.map(parseFirstImage);
          const unreadArticlesToday =
            responseUnread.data.entries.map(parseFirstImage);
          updateUI(
            articlesToday,
            unreadArticlesToday,
            (refresh ? responseAll.data : unreadTodayData).total,
            responseUnread.data.total,
          );
          break;
        }
        case "starred": {
          const starredArticles = starredData.entries.map(parseFirstImage);
          const unreadStarredArticles =
            responseUnread.data.entries.map(parseFirstImage);
          updateUI(
            starredArticles,
            unreadStarredArticles,
            starredData.total,
            responseUnread.data.total,
          );
          break;
        }
        case "history": {
          const historyArticles = historyData.entries.map(parseFirstImage);
          updateUI(
            historyArticles,
            historyArticles,
            historyData.total,
            historyData.total,
          );
          break;
        }
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
    await getArticleList(true);
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
      getArticleList().then(() => setIsFirstRenderCompleted(true));
      setIsArticleFocused(true);
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
