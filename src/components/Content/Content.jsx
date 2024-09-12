import { Message } from "@arco-design/web-react";
import { useEffect, useRef } from "react";
import { CSSTransition } from "react-transition-group";

import { useStore } from "@nanostores/react";
import { updateEntriesStatus } from "../../apis";
import useAppData from "../../hooks/useAppData";
import useArticleList from "../../hooks/useArticleList";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import {
  contentState,
  filteredEntriesState,
  setActiveContent,
  setInfoFrom,
  setOffset,
} from "../../store/contentState";
import { dataState, hiddenFeedIdsState } from "../../store/dataState";
import { settingsState } from "../../store/settingsState";
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
  const hiddenFeedIds = useStore(hiddenFeedIdsState);

  const {
    handleFetchContent,
    handleToggleStarred,
    handleToggleStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const { fetchAppData } = useAppData();
  const { fetchArticleList } = useArticleList(getEntries);

  const entryListRef = useRef(null);
  const cardsRef = useRef(null);

  // 文章详情页的引用
  const entryDetailRef = useRef(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setInfoFrom(info.from);
    if (activeContent) {
      setActiveContent(null);
    }
    refreshArticleList(getEntries);
  }, [info]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (["starred", "history"].includes(info.from)) {
      return;
    }
    refreshArticleList(getEntries);
  }, [orderBy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (
      hiddenFeedIds.length === 0 ||
      ["starred", "history"].includes(info.from)
    ) {
      return;
    }
    refreshArticleList(getEntries);
  }, [showAllFeeds]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    refreshArticleList(getEntries);
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
  } = useKeyHandlers(handleEntryClick, entryListRef);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const keyMap = {
      ArrowLeft: () => navigateToPreviousArticle(),
      ArrowRight: () => navigateToNextArticle(),
      Escape: () => exitDetailView(),
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

  const refreshArticleList = async (getEntries) => {
    setOffset(0);
    if (!isAppDataReady) {
      await fetchAppData();
    } else {
      await fetchArticleList(getEntries);
    }
  };

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
          refreshArticleList={() => refreshArticleList(getEntries)}
          markAllAsRead={markAllAsRead}
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
