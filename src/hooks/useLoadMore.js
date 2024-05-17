import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../atoms/configAtom";
import {
  entriesAtom,
  filterStatusAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
  unreadEntriesAtom,
} from "../atoms/contentAtom";
import { parseFirstImage } from "../utils/images";

const loadingMoreAtom = atom(false);

const useLoadMore = () => {
  const { pageSize } = useAtomValue(configAtom);

  const [entries, setEntries] = useAtom(entriesAtom);
  const [unreadEntries, setUnreadEntries] = useAtom(unreadEntriesAtom);
  const filterStatus = useAtomValue(filterStatusAtom);
  const setLoadMoreUnreadVisible = useSetAtom(loadMoreUnreadVisibleAtom);
  const setLoadMoreVisible = useSetAtom(loadMoreVisibleAtom);

  /* 加载更多 loading*/
  const [loadingMore, setLoadingMore] = useAtom(loadingMoreAtom);

  const updateEntries = (newEntries) => {
    const currentEntries = filterStatus === "all" ? entries : unreadEntries;
    const updatedEntries = [...currentEntries, ...newEntries];

    if (filterStatus === "all") {
      setEntries(updatedEntries);
      setLoadMoreVisible(newEntries.length === pageSize);
    } else {
      setUnreadEntries(updatedEntries);
      setLoadMoreUnreadVisible(newEntries.length === pageSize);
    }
    return updatedEntries;
  };

  const handleLoadMore = async (info, getEntries) => {
    setLoadingMore(true);

    try {
      let response;
      if (filterStatus === "all") {
        response = await getEntries(null, entries[entries.length - 1].id);
      } else {
        response = await getEntries(
          "unread",
          unreadEntries[unreadEntries.length - 1].id,
        );
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
