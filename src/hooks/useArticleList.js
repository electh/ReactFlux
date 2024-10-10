import { useStore } from "@nanostores/react";
import { useEffect, useRef } from "react";
import {
  setEntries,
  setIsArticleFocused,
  setIsArticleListReady,
  setLoadMoreVisible,
  setTotal,
} from "../store/contentState";
import {
  dataState,
  setHistoryCount,
  setStarredCount,
  setUnreadInfo,
  setUnreadTodayCount,
} from "../store/dataState";
import { settingsState } from "../store/settingsState";
import { parseFirstImage } from "../utils/images";

const handleResponses = (response) => {
  if (response?.total >= 0) {
    const articles = response.entries.map(parseFirstImage);
    setEntries(articles);
    setTotal(response.total);
    setLoadMoreVisible(articles.length < response.total);
  }
};

const useArticleList = (info, getEntries) => {
  const { isAppDataReady } = useStore(dataState);
  const { showStatus } = useStore(settingsState);

  const isLoading = useRef(false);

  const fetchArticleList = async (getEntries) => {
    if (isLoading.current) {
      return;
    }

    isLoading.current = true;
    setIsArticleListReady(false);

    try {
      const response =
        showStatus === "unread"
          ? await getEntries(0, "unread")
          : await getEntries();

      switch (info.from) {
        case "feed":
          if (showStatus === "unread") {
            setUnreadInfo((prev) => ({
              ...prev,
              [Number(info.id)]: response.total,
            }));
          }
          break;
        case "history":
          setHistoryCount(response.total);
          break;
        case "starred":
          if (showStatus !== "unread") {
            setStarredCount(response.total);
          }
          break;
        case "today":
          if (showStatus === "unread") {
            setUnreadTodayCount(response.total);
          }
          break;
      }

      setIsArticleListReady(true);
      setIsArticleFocused(true);
      handleResponses(response);
    } catch (error) {
      console.error("Error fetching articles: ", error);
      setIsArticleFocused(false);
    } finally {
      isLoading.current = false;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isAppDataReady) {
      fetchArticleList(getEntries);
    }
  }, [isAppDataReady]);

  return { fetchArticleList };
};

export default useArticleList;
