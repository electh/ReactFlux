import { Divider, Tag, Typography } from "@arco-design/web-react";
import { IconEmpty } from "@arco-design/web-react/icon";
import dayjs from "dayjs";
import ReactHtmlParser from "html-react-parser";
import React, { forwardRef, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
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

// 自定义解析规则，用于替换 img 标签
const htmlParserOptions = {
  replace: (node) => {
    const isAnchorWithImg =
      node.name === "a" && node.children?.[0]?.name === "img";
    const isImgNode = node.name === "img";

    if (isAnchorWithImg || isImgNode) {
      const imgNode = isAnchorWithImg ? node.children[0] : node;
      const { src, alt } = imgNode.attribs;

      return (
        <PhotoView src={src}>
          <img src={src} alt={alt} />
        </PhotoView>
      );
    }
  },
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

  const reactElement = ReactHtmlParser(
    activeContent.content,
    htmlParserOptions,
  );
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
          {dayjs(activeContent.published_at).format(
            "dddd, MMMM D, YYYY [at] h:mm A",
          )}
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
        <PhotoProvider maskOpacity={0.7}>{reactElement}</PhotoProvider>
      </div>
    </div>
  );
});

export default ArticleDetail;
