import { useStore } from "../Store";
import EntryContent from "./components/EntryContent";
import { Empty } from "@arco-design/web-react";

export default function EntryDetail() {
  const activeEntry = useStore((state) => state.activeEntry);
  return (
    <div
      className="entry-detail-container"
      style={{
        flex: 1,
        height: "100%",
        overflowY: "auto",
        backgroundColor: "var(--color-fill-1)",
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
