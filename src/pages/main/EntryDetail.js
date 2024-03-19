import { useStore } from "../../store/Store";
import EntryContent from "./components/EntryContent";
import { Empty } from "@arco-design/web-react";

export default function EntryDetail() {
  const activeEntry = useStore((state) => state.activeEntry);
  const isMobile = useStore((state) => state.isMobile);
  return (
    <div
      className="entry-detail-container"
      style={{
        flex: 1,
        height: "100%",
        overflowY: "auto",
        // backgroundColor: isMobile ? "var(--color-bg-2)" : "var(--color-fill-1)",
        backgroundColor: "var(--color-neutral-2)",
        transition: "transform 0.2s ease",
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
        <Empty style={{ top: "40%", position: "relative" }} />
      )}
    </div>
  );
}
