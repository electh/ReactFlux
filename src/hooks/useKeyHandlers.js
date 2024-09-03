import { useEffect, useState } from "react";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  activeContentAtom,
  filterStatusAtom,
  filteredEntriesAtom,
  isArticleFocusedAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
} from "../atoms/contentAtom";
import { extractImageSources } from "../utils/images";
import useLoadMore from "./useLoadMore";
import { usePhotoSlider } from "./usePhotoSlider";

const useKeyHandlers = (handleEntryClick) => {
  const filteredEntries = useAtomValue(filteredEntriesAtom);
  const filterStatus = useAtomValue(filterStatusAtom);
  const loadMoreUnreadVisible = useAtomValue(loadMoreUnreadVisibleAtom);
  const loadMoreVisible = useAtomValue(loadMoreVisibleAtom);

  const setIsArticleFocused = useSetAtom(isArticleFocusedAtom);

  const [activeContent, setActiveContent] = useAtom(activeContentAtom);
  const { isPhotoSliderVisible, setIsPhotoSliderVisible, setSelectedIndex } =
    usePhotoSlider();

  const { loadingMore } = useLoadMore();

  const [isLoading, setIsLoading] = useState(false);
  const [checkNext, setCheckNext] = useState(false);
  const [scrollToCard, setScrollToCard] = useState(false);

  useEffect(() => {
    if (checkNext && !loadingMore) {
      setIsLoading(false);
      setCheckNext(false);
      navigateToNextArticle();
    }
  }, [checkNext, loadingMore]);

  useEffect(() => {
    if (scrollToCard) {
      const card = document.querySelector(".card-custom-selected-style");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      setScrollToCard(false);
    }
  }, [scrollToCard]);

  const exitDetailView = (entryListRef, entryDetailRef) => {
    if (!activeContent) {
      return;
    }
    setActiveContent(null);
    if (entryListRef.current) {
      entryListRef.current.setAttribute("tabIndex", "-1");
      entryListRef.current.focus();
    }
    if (entryDetailRef.current) {
      entryDetailRef.current.scrollTo(0, 0);
    }
  };

  const navigateToPreviousArticle = (unread = false) => {
    const currentIndex = filteredEntries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );

    if (currentIndex > 0) {
      let prevEntry;
      if (unread) {
        prevEntry = filteredEntries
          .slice(0, currentIndex)
          .toReversed()
          .find((entry) => entry.status === "unread");
      } else {
        prevEntry = filteredEntries[currentIndex - 1];
      }
      if (prevEntry) {
        handleEntryClick(prevEntry).then(() => {
          setScrollToCard(true);
        });
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
      setCheckNext(true);
      return;
    }

    if (currentIndex === -1) {
      const entryList = document.querySelector(".entry-list");
      if (entryList) {
        entryList.scrollTo(0, 0);
      }
    }

    if (currentIndex < filteredEntries.length - 1) {
      let nextEntry;
      if (unread) {
        nextEntry = filteredEntries
          .slice(currentIndex + 1)
          .find((entry) => entry.status === "unread");
      } else {
        nextEntry = filteredEntries[currentIndex + 1];
      }
      if (nextEntry) {
        handleEntryClick(nextEntry).then(() => {
          setScrollToCard(true);
        });
        setCheckNext(false);
      }
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
    if (activeContent) {
      const imageSources = extractImageSources(activeContent.content);
      if (imageSources.length === 0) {
        return;
      }
      if (!isPhotoSliderVisible) {
        setSelectedIndex(0);
        setIsPhotoSliderVisible(true);
        setIsArticleFocused(false);
      }
    }
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
