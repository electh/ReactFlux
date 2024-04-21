import { useEffect } from "react";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../atoms/configAtom";
import {
  entriesAtom,
  filterStatusAtom,
  filterStringAtom,
  filterTypeAtom,
  filteredEntriesAtom,
} from "../atoms/contentAtom";
import { hiddenFeedIdsAtom } from "../atoms/dataAtom";
import { filterEntries, filterEntriesByVisibility } from "../utils/filter";

const useFilterEntries = (info) => {
  const config = useAtomValue(configAtom);
  const { showAllFeeds } = config;
  const hiddenFeedIds = useAtomValue(hiddenFeedIdsAtom);

  const [filterStatus, setFilterStatus] = useAtom(filterStatusAtom);
  const [filterString, setFilterString] = useAtom(filterStringAtom);
  const [filterType, setFilterType] = useAtom(filterTypeAtom);
  const entries = useAtomValue(entriesAtom);
  const setFilteredEntries = useSetAtom(filteredEntriesAtom);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setFilteredEntries([]);
    const filteredArticles = filterEntries(
      entries,
      filterType,
      filterStatus,
      filterString,
    );
    setFilteredEntries(
      filterEntriesByVisibility(
        filteredArticles,
        info,
        showAllFeeds,
        hiddenFeedIds,
      ),
    );
  }, [filterStatus, filterString, filterType]);

  return { setFilterStatus, setFilterString, setFilterType };
};

export default useFilterEntries;
