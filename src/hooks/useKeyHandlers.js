import { useEffect, useState } from "react";

import { useSnapshot } from "valtio";
import {
  contentState,
  setActiveContent,
  setIsArticleFocused,
} from "../store/contentState";
import { extractImageSources } from "../utils/images";
import useLoadMore from "./useLoadMore";
import { usePhotoSlider } from "./usePhotoSlider";

const useKeyHandlers = (handleEntryClick) => {
  const {
    activeContent,
    filteredEntries,
    filterStatus,
    loadMoreUnreadVisible,
    loadMoreVisible,
  } = useSnapshot(contentState);

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, setSelectedIndex } =
    usePhotoSlider();

  const { loadingMore } = useLoadMore();

  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoadNext, setShouldLoadNext] = useState(false);
  const [shouldScrollToCard, setShouldScrollToCard] = useState(false);

  useEffect(() => {
    if (shouldLoadNext && !loadingMore) {
      setIsLoading(false);
      setShouldLoadNext(false);
      navigateToNextArticle();
    }
  }, [shouldLoadNext, loadingMore]);

  useEffect(() => {
    if (shouldScrollToCard) {
      const card = document.querySelector(".card-custom-selected-style");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      setShouldScrollToCard(false);
    }
  }, [shouldScrollToCard]);

  const exitDetailView = (entryListRef, entryDetailRef) => {
    if (!activeContent) {
      return;
    }
    setActiveContent(null);
    if (entryListRef.current) {
      entryListRef.current.setAttribute("tabIndex", "-1");
      entryListRef.current.focus();
    }
    entryDetailRef.current?.scrollTo(0, 0);
  };

  const navigateToPreviousArticle = (unread = false) => {
    const currentIndex = filteredEntries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );

    if (currentIndex > 0) {
      const prevEntry = unread
        ? filteredEntries
            .slice(0, currentIndex)
            .toReversed()
            .find((entry) => entry.status === "unread")
        : filteredEntries[currentIndex - 1];

      if (prevEntry) {
        handleEntryClick(prevEntry).then(() => setShouldScrollToCard(true));
      }
    }
  };

  const navigateToNextArticle = (unread = false) => {
    if (isLoading) {
      return;
    }

    const currentIndex = filteredEntries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );
    const isLastEntry = currentIndex === filteredEntries.length - 1;

    if (
      isLastEntry &&
      ((filterStatus === "all" && loadMoreVisible) || loadMoreUnreadVisible)
    ) {
      setIsLoading(true);
      setShouldLoadNext(true);
      return;
    }

    if (currentIndex === -1) {
      document.querySelector(".entry-list")?.scrollTo(0, 0);
      return;
    }

    const nextEntry = unread
      ? filteredEntries
          .slice(currentIndex + 1)
          .find((entry) => entry.status === "unread")
      : filteredEntries[currentIndex + 1];

    if (nextEntry) {
      handleEntryClick(nextEntry).then(() => setShouldScrollToCard(true));
      setShouldLoadNext(false);
    }
  };

  const openLinkExternally = () => {
    if (activeContent) {
      window.open(activeContent.url, "_blank");
    }
  };

  const fetchOriginalArticle = (handleFetchContent) => {
    if (activeContent) {
      handleFetchContent();
    }
  };

  const toggleReadStatus = (handleUpdateEntry) => {
    if (activeContent) {
      handleUpdateEntry();
    }
  };

  const toggleStarStatus = (handleStarEntry) => {
    if (activeContent) {
      handleStarEntry();
    }
  };

  const openPhotoSlider = () => {
    if (!activeContent) {
      return;
    }

    const imageSources = extractImageSources(activeContent.content);
    if (!imageSources.length || isPhotoSliderVisible) {
      return;
    }

    setSelectedIndex(0);
    setIsPhotoSliderVisible(true);
    setIsArticleFocused(false);
  };

  return {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToPreviousArticle,
    openLinkExternally,
    openPhotoSlider,
    toggleReadStatus,
    toggleStarStatus,
  };
};

export default useKeyHandlers;
