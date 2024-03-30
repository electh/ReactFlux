import { useContext, useEffect } from "react";

import ContentContext from "../components/Content/ContentContext";
import { filterEntries } from "../utils/filter";

const useFilterEntries = () => {
  const {
    entries,
    filterStatus,
    filterString,
    filterType,
    loadMoreUnreadVisible,
    setFilteredEntries,
    setFilterStatus,
    setFilterString,
    setFilterType,
    setLoadMoreUnreadVisible,
    unreadCount,
  } = useContext(ContentContext);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setFilteredEntries([]);
    const filteredArticles = filterEntries(
      entries,
      filterType,
      filterStatus,
      filterString,
    );
    setFilteredEntries(filteredArticles);

    if (filterStatus === "unread") {
      const unreadArticles = entries.filter(
        (entry) => entry.status === "unread",
      );
      setLoadMoreUnreadVisible(unreadArticles.length < unreadCount);
    }
  }, [filterStatus, filterString, filterType, loadMoreUnreadVisible]);

  return { setFilterStatus, setFilterString, setFilterType };
};

export default useFilterEntries;
