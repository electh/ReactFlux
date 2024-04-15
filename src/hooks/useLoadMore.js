import { useContext, useState } from "react";

import useStore from "../Store";
import ContentContext from "../components/Content/ContentContext";
import { filterEntries, filterEntriesByVisibility } from "../utils/filter";
import { useConfigAtom } from "./useConfigAtom";

const useLoadMore = () => {
  const { config } = useConfigAtom();
  const { pageSize, showAllFeeds } = config;
  const hiddenFeedIds = useStore((state) => state.hiddenFeedIds);

  const {
    entries,
    filterStatus,
    filterString,
    filterType,
    offset,
    setEntries,
    setFilteredEntries,
    setLoadMoreUnreadVisible,
    setLoadMoreVisible,
    setOffset,
    setUnreadEntries,
    setUnreadOffset,
    total,
    unreadCount,
    unreadEntries,
    unreadOffset,
  } = useContext(ContentContext);

  /* 加载更多 loading*/
  const [loadingMore, setLoadingMore] = useState(false);

  const parseFirstImage = (entry) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content, "text/html");
    const imgSrc = doc.querySelector("img")?.getAttribute("src");
    return { ...entry, imgSrc };
  };

  const updateOffset = () => {
    if (filterStatus === "all") {
      setOffset((prev) => prev + pageSize);
    } else {
      setUnreadOffset((prev) => prev + pageSize);
    }
  };

  const updateEntries = (newEntries) => {
    const updatedEntries = new Map([
      ...(filterStatus === "all" ? entries : unreadEntries).map((e) => [
        e.id,
        e,
      ]),
      ...newEntries.map((e) => [e.id, e]),
    ]);
    const result = Array.from(updatedEntries.values());

    if (filterStatus === "all") {
      setEntries(result);
      setLoadMoreVisible(result.length < total);
    } else {
      setUnreadEntries(result);
      setLoadMoreUnreadVisible(result.length < unreadCount);
    }
    return result;
  };

  const applyFilters = (updatedEntries, info) => {
    const filteredEntries = filterString
      ? filterEntries(updatedEntries, filterType, filterStatus, filterString)
      : updatedEntries;

    return filterEntriesByVisibility(
      filteredEntries,
      info,
      showAllFeeds,
      hiddenFeedIds,
    );
  };

  const handleLoadMore = async (info, getEntries) => {
    setLoadingMore(true);

    try {
      let response;
      if (filterStatus === "all") {
        response = await getEntries(offset + pageSize);
      } else {
        response = await getEntries(unreadOffset + pageSize, filterStatus);
      }
      if (response?.data?.entries) {
        updateOffset();
        const newEntries = response.data.entries.map(parseFirstImage);
        const updatedEntries = updateEntries(newEntries);
        const filteredEntries = applyFilters(updatedEntries, info);
        setFilteredEntries(filteredEntries);
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    }

    setLoadingMore(false);
  };

  return { parseFirstImage, handleLoadMore, loadingMore };
};

export default useLoadMore;
