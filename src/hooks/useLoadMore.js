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
    const currentEntries = filterStatus === "all" ? entries : unreadEntries;
    const updatedEntries = new Map([
      ...currentEntries.map((e) => [e.id, e]),
      ...newEntries
        .filter((e) => !currentEntries.find((c) => c.id === e.id))
        .map((e) => [e.id, e]),
    ]);
    const result = Array.from(updatedEntries.values());

    if (filterStatus === "all") {
      setEntries(result);
      setLoadMoreVisible(result.length < total);
      setOffset((prev) => prev + pageSize);
    } else {
      setUnreadEntries(result);
      setLoadMoreUnreadVisible(result.length < unreadCount);
      setUnreadOffset((prev) => prev + pageSize);
    }
    return result;
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
