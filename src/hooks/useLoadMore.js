import { useState } from "react";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../atoms/configAtom";
import {
  entriesAtom,
  filterStatusAtom,
  filterStringAtom,
  filterTypeAtom,
  filteredEntriesAtom,
  infoFromAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
  offsetAtom,
  totalAtom,
  unreadCountAtom,
  unreadEntriesAtom,
  unreadOffsetAtom,
} from "../atoms/contentAtom";
import { hiddenFeedIdsAtom } from "../atoms/dataAtom";
import { filterEntries, filterEntriesByVisibility } from "../utils/filter";

const useLoadMore = () => {
  const { pageSize, showAllFeeds } = useAtomValue(configAtom);
  const hiddenFeedIds = useAtomValue(hiddenFeedIdsAtom);

  const [entries, setEntries] = useAtom(entriesAtom);
  const [offset, setOffset] = useAtom(offsetAtom);
  const [unreadEntries, setUnreadEntries] = useAtom(unreadEntriesAtom);
  const [unreadOffset, setUnreadOffset] = useAtom(unreadOffsetAtom);
  const filterStatus = useAtomValue(filterStatusAtom);
  const filterString = useAtomValue(filterStringAtom);
  const filterType = useAtomValue(filterTypeAtom);
  const infoFrom = useAtomValue(infoFromAtom);
  const setFilteredEntries = useSetAtom(filteredEntriesAtom);
  const setLoadMoreUnreadVisible = useSetAtom(loadMoreUnreadVisibleAtom);
  const setLoadMoreVisible = useSetAtom(loadMoreVisibleAtom);
  const total = useAtomValue(totalAtom);
  const unreadCount = useAtomValue(unreadCountAtom);

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
    const currentEntries = filterStatus === "all" ? entries : unreadEntries;
    const updatedEntries = new Map([
      ...currentEntries.map((e) => [e.id, e]),
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

  const applyFilters = (updatedEntries) => {
    const filteredEntries = filterString
      ? filterEntries(updatedEntries, filterType, filterStatus, filterString)
      : updatedEntries;

    return filterEntriesByVisibility(
      filteredEntries,
      infoFrom,
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
        const filteredEntries = applyFilters(updatedEntries);
        setFilteredEntries(filteredEntries);
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return { parseFirstImage, handleLoadMore, loadingMore };
};

export default useLoadMore;
