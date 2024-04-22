import { useEffect, useState } from "react";

import { useAtom, useAtomValue } from "jotai";
import { configAtom } from "../atoms/configAtom";
import {
  entriesAtom,
  filterStatusAtom,
  filterStringAtom,
  filterTypeAtom,
  filteredEntriesAtom,
  unreadEntriesAtom,
} from "../atoms/contentAtom";
import { hiddenFeedIdsAtom } from "../atoms/dataAtom";
import { filterEntries } from "../utils/filter";

const useFilterEntries = (info) => {
  const config = useAtomValue(configAtom);
  const { showAllFeeds } = config;
  const hiddenFeedIds = useAtomValue(hiddenFeedIdsAtom);

  const [filteredEntries, setFilteredEntries] = useAtom(filteredEntriesAtom);
  const [filterStatus, setFilterStatus] = useAtom(filterStatusAtom);
  const [filterString, setFilterString] = useAtom(filterStringAtom);
  const [filterType, setFilterType] = useAtom(filterTypeAtom);
  const entries = useAtomValue(entriesAtom);
  const unreadEntries = useAtomValue(unreadEntriesAtom);

  const [nextFilter, setNextFilter] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setFilteredEntries(
      filterStatus === "all"
        ? filterEntries(entries, filterType, filterStatus, filterString)
        : filterEntries(unreadEntries, filterType, filterStatus, filterString),
    );
    setNextFilter(true);
  }, [entries, filterStatus, filterString, filterType, unreadEntries]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setFilteredEntries(() => {
      if (["all", "today", "category"].includes(info.from) && !showAllFeeds) {
        const targetEntries = filterStatus === "all" ? entries : unreadEntries;
        setNextFilter(false);
        return targetEntries.filter(
          (entry) => !hiddenFeedIds.includes(entry.feed.id),
        );
      }
      setNextFilter(false);
      return filterStatus === "all" ? entries : unreadEntries;
    });
  }, [nextFilter, hiddenFeedIds, showAllFeeds]);

  return {
    filterStatus,
    filterString,
    filterType,
    filteredEntries,
    setFilterStatus,
    setFilterString,
    setFilterType,
  };
};

export default useFilterEntries;
