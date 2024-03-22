import React, { useEffect, useRef } from "react";
import { Divider, Typography } from "@arco-design/web-react";
import { dayjs } from "@arco-design/web-react/es/_util/dayjs";
import "./EntryContent.css";
import { useConfigStore } from "../../../store/configStore";
import EntryBody from "./EntryBody";
import { motion } from "framer-motion";
import { useStore } from "../../../store/Store";

export default function EntryContent({ activeEntry }) {
  const entryContentRef = useRef(null);
  const isMobile = useStore((state) => state.isMobile);

  useEffect(() => {
    // 优化部分：使用可选链操作符确保在 entryContentRef.current 存在的情况下调用 scrollIntoView 方法
    entryContentRef.current?.scrollIntoView({
      block: "start",
    });
  }, [activeEntry?.id]);

  // 解构 activeEntry 对象，使代码更加清晰，减少重复
  const { published_at, url, title, feed, content } = activeEntry;

  const titleSize = useConfigStore((state) => state.titleSize);

  return (
    <div
      className="article-content"
      ref={entryContentRef}
      style={{
        paddingTop: "40px",
        paddingBottom: "40px",
        paddingLeft: "5%",
        paddingRight: "5%",
        flex: "1",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <motion.div
        key={activeEntry.id}
        initial={{ opacity: 0, y: isMobile ? 0 : 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="article-title"
          style={{
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Typography.Text
            style={{ color: "var(--color-text-3)", fontSize: "10px" }}
          >
            {/* 优化部分：将日期格式化代码简化并放在一行中 */}
            {dayjs(published_at).format("MMMM D, YYYY")} AT{" "}
            {dayjs(published_at).format("hh:mm")}
          </Typography.Text>
          <Typography.Title heading={titleSize} style={{ margin: 0 }}>
            <a href={url} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          </Typography.Title>
          <Typography.Text
            style={{ color: "var(--color-text-3)", fontSize: "10px" }}
          >
            {feed.title}
          </Typography.Text>
          <Divider />
        </div>

        <motion.div
          key={activeEntry.title}
          initial={{ opacity: 0, y: isMobile ? 0 : 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EntryBody htmlString={content} />
        </motion.div>
      </motion.div>
    </div>
  );
}
