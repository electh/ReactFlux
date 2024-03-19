import EntryList from "../pages/main/EntryList";
import EntryDetail from "../pages/main/EntryDetail";
import { useStore } from "../store/Store";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Content() {
  const entries = useStore((state) => state.entries);
  const filterString = useStore((state) => state.filterString);
  const searchType = useStore((state) => state.searchType);
  const unreadOnly = useStore((state) => state.unreadOnly);
  const loading = useStore((state) => state.loading);
  const [params] = useSearchParams();
  const from = params.get("from") || "all";
  const id = params.get("id") || "";

  const [pushEntries, setPushEntries] = useState([]);

  useEffect(() => {
    const unFilteredEntries =
      from === "all"
        ? entries
        : from === "starred"
          ? entries.filter((a) => a.starred === true)
          : from === "feed"
            ? entries.filter((a) => a.feed.id === parseInt(id))
            : entries.filter((a) => a.feed.category.id === parseInt(id));

    setPushEntries(
      unFilteredEntries.filter(
        (a) =>
          a[searchType].includes(filterString) &&
          (unreadOnly ? a.status === "unread" : true),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, filterString, searchType, unreadOnly, from, id]);

  return (
    <div
      className="inner-content"
      style={{
        display: "flex",
        height: "calc(100% - 48px)",
        backgroundColor: "var(--color-bg-3)",
      }}
    >
      <EntryList entries={pushEntries} info={`${from}${id}`} />
      <EntryDetail />
    </div>
  );
}
