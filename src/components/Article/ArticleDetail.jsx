import { Divider, Typography } from "@arco-design/web-react";
import { IconEmpty } from "@arco-design/web-react/icon";
import dayjs from "dayjs";
import { Parser as HtmlToReactParser } from "html-to-react";
import { forwardRef } from "react";
import { Link } from "react-router-dom";

import useStore from "../../Store";

const ArticleDetail = forwardRef((_, ref) => {
  const activeContent = useStore((state) => state.activeContent);
  const fontSize = useStore((state) => state.fontSize);

  if (!activeContent) {
    return (
      <div
        ref={ref}
        className="content-empty"
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--color-fill-1)",
          color: "var(--color-text-3)",
          alignItems: "center",
          justifyContent: "center",
          flex: "1",
          padding: "40px 16px",
        }}
      >
        <IconEmpty style={{ fontSize: "64px" }} />
        <Typography.Title
          heading={6}
          style={{ color: "var(--color-text-3)", marginTop: "10px" }}
        >
          ReactFlux
        </Typography.Title>
      </div>
    );
  }

  const htmlToReactParser = new HtmlToReactParser();
  const reactElement = htmlToReactParser.parse(activeContent.content);

  return (
    <div
      ref={ref}
      className="article-content"
      style={{
        padding: "40px 5%",
        flex: "1",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        className="article-title"
        style={{
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <Typography.Text
          style={{ color: "var(--color-text-3)", fontSize: "10px" }}
        >
          {dayjs(activeContent.published_at).format("MMMM D, YYYY")} AT{" "}
          {dayjs(activeContent.published_at).format("hh:mm")}
        </Typography.Text>
        <Typography.Title heading={3} style={{ margin: 0 }}>
          <a href={activeContent.url} target="_blank" rel="noopener noreferrer">
            {activeContent.title}
          </a>
        </Typography.Title>
        <Typography.Text
          style={{ color: "var(--color-text-3)", fontSize: "10px" }}
        >
          <Link
            to={`/feed/${activeContent.feed.id}`}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {activeContent.feed.title}
          </Link>
        </Typography.Text>
        <Divider />
      </div>
      <div
        className="article-body"
        key={activeContent.id}
        style={{
          fontSize: `${fontSize}rem`,
          maxWidth: "600px",
          margin: "0 auto",
          overflowWrap: "break-word",
        }}
      >
        {reactElement}
      </div>
    </div>
  );
});

export default ArticleDetail;
