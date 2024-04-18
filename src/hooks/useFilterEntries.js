import { useContext, useEffect } from "react";

import { useAtomValue } from "jotai";
import { configAtom } from "../atoms/configAtom";
import { hiddenFeedIdsAtom } from "../atoms/dataAtom";
import ContentContext from "../components/Content/ContentContext";
import { filterEntries, filterEntriesByVisibility } from "../utils/filter";

const useFilterEntries = (info) => {
  const config = useAtomValue(configAtom);
  const { showAllFeeds } = config;
  const hiddenFeedIds = useAtomValue(hiddenFeedIdsAtom);

  const {
    entries,
    filterStatus,
    filterString,
    filterType,
    setFilteredEntries,
    setFilterStatus,
    setFilterString,
    setFilterType,
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
