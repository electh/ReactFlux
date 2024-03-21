import { useStore } from "../../store/Store";
import EntryContent from "./components/EntryContent";
import { Empty } from "@arco-design/web-react";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function EntryDetail() {
  const isMobile = useStore((state) => state.isMobile);
  const entries = useStore((state) => state.entries);
  const activeEntry = useStore((state) => state.activeEntry);
  const setActiveEntry = useStore((state) => state.setActiveEntry);
  const [params] = useSearchParams();
  const entryId = params.get("entry");
  useEffect(() => {
    setActiveEntry(entries.filter((a) => a.id === parseInt(entryId))[0]);
    console.log(entryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, entries]);
  return (
    <div
      className="entry-detail-container"
      style={{
        flex: 1,
        height: isMobile ? "calc(100% - 48px)" : "100%",
        overflowY: "auto",
        backgroundColor: "var(--color-neutral-2)",
        // transition: "transform 0.2s ease",
        zIndex: 2,
        transform: !isMobile
          ? "translateX(0)"
          : activeEntry
            ? "translateX(0)"
            : "translateX(100%)",
      }}
    >
      {activeEntry ? (
        <EntryContent activeEntry={activeEntry} />
      ) : (
        <Empty
          style={{ top: "40%", position: "relative" }}
          description="No Article Selected"
        />
      )}
    </div>
  );
}
