import { Message, Typography } from "@arco-design/web-react";
import { IconEmpty, IconLeft, IconRight } from "@arco-design/web-react/icon";
import { useCallback, useEffect, useRef, useState } from "react";

import { useStore } from "@nanostores/react";
import { AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { useSwipeable } from "react-swipeable";
import useAppData from "../../hooks/useAppData";
import useArticleList from "../../hooks/useArticleList";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import { polyglotState } from "../../hooks/useLanguage";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import {
  contentState,
  setActiveContent,
  setInfoFrom,
  setOffset,
} from "../../store/contentState";
import { dataState, hiddenFeedIdsState } from "../../store/dataState";
import { duplicateHotkeysState, hotkeysState } from "../../store/hotkeysState";
import { settingsState } from "../../store/settingsState";
import ActionButtons from "../Article/ActionButtons";
import ArticleDetail from "../Article/ArticleDetail";
import ArticleList from "../Article/ArticleList";
import SearchAndSortBar from "../Article/SearchAndSortBar";
import FadeTransition from "../ui/FadeTransition";
import { useContentContext } from "./ContentContext";
import FooterPanel from "./FooterPanel";
import "./Content.css";

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, filterDate, isArticleLoading } =
    useStore(contentState);
  const { isAppDataReady } = useStore(dataState);
  const { orderBy, orderDirection, showHiddenFeeds, showStatus } =
    useStore(settingsState);
  const { polyglot } = useStore(polyglotState);
  const duplicateHotkeys = useStore(duplicateHotkeysState);
  const hiddenFeedIds = useStore(hiddenFeedIdsState);
  const hotkeys = useStore(hotkeysState);

  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const [isSwipingRight, setIsSwipingRight] = useState(false);
  const cardsRef = useRef(null);

  useDocumentTitle();

  const { entryDetailRef, entryListRef, handleEntryClick } =
    useContentContext();

  const {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToNextUnreadArticle,
    navigateToPreviousArticle,
    navigateToPreviousUnreadArticle,
    openLinkExternally,
    openPhotoSlider,
    saveToThirdPartyServices,
    showHotkeysSettings,
    toggleReadStatus,
    toggleStarStatus,
  } = useKeyHandlers();

  const { fetchAppData } = useAppData();
  const { fetchArticleList } = useArticleList(info, getEntries);
  const { isBelowMedium } = useScreenWidth();

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions();

  const hotkeyActions = {
    exitDetailView,
    fetchOriginalArticle: () => fetchOriginalArticle(handleFetchContent),
    navigateToNextArticle: () => navigateToNextArticle(),
    navigateToNextUnreadArticle: () => navigateToNextUnreadArticle(),
    navigateToPreviousArticle: () => navigateToPreviousArticle(),
    navigateToPreviousUnreadArticle: () => navigateToPreviousUnreadArticle(),
    openLinkExternally,
    openPhotoSlider,
    saveToThirdPartyServices: () =>
      saveToThirdPartyServices(handleSaveToThirdPartyServices),
    showHotkeysSettings,
    toggleReadStatus: () =>
      toggleReadStatus(() => handleToggleStatus(activeContent)),
    toggleStarStatus: () =>
      toggleStarStatus(() => handleToggleStarred(activeContent)),
  };

  const removeConflictingKeys = (keys) =>
    keys.filter((key) => !duplicateHotkeys.includes(key));

  for (const [key, action] of Object.entries(hotkeyActions)) {
    useHotkeys(removeConflictingKeys(hotkeys[key]), action);
  }

  const refreshArticleList = async (getEntries) => {
    setOffset(0);
    if (!isAppDataReady) {
      await fetchAppData();
    } else {
      await fetchArticleList(getEntries);
    }
  };

  const handleSwiping = (eventData) => {
    setIsSwipingLeft(eventData.dir === "Left");
    setIsSwipingRight(eventData.dir === "Right");
  };

  const handleSwiped = () => {
    setIsSwipingLeft(false);
    setIsSwipingRight(false);
  };

  const handleSwipeLeft = useCallback(
    () => navigateToNextArticle(),
    [navigateToNextArticle],
  );

  const handleSwipeRight = useCallback(
    () => navigateToPreviousArticle(),
    [navigateToPreviousArticle],
  );

  const handlers = useSwipeable({
    onSwiping: handleSwiping,
    onSwiped: handleSwiped,
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (duplicateHotkeys.length > 0) {
      Message.error(polyglot.t("settings.duplicate_hotkeys"));
    }
  }, [duplicateHotkeys]);

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
  }, [showHiddenFeeds]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    refreshArticleList(getEntries);
  }, [filterDate, orderDirection, showStatus]);

  return (
    <>
      <div
        className="entry-col"
        style={{
          opacity: isBelowMedium && isArticleLoading ? 0 : 1,
        }}
      >
        <SearchAndSortBar />
        <ArticleList
          cardsRef={cardsRef}
          getEntries={getEntries}
          handleEntryClick={handleEntryClick}
          ref={entryListRef}
        />
        <FooterPanel
          info={info}
          refreshArticleList={() => refreshArticleList(getEntries)}
          markAllAsRead={markAllAsRead}
        />
      </div>
      {activeContent ? (
        <div className="article-container content-wrapper" {...handlers}>
          {!isBelowMedium && <ActionButtons />}
          {isArticleLoading ? (
            <div style={{ flex: 1 }} />
          ) : (
            <>
              <AnimatePresence>
                {isSwipingRight && (
                  <FadeTransition
                    key="swipe-hint-left"
                    className="swipe-hint left"
                  >
                    <IconLeft style={{ fontSize: 24 }} />
                  </FadeTransition>
                )}
                {isSwipingLeft && (
                  <FadeTransition
                    key="swipe-hint-right"
                    className="swipe-hint right"
                  >
                    <IconRight style={{ fontSize: 24 }} />
                  </FadeTransition>
                )}
              </AnimatePresence>
              <ArticleDetail ref={entryDetailRef} />
            </>
          )}
          {isBelowMedium && <ActionButtons />}
        </div>
      ) : (
        <div className="content-empty content-wrapper">
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
