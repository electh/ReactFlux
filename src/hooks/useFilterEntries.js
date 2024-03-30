import { useContext, useEffect } from "react";

import ContentContext from "../components/Content/ContentContext";
import { filterEntries } from "../utils/filter";

const useFilterEntries = () => {
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
    setFilteredEntries(filteredArticles);
  }, [filterStatus, filterString, filterType]);

  return { setFilterStatus, setFilterString, setFilterType };
};

export default useFilterEntries;
