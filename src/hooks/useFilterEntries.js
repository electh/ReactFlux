import { useContext, useEffect } from "react";

import { ContentContext } from "../components/ContentContext";

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
    let filteredArticles;

    if (filterType === "0") {
      filteredArticles =
        filterStatus === "all"
          ? allEntries.filter((entry) => entry.title.includes(filterString))
          : allEntries.filter(
              (entry) =>
                entry.title.includes(filterString) &&
                entry.status === filterStatus,
            );
      setEntries(filteredArticles);
    } else {
      filteredArticles =
        filterStatus === "all"
          ? allEntries.filter((entry) => entry.content.includes(filterString))
          : allEntries.filter(
              (entry) =>
                entry.content.includes(filterString) &&
                entry.status === filterStatus,
            );
    }
    setEntries(filteredArticles);

    if (filterStatus === "unread") {
      const unreadArticles = allEntries.filter(
        (entry) => entry.status === "unread",
      );
      setLoadMoreUnreadVisible(unreadArticles.length < unreadTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filterStatus,
    filterString,
    filterType,
    setEntries,
    setLoadMoreUnreadVisible,
  ]);

  const handleFilter = (filterType, filterStatus, filterString) => {
    setFilterType(filterType);
    setFilterStatus(filterStatus);
    setFilterString(filterString);
  };

  return { entries, handleFilter, loadMoreUnreadVisible };
};

export default useFilterEntries;
