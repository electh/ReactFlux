import React, { useEffect, useRef } from "react";
import { Divider, Typography } from "@arco-design/web-react";
import { dayjs } from "@arco-design/web-react/es/_util/dayjs";
import "./EntryContent.css";
import { useConfigStore } from "../../../store/configStore";
import EntryBody from "./EntryBody";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../../../store/Store";

export default function EntryContent({ activeEntry }) {
  const entryContentRef = useRef(null);
  const isMobile = useStore((state) => state.isMobile);

  useEffect(() => {
    entryContentRef.current?.scrollIntoView({
      block: "start",
    });
  }, [activeEntry?.id]);

  const { published_at, url, title, feed, content } = activeEntry;

  const dateFormat = "MMMM D, YYYY";
  const timeFormat = "hh:mm";

  const titleSize = useConfigStore((state) => state.titleSize);

  const styles = {
    container: {
      paddingTop: "40px",
      paddingBottom: "40px",
      paddingLeft: "5%",
      paddingRight: "5%",
      flex: "1",
      overflowY: "auto",
      overflowX: "hidden",
    },
    title: {
      maxWidth: "600px",
      marginLeft: "auto",
      marginRight: "auto",
    },
    text: {
      color: "var(--color-text-3)",
      fontSize: "10px",
    },
  };

  return (
    <div
      className="article-content"
      ref={entryContentRef}
      style={styles.container}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEntry.id}
          initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isMobile ? 0 : -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="article-title" style={styles.title}>
            <Typography.Text style={styles.text}>
              {dayjs(published_at).format(dateFormat)} AT{" "}
              {dayjs(published_at).format(timeFormat)}
            </Typography.Text>
            <Typography.Title heading={titleSize} style={{ margin: 0 }}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                {title}
              </a>
            </Typography.Title>
            <Typography.Text style={styles.text}>{feed.title}</Typography.Text>
            <Divider />
          </div>
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 0 : 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMobile ? 0 : -20 }}
            transition={{ duration: 0.1 }}
          >
            <EntryBody htmlString={content} />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
