import { useContext, useEffect } from "react";

import ContentContext from "../components/Content/ContentContext";
import { filterEntries } from "../utils/Filter";

const useFilterEntries = () => {
  const {
    entries,
    filteredEntries,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterString, filterType, loadMoreUnreadVisible]);

  const handleFilter = (filterType, filterStatus, filterString) => {
    setFilterType(filterType);
    setFilterStatus(filterStatus);
    setFilterString(filterString);
  };

  return { filteredEntries, handleFilter, loadMoreUnreadVisible };
};

export default useFilterEntries;
