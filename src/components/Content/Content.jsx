import { Message } from "@arco-design/web-react";
import { useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import { useStore } from "@nanostores/react";
import { updateEntriesStatus } from "../../apis";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import {
  contentState,
  filteredEntriesState,
  setActiveContent,
  setEntries,
  setFilterStatus,
  setInfoFrom,
  setIsArticleFocused,
  setLoading,
  setOffset,
  setTotal,
  setUnreadCount,
  setUnreadEntries,
  setUnreadOffset,
} from "../../store/contentState";
import { dataState, fetchData } from "../../store/dataState";
import { settingsState } from "../../store/settingsState";
import { parseFirstImage } from "../../utils/images";
import ArticleDetail from "../Article/ArticleDetail";
import ArticleList from "../Article/ArticleList";
import "./Content.css";
import FooterPanel from "./FooterPanel";
import "./Transition.css";

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, isArticleFocused, loading } = useStore(contentState);
  const { isAppDataReady } = useStore(dataState);
  const { orderBy, orderDirection, showStatus } = useStore(settingsState);
  const filteredEntries = useStore(filteredEntriesState);

  const {
    handleFetchContent,
    handleToggleStarred,
    handleToggleStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const [isInitialRenderComplete, setIsInitialRenderComplete] = useState(false);

  const entryListRef = useRef(null);
  const cardsRef = useRef(null);

  // 文章详情页的引用
  const entryDetailRef = useRef(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (
      !isInitialRenderComplete ||
      ["starred", "history"].includes(info.from)
    ) {
      return;
    }
    refreshArticleList();
  }, [orderBy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (["starred", "history"].includes(info.from)) {
      setFilterStatus("all");
    } else {
      setFilterStatus(showStatus);
    }
    setInfoFrom(info.from);
    refreshArticleList();
  }, [info, orderDirection]);

  const handleEntryClick = async (entry) => {
    setActiveContent(null);

    if (entry.status !== "unread") {
      setTimeout(() => {
        setActiveContent({ ...entry, status: "read" });
      }, 200);
      return;
    }

    try {
      setTimeout(() => {
        setActiveContent({ ...entry, status: "read" });
        handleEntryStatusUpdate(entry, "read");
      }, 200);
      await updateEntriesStatus([entry.id], "read");
    } catch {
      Message.error("Failed to mark entry as read, please try again later");
      handleEntryStatusUpdate(entry, "unread");
    }
  };

  const {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToPreviousArticle,
    openLinkExternally,
    openPhotoSlider,
    toggleReadStatus,
    toggleStarStatus,
  } = useKeyHandlers(handleEntryClick);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const keyMap = {
      ArrowLeft: () => navigateToPreviousArticle(),
      ArrowRight: () => navigateToNextArticle(),
      Escape: () => exitDetailView(entryListRef, entryDetailRef),
      b: openLinkExternally,
      d: () => fetchOriginalArticle(handleFetchContent),
      m: () => toggleReadStatus(() => handleToggleStatus(activeContent)),
      s: () => toggleStarStatus(() => handleToggleStarred(activeContent)),
      v: openPhotoSlider,
    };

    const handleKeyDown = (event) => {
      const handler = keyMap[event.key];
      if (handler) {
        if (event.key === "ArrowLeft") {
          navigateToPreviousArticle(event.ctrlKey);
        } else if (event.key === "ArrowRight") {
          navigateToNextArticle(event.ctrlKey);
        } else {
          handler();
        }
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

  const updateUI = (articles, unreadArticles, responseAll, responseUnread) => {
    setEntries(articles);
    setUnreadEntries(unreadArticles);
    setTotal(responseAll.total);
    setUnreadCount(responseUnread.total);
  };

  const handleResponses = (responseAll, responseUnread) => {
    if (responseAll?.entries && responseUnread?.total >= 0) {
      const articles = responseAll.entries.map(parseFirstImage);
      const unreadArticles = responseUnread.entries.map(parseFirstImage);
      updateUI(articles, unreadArticles, responseAll, responseUnread);
    }
  };

  const fetchArticleList = async () => {
    setLoading(true);
    try {
      const responseAll = await getEntries();
      const responseUnread =
        info.from === "history" ? responseAll : await getEntries(0, "unread");
      handleResponses(responseAll, responseUnread);
    } catch (error) {
      console.error("Error fetching articles: ", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshArticleList = async () => {
    entryListRef.current?.scrollTo(0, 0);
    setOffset(0);
    setUnreadOffset(0);
    if (!isAppDataReady) {
      await fetchData();
      return;
    }
    await fetchArticleList();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (activeContent) {
      setActiveContent(null);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!isAppDataReady) {
      try {
        fetchArticleList();
        setIsInitialRenderComplete(true);
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
            cardsRef={cardsRef}
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
        in={activeContent !== null}
        timeout={200}
        nodeRef={entryDetailRef}
        classNames="fade"
        unmountOnExit
      >
        <ArticleDetail
          handleEntryClick={handleEntryClick}
          entryListRef={entryListRef}
          ref={entryDetailRef}
        />
      </CSSTransition>
    </>
  );
};

export default Content;
