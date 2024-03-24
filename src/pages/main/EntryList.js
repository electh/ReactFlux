import EntryCard from "./components/EntryCard";
import SearchBar from "./components/SearchBar";
import BottomBar from "./components/BottomBar";
import { useEffect, useRef } from "react";
import { Button, Spin } from "@arco-design/web-react";
import { IconArrowDown } from "@arco-design/web-react/icon";
import { useStore } from "../../store/Store";
import { useConfigStore } from "../../store/configStore";
import EntryCardCompact from "./components/EntryCardCompact";
import { AnimatePresence, motion } from "framer-motion";

export default function EntryList({ entries, info }) {
  const offset = useStore((state) => state.offset);
  const setOffset = useStore((state) => state.setOffset);
  const showEntries = useStore((state) => state.showEntries);
  const setShowEntries = useStore((state) => state.setShowEntries);
  const entryListRef = useRef(null);
  const loading = useStore((state) => state.loading);
  const layout = useConfigStore((state) => state.layout);
  const isMoble = useStore((state) => state.isMobile);

  useEffect(() => {
    setShowEntries(entries.slice(0, offset + 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  useEffect(() => {
    setOffset(0);
    entryListRef.current.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  const handleLoadMore = () => {
    const newOffset = offset + 100;
    const newShowEntries = [
      ...showEntries,
      ...entries.slice(newOffset, newOffset + 100),
    ];
    setShowEntries(newShowEntries);
    setOffset(newOffset);
  };

  return (
    <div
      className="entry-list-panel"
      style={{
        width: isMoble ? "100%" : "300px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-fill-1)",
        borderRight: isMoble ? "none" : "1px solid var(--color-border-2)",
      }}
    >
      <Spin
        ref={entryListRef}
        loading={loading}
        className="entry-list-container"
        style={{ flex: 1, overflowY: "auto" }}
      >
        <SearchBar />
        <AnimatePresence>
          <motion.div
            key={info}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            // exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-list" style={{ padding: "0 10px 0 10px" }}>
              {showEntries.map((entry) =>
                layout === "compact" ? (
                  <EntryCardCompact entry={entry} key={entry.id} />
                ) : (
                  <EntryCard entry={entry} key={entry.id} />
                ),
              )}
              {entries.length > showEntries.length && (
                <Button
                  style={{ marginBottom: 10 }}
                  long
                  onClick={handleLoadMore}
                  icon={<IconArrowDown />}
                >
                  Load more
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </Spin>
      <BottomBar />
    </div>
  );
}
