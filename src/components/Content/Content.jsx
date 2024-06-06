import { Message } from "@arco-design/web-react";
import { useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { updateEntriesStatus } from "../../apis";
import { configAtom } from "../../atoms/configAtom";
import {
  entriesAtom,
  filteredEntriesAtom,
  infoFromAtom,
  isArticleFocusedAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
  loadingAtom,
  offsetAtom,
  totalAtom,
  unreadCountAtom,
  unreadEntriesAtom,
  unreadOffsetAtom,
} from "../../atoms/contentAtom";
import { isAppDataReadyAtom } from "../../atoms/dataAtom";
import { useActiveContent } from "../../hooks/useActiveContent";
import useEntryActions from "../../hooks/useEntryActions";
import { useFetchData } from "../../hooks/useFetchData";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import { parseFirstImage } from "../../utils/images";
import ArticleDetail from "../Article/ArticleDetail";
import ArticleList from "../Article/ArticleList";
import "./Content.css";
import FooterPanel from "./FooterPanel";
import "./Transition.css";

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, setActiveContent } = useActiveContent();

  const isAppDataReady = useAtomValue(isAppDataReadyAtom);
  const { fetchData } = useFetchData();
  const config = useAtomValue(configAtom);
  const { orderBy, orderDirection } = config;

  const [isArticleFocused, setIsArticleFocused] = useAtom(isArticleFocusedAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const setEntries = useSetAtom(entriesAtom);
  const setLoadMoreUnreadVisible = useSetAtom(loadMoreUnreadVisibleAtom);
  const setLoadMoreVisible = useSetAtom(loadMoreVisibleAtom);
  const setOffset = useSetAtom(offsetAtom);
  const setTotal = useSetAtom(totalAtom);
  const setUnreadCount = useSetAtom(unreadCountAtom);
  const setUnreadEntries = useSetAtom(unreadEntriesAtom);
  const setUnreadOffset = useSetAtom(unreadOffsetAtom);
  const filteredEntries = useAtomValue(filteredEntriesAtom);
  const setInfoFrom = useSetAtom(infoFromAtom);

  const {
    handleFetchContent,
    handleToggleStarred,
    handleToggleStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const [isFirstRenderCompleted, setIsFirstRenderCompleted] = useState(false);

  const entryListRef = useRef(null);
  const cardsRef = useRef(null);

  // 文章详情页的引用
  const entryDetailRef = useRef(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!isFirstRenderCompleted || info.from === "history") {
      return;
    }
    refreshArticleList();
  }, [orderBy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setInfoFrom(info.from);
    refreshArticleList();
  }, [info, orderDirection]);

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
    handleVKey,
  } = useKeyHandlers(handleEntryClick);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const keyMap = {
      Escape: () => handleEscapeKey(entryListRef, entryDetailRef),
      ArrowLeft: () => handleLeftKey(),
      ArrowRight: () => handleRightKey(),
      b: () => handleBKey(),
      d: () => handleDKey(handleFetchContent),
      m: () => handleMKey(() => handleToggleStatus(activeContent)),
      s: () => handleSKey(() => handleToggleStarred(activeContent)),
      v: () => handleVKey(),
    };

    const handleKeyDown = (event) => {
      const handler = keyMap[event.key];
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
    let responseAll;
    let responseUnread;
    try {
      if (info.from === "history") {
        responseAll = responseUnread = await getEntries();
      } else {
        [responseAll, responseUnread] = await Promise.all([
          getEntries(),
          getEntries(0, "unread"),
        ]);
      }
      handleResponses(responseAll, responseUnread);
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
      fetchData();
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
    if (!isAppDataReady) {
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
