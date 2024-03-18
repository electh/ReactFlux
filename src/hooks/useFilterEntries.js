import { useContext, useEffect } from "react";

import ContentContext from "../components/Content/ContentContext";
import { filterEntries } from "../utils/Filter";

const useFilterEntries = () => {
  const {
    allEntries,
    entries,
    filterStatus,
    filterString,
    filterType,
    loadMoreUnreadVisible,
    setEntries,
    setFilterStatus,
    setFilterString,
    setFilterType,
    setLoadMoreUnreadVisible,
    unreadTotal,
  } = useContext(ContentContext);

  useEffect(() => {
    setEntries([]);
    const filteredArticles = filterEntries(
      allEntries,
      filterType,
      filterStatus,
      filterString,
    );
    setEntries(filteredArticles);

    if (filterStatus === "unread") {
      const unreadArticles = allEntries.filter(
        (entry) => entry.status === "unread",
      );
      setLoadMoreUnreadVisible(unreadArticles.length < unreadTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterString, filterType]);

  const handleFilter = (filterType, filterStatus, filterString) => {
    setFilterType(filterType);
    setFilterStatus(filterStatus);
    setFilterString(filterString);
  };

  return { entries, handleFilter, loadMoreUnreadVisible };
};

export default useFilterEntries;
