import { Message, Typography } from "@arco-design/web-react";
import { IconEmpty } from "@arco-design/web-react/icon";
import { useCallback, useEffect, useRef } from "react";

import { useStore } from "@nanostores/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useSwipeable } from "react-swipeable";
import useAppData from "../../hooks/useAppData";
import useArticleList from "../../hooks/useArticleList";
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
import { useContentContext } from "./ContentContext";
import FooterPanel from "./FooterPanel";
import "./Content.css";

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, filterDate, isArticleLoading } =
    useStore(contentState);
  const { isAppDataReady } = useStore(dataState);
  const { orderBy, orderDirection, showAllFeeds, showStatus } =
    useStore(settingsState);
  const { polyglot } = useStore(polyglotState);
  const duplicateHotkeys = useStore(duplicateHotkeysState);
  const hiddenFeedIds = useStore(hiddenFeedIdsState);
  const hotkeys = useStore(hotkeysState);

  const cardsRef = useRef(null);

  const { entryDetailRef, entryListRef, handleEntryClick, isSwipingCodeBlock } =
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

  const handleSwipeLeft = useCallback(() => {
    if (!isSwipingCodeBlock) {
      navigateToNextArticle();
    }
  }, [isSwipingCodeBlock, navigateToNextArticle]);

  const handleSwipeRight = useCallback(() => {
    if (!isSwipingCodeBlock) {
      navigateToPreviousArticle();
    }
  }, [isSwipingCodeBlock, navigateToPreviousArticle]);

  const handlers = useSwipeable({
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
  }, [showAllFeeds]);

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
        <div className="article-container" {...handlers}>
          {!isArticleLoading && <ArticleDetail ref={entryDetailRef} />}
          <ActionButtons />
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
