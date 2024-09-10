import { Message } from "@arco-design/web-react";
import { useEffect, useRef } from "react";
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
  setInfoFrom,
  setIsArticleFocused,
  setIsArticleListReady,
  setOffset,
  setTotal,
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
  const { activeContent, isArticleFocused, isArticleListReady } =
    useStore(contentState);
  const { isAppDataReady } = useStore(dataState);
  const { orderBy, orderDirection, showAllFeeds, showStatus } =
    useStore(settingsState);
  const filteredEntries = useStore(filteredEntriesState);

  const {
    handleFetchContent,
    handleToggleStarred,
    handleToggleStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const entryListRef = useRef(null);
  const cardsRef = useRef(null);

  // 文章详情页的引用
  const entryDetailRef = useRef(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (["starred", "history"].includes(info.from)) {
      return;
    }
    refreshArticleList();
  }, [orderBy, showAllFeeds]);

  useEffect(() => {
    setInfoFrom(info.from);
    refreshArticleList();
  }, [info]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    refreshArticleList();
  }, [orderDirection, showStatus]);

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

  const handleResponses = (response) => {
    if (response?.total >= 0) {
      const articles = response.entries.map(parseFirstImage);
      setEntries(articles);
      setTotal(response.total);
    }
  };

  const fetchArticleList = async () => {
    setIsArticleListReady(false);
    try {
      const response =
        showStatus === "unread"
          ? await getEntries(0, "unread")
          : await getEntries();
      handleResponses(response);
    } catch (error) {
      console.error("Error fetching articles: ", error);
    } finally {
      setIsArticleListReady(true);
    }
  };

  const refreshArticleList = async () => {
    entryListRef.current?.scrollTo(0, 0);
    setOffset(0);
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
          in={isArticleListReady}
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
