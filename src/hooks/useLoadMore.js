import { proxy, useSnapshot } from "valtio";
import { configState } from "../store/configState";
import {
  contentState,
  setEntries,
  setLoadMoreUnreadVisible,
  setLoadMoreVisible,
  setOffset,
  setUnreadEntries,
  setUnreadOffset,
} from "../store/contentState";
import { parseFirstImage } from "../utils/images";
import { createSetter } from "../utils/valtio";

const state = proxy({ loadingMore: false });
const setLoadingMore = createSetter(state, "loadingMore");

const useLoadMore = () => {
  const { pageSize } = useSnapshot(configState);
  const {
    entries,
    filterStatus,
    offset,
    total,
    unreadCount,
    unreadEntries,
    unreadOffset,
  } = contentState;

  /* 加载更多 loading*/
  const { loadingMore } = useSnapshot(state);

  const updateEntries = (newEntries) => {
    const uniqueNewEntries = (existingEntries, entriesToAdd) =>
      entriesToAdd.filter(
        (entry) =>
          !existingEntries.some((existing) => existing.id === entry.id),
      );

    if (filterStatus === "all") {
      setEntries((prev) => [...prev, ...uniqueNewEntries(prev, newEntries)]);
      setLoadMoreVisible(entries.length < total);
      setOffset((prev) => prev + pageSize);
    } else {
      setUnreadEntries((prev) => [
        ...prev,
        ...uniqueNewEntries(prev, newEntries),
      ]);
      setLoadMoreUnreadVisible(unreadEntries.length < unreadCount);
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
        response = await getEntries(unreadOffset, filterStatus);
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
