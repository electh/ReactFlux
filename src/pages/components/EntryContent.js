import React, { useEffect, useRef } from "react";
import { Divider, Typography } from "@arco-design/web-react";
import { dayjs } from "@arco-design/web-react/es/_util/dayjs";
import "./EntryContent.css";
import "../../utils/animation.css";

export default function EntryContent({ activeEntry }) {
  const entryContentRef = useRef(null);

  useEffect(() => {
    // 优化部分：使用可选链操作符确保在 entryContentRef.current 存在的情况下调用 scrollIntoView 方法
    entryContentRef.current?.scrollIntoView({
      block: "start",
    });
  }, [activeEntry]);

  // 解构 activeEntry 对象，使代码更加清晰，减少重复
  const { published_at, url, title, feed, content } = activeEntry;

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
        <Typography.Title heading={3} style={{ margin: 0 }}>
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
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        className="article-body"
        style={{
          fontSize: `1.05rem`,
          overflowWrap: "break-word",
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      ></div>
    </div>
  );
}
