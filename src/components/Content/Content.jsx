import { Message, Typography } from "@arco-design/web-react";
import { IconEmpty } from "@arco-design/web-react/icon";
import { useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

import { useStore } from "@nanostores/react";
import { useHotkeys } from "react-hotkeys-hook";
import { updateEntriesStatus } from "../../apis";
import useAppData from "../../hooks/useAppData";
import useArticleList from "../../hooks/useArticleList";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import { polyglotState } from "../../hooks/useLanguage";
import {
  contentState,
  setActiveContent,
  setInfoFrom,
  setOffset,
} from "../../store/contentState";
import { dataState, hiddenFeedIdsState } from "../../store/dataState";
import { hotkeysState } from "../../store/hotkeysState";
import { settingsState } from "../../store/settingsState";
import ActionButtons from "../Article/ActionButtons";
import ArticleDetail from "../Article/ArticleDetail";
import ArticleList from "../Article/ArticleList";
import FooterPanel from "./FooterPanel";
import "./Content.css";
import "./Transition.css";

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, isArticleListReady } = useStore(contentState);
  const { isAppDataReady } = useStore(dataState);
  const { orderBy, orderDirection, showAllFeeds, showStatus } =
    useStore(settingsState);
  const { polyglot } = useStore(polyglotState);
  const hiddenFeedIds = useStore(hiddenFeedIdsState);
  const hotkeys = useStore(hotkeysState);

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
    handleEntryStatusUpdate,
  } = useEntryActions();

  const { fetchAppData } = useAppData();
  const { fetchArticleList } = useArticleList(info, getEntries);

  const [isArticleLoading, setIsArticleLoading] = useState(false);

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
    setIsArticleLoading(true);

    setActiveContent({ ...entry, status: "read" });
    setTimeout(() => {
      const articleContent = entryDetailRef.current;
      if (articleContent) {
        const contentWrapper = articleContent.querySelector(
          ".simplebar-content-wrapper",
        );
        if (contentWrapper) {
          contentWrapper.scroll({ top: 0 });
        }
        articleContent.focus();
      }

      setIsArticleLoading(false);
      if (entry.status === "unread") {
        handleEntryStatusUpdate(entry, "read");
        updateEntriesStatus([entry.id], "read").catch(() => {
          Message.error(polyglot.t("content.mark_as_read_error"));
          setActiveContent({ ...entry, status: "unread" });
          handleEntryStatusUpdate(entry, "unread");
        });
      }
    }, 200);
  };

  const {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToPreviousArticle,
    openLinkExternally,
    openPhotoSlider,
    saveToThirdPartyServices,
    toggleReadStatus,
    toggleStarStatus,
  } = useKeyHandlers(handleEntryClick, entryListRef);

  useHotkeys(hotkeys.exitDetailView, () => exitDetailView());
  useHotkeys(hotkeys.fetchOriginalArticle, () =>
    fetchOriginalArticle(handleFetchContent),
  );
  useHotkeys(hotkeys.navigateToNextArticle, () => navigateToNextArticle());
  useHotkeys(hotkeys.navigateToNextUnreadArticle, () =>
    navigateToNextArticle(true),
  );
  useHotkeys(hotkeys.navigateToPreviousArticle, () =>
    navigateToPreviousArticle(),
  );
  useHotkeys(hotkeys.navigateToPreviousUnreadArticle, () =>
    navigateToPreviousArticle(true),
  );
  useHotkeys(hotkeys.openLinkExternally, () => openLinkExternally());
  useHotkeys(hotkeys.openPhotoSlider, () => openPhotoSlider());
  useHotkeys(hotkeys.saveToThirdPartyServices, () =>
    saveToThirdPartyServices(handleSaveToThirdPartyServices),
  );
  useHotkeys(hotkeys.toggleReadStatus, () =>
    toggleReadStatus(() => handleToggleStatus(activeContent)),
  );
  useHotkeys(hotkeys.toggleStarStatus, () =>
    toggleStarStatus(() => handleToggleStarred(activeContent)),
  );

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
      {activeContent ? (
        <div className="article-container">
          <CSSTransition
            in={!isArticleLoading}
            timeout={200}
            nodeRef={entryDetailRef}
            classNames="fade"
            unmountOnExit
          >
            <ArticleDetail ref={entryDetailRef} />
          </CSSTransition>
          <CSSTransition in={!isArticleLoading} timeout={200} unmountOnExit>
            <ActionButtons
              handleEntryClick={handleEntryClick}
              entryListRef={entryListRef}
            />
          </CSSTransition>
        </div>
      ) : (
        <div className="content-empty">
          <IconEmpty style={{ fontSize: "64px" }} />
          <Typography.Title
            heading={6}
            style={{ color: "var(--color-text-3)", marginTop: "10px" }}
          >
            ReactFlux
          </Typography.Title>
        </div>
      )}
    </>
  );
};

export default Content;
