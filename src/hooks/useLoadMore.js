import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import {
  contentState,
  setEntries,
  setOffset,
  setUnreadEntries,
  setUnreadOffset,
} from "../store/contentState";
import { settingsState } from "../store/settingsState";
import { parseFirstImage } from "../utils/images";
import { createSetter } from "../utils/nanostores";

const loadingMoreState = atom(false);
const setLoadingMore = createSetter(loadingMoreState);

const useLoadMore = () => {
  const { filterStatus, offset, unreadOffset } = useStore(contentState);
  const { pageSize } = useStore(settingsState);

  /* 加载更多 loading*/
  const loadingMore = useStore(loadingMoreState);

  const updateEntries = (newEntries) => {
    const uniqueNewEntries = (existingEntries, entriesToAdd) =>
      entriesToAdd.filter(
        (entry) =>
          !existingEntries.some((existing) => existing.id === entry.id),
      );

    if (filterStatus === "all") {
      setEntries((prev) => [...prev, ...uniqueNewEntries(prev, newEntries)]);
      setOffset((prev) => prev + pageSize);
    } else {
      setUnreadEntries((prev) => [
        ...prev,
        ...uniqueNewEntries(prev, newEntries),
      ]);
      setUnreadOffset((prev) => prev + pageSize);
    }
  };

  const handleLoadMore = async (getEntries) => {
    setLoadingMore(true);

    try {
      let response;
      if (filterStatus === "all") {
        response = await getEntries(offset + pageSize);
      } else {
        response = await getEntries(unreadOffset + pageSize, filterStatus);
      }
      if (response?.entries) {
        const newEntries = response.entries.map(parseFirstImage);
        updateEntries(newEntries);
      }
    } catch (error) {
      console.error("Error fetching more articles: ", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return { handleLoadMore, loadingMore };
};

export default useLoadMore;
