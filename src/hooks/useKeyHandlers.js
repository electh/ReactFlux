import { useEffect, useState } from "react";

import { useStore } from "@nanostores/react";
import { useContentContext } from "../components/Content/ContentContext";
import {
  activeEntryIndexState,
  contentState,
  filteredEntriesState,
  setActiveContent,
} from "../store/contentState";
import { extractImageSources } from "../utils/images";
import useLoadMore from "./useLoadMore";
import { usePhotoSlider } from "./usePhotoSlider";

const useKeyHandlers = () => {
  const { activeContent, loadMoreVisible } = useStore(contentState);
  const activeEntryIndex = useStore(activeEntryIndexState);
  const filteredEntries = useStore(filteredEntriesState);

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, setSelectedIndex } =
    usePhotoSlider();

  const { loadingMore } = useLoadMore();

  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoadNext, setShouldLoadNext] = useState(false);

  const { entryListRef, handleEntryClick } = useContentContext();

  useEffect(() => {
    if (shouldLoadNext && !loadingMore) {
      setIsLoading(false);
      setShouldLoadNext(false);
      navigateToNextArticle();
    }
  }, [loadingMore, shouldLoadNext]);

  const scrollSelectedCardIntoView = () => {
    if (entryListRef.current) {
      const selectedCard = entryListRef.current.el.querySelector(
        ".card-custom-selected-style",
      );
      if (selectedCard) {
        selectedCard.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  };

  const withActiveContent =
    (fn) =>
    (...args) => {
      if (activeContent) {
        return fn(...args);
      }
    };

  const exitDetailView = withActiveContent(() => {
    setActiveContent(null);
    if (entryListRef.current) {
      entryListRef.current.contentWrapperEl.focus();
    }
  });

  const findAdjacentEntry = (currentIndex, direction, unread, entries) => {
    const slice =
      direction === "prev"
        ? entries.slice(0, currentIndex).toReversed()
        : entries.slice(currentIndex + 1);

    return unread
      ? slice.find((entry) => entry.status === "unread")
      : entries[currentIndex + (direction === "prev" ? -1 : 1)];
  };

  const navigateToPreviousArticle = (unread = false) => {
    if (activeEntryIndex > 0) {
      const prevEntry = findAdjacentEntry(
        activeEntryIndex,
        "prev",
        unread,
        filteredEntries,
      );
      if (prevEntry) {
        handleEntryClick(prevEntry);
        setTimeout(() => scrollSelectedCardIntoView(), 200);
      }
    }
  };

  const navigateToNextArticle = (unread = false) => {
    if (isLoading) {
      return;
    }

    const isLastEntry = activeEntryIndex === filteredEntries.length - 1;

    if (isLastEntry && loadMoreVisible) {
      setIsLoading(true);
      setShouldLoadNext(true);
      return;
    }

    if (activeEntryIndex === -1) {
      entryListRef.current.contentWrapperEl.scrollTo({ top: 0 });
      return;
    }

    const nextEntry = findAdjacentEntry(
      activeEntryIndex,
      "next",
      unread,
      filteredEntries,
    );
    if (nextEntry) {
      handleEntryClick(nextEntry);
      setTimeout(() => scrollSelectedCardIntoView(), 200);
      setShouldLoadNext(false);
    }
  };

  const openLinkExternally = withActiveContent(() => {
    window.open(activeContent.url, "_blank");
  });

  const fetchOriginalArticle = withActiveContent((handleFetchContent) => {
    handleFetchContent();
  });

  const saveToThirdPartyServices = withActiveContent(
    (handleSaveToThirdPartyServices) => {
      handleSaveToThirdPartyServices();
    },
  );

  const toggleReadStatus = withActiveContent((handleUpdateEntry) => {
    handleUpdateEntry();
  });

  const toggleStarStatus = withActiveContent((handleStarEntry) => {
    handleStarEntry();
  });

  const openPhotoSlider = withActiveContent(() => {
    const imageSources = extractImageSources(activeContent.content);
    if (!imageSources.length || isPhotoSliderVisible) {
      return;
    }

    setSelectedIndex(0);
    setIsPhotoSliderVisible(true);
  });

  return {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToPreviousArticle,
    openLinkExternally,
    openPhotoSlider,
    saveToThirdPartyServices,
    toggleReadStatus,
    toggleStarStatus,
  };
};

export default useKeyHandlers;
