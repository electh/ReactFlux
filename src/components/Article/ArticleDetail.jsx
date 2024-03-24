import { Divider, Tag, Typography } from "@arco-design/web-react";
import { IconEmpty } from "@arco-design/web-react/icon";
import dayjs from "dayjs";
import { Parser as HtmlToReactParser } from "html-to-react";
import { forwardRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import useStore from "../../Store";

const CustomLink = ({ url, text }) => {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={url}
      style={{
        color: "inherit",
        textDecoration: hover ? "underline" : "none",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {text}
    </Link>
  );
};

const ArticleDetail = forwardRef((_, ref) => {
  const navigate = useNavigate();
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
  const groupId = activeContent.feed.category.id;
  const groupTitle = activeContent.feed.category.title;

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
        <Typography.Title heading={3} style={{ margin: 0 }}>
          <a href={activeContent.url} target="_blank" rel="noopener noreferrer">
            {activeContent.title}
          </a>
        </Typography.Title>
        <Typography.Text
          style={{ color: "var(--color-text-3)", fontSize: "0.75 rem" }}
        >
          <CustomLink
            url={`/feed/${activeContent.feed.id}`}
            text={activeContent.feed.title}
          />
        </Typography.Text>
        <Typography.Text
          style={{ color: "var(--color-text-3)", fontSize: "0.75 rem" }}
        >
          {` - ${activeContent.author}`}
        </Typography.Text>
        <Typography.Text>
          <Tag
            size="small"
            onClick={() => {
              navigate(`/group/${groupId}`);
            }}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
            }}
          >
            {groupTitle}
          </Tag>
        </Typography.Text>
        <br />
        <Typography.Text
          style={{ color: "var(--color-text-3)", fontSize: "0.75 rem" }}
        >
          {dayjs(activeContent.published_at).format("MMMM D, YYYY")} AT{" "}
          {dayjs(activeContent.published_at).format("hh:mm")}
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
