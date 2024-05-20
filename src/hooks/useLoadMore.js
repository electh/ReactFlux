import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../atoms/configAtom";
import {
  entriesAtom,
  filterStatusAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
  offsetAtom,
  totalAtom,
  unreadCountAtom,
  unreadEntriesAtom,
  unreadOffsetAtom,
} from "../atoms/contentAtom";
import { parseFirstImage } from "../utils/images";

const loadingMoreAtom = atom(false);

const useLoadMore = () => {
  const { pageSize } = useAtomValue(configAtom);

  const [entries, setEntries] = useAtom(entriesAtom);
  const [offset, setOffset] = useAtom(offsetAtom);
  const [unreadEntries, setUnreadEntries] = useAtom(unreadEntriesAtom);
  const [unreadOffset, setUnreadOffset] = useAtom(unreadOffsetAtom);
  const filterStatus = useAtomValue(filterStatusAtom);
  const setLoadMoreUnreadVisible = useSetAtom(loadMoreUnreadVisibleAtom);
  const setLoadMoreVisible = useSetAtom(loadMoreVisibleAtom);
  const total = useAtomValue(totalAtom);
  const unreadCount = useAtomValue(unreadCountAtom);

  /* 加载更多 loading*/
  const [loadingMore, setLoadingMore] = useAtom(loadingMoreAtom);

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
      if (response?.data?.entries) {
        const newEntries = response.data.entries.map(parseFirstImage);
        updateEntries(newEntries);
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return { handleLoadMore, loadingMore };
};

export default useLoadMore;
