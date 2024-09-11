import { useStore } from "@nanostores/react";
import { useEffect, useRef } from "react";
import {
  setEntries,
  setIsArticleFocused,
  setIsArticleListReady,
  setTotal,
} from "../store/contentState";
import { dataState } from "../store/dataState";
import { settingsState } from "../store/settingsState";
import { parseFirstImage } from "../utils/images";

const handleResponses = (response) => {
  if (response?.total >= 0) {
    const articles = response.entries.map(parseFirstImage);
    setEntries(articles);
    setTotal(response.total);
  }
};

const useArticleList = (getEntries) => {
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
