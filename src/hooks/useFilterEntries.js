import { useContext, useEffect } from "react";

import useStore from "../Store";
import ContentContext from "../components/Content/ContentContext";
import { filterEntries, filterEntriesByVisibility } from "../utils/filter";

const useFilterEntries = (info) => {
  const showAllFeeds = useStore((state) => state.showAllFeeds);
  const hiddenFeedIds = useStore((state) => state.hiddenFeedIds);

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
