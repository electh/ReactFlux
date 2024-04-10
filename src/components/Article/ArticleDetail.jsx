import {
  Button,
  Divider,
  Tag,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import {
  IconEmpty,
  IconImage,
  IconMinus,
  IconPlus,
} from "@arco-design/web-react/icon";
import dayjs from "dayjs";
import ReactHtmlParser from "html-react-parser";
import React, { forwardRef, useState } from "react";
import { PhotoSlider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Link, useNavigate } from "react-router-dom";

import useStore from "../../Store";
import { extractAllImageSrc } from "../../utils/images.js";
import ActionButtons from "./ActionButtons.jsx";
import "./ArticleDetail.css";

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

const ArticleDetail = forwardRef(
  (
    {
      info,
      handleEntryClick,
      getEntries,
      isFilteredEntriesUpdated,
      setIsFilteredEntriesUpdated,
    },
    ref,
  ) => {
    const navigate = useNavigate();
    const activeContent = useStore((state) => state.activeContent);
    const fontSize = useStore((state) => state.fontSize);
    const [bodyWidth, setBodyWidth] = useState(90);
    const [isPhotoSliderVisible, setIsPhotoSliderVisible] = useState(false);

    if (!activeContent) {
      return (
        <div ref={ref} className="content-empty">
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

    const parsedHtml = ReactHtmlParser(activeContent.content);
    const groupId = activeContent.feed.category.id;
    const groupTitle = activeContent.feed.category.title;
    const imageSources = extractAllImageSrc(activeContent.content);

    return (
      <div ref={ref} className="article-content">
        <div className="article-header">
          <Typography.Title className="article-title" heading={5}>
            <a
              href={activeContent.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {activeContent.title}
            </a>
          </Typography.Title>
          <div className="article-meta">
            <Typography.Text>
              <CustomLink
                url={`/feed/${activeContent.feed.id}`}
                text={activeContent.feed.title}
              />
            </Typography.Text>
            <Typography.Text>{` - ${activeContent.author}`}</Typography.Text>
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
          </div>
          <Typography.Text className="article-date">
            {dayjs(activeContent.published_at).format(
              "dddd, MMMM D, YYYY [at] h:mm A",
            )}
          </Typography.Text>
          <Divider />
        </div>
        <div className="article-top-bar">
          <Button.Group>
            <Tooltip content="Expand article body" mini>
              <Button
                disabled={bodyWidth === 90}
                icon={<IconPlus />}
                size="mini"
                type="primary"
                onClick={() => setBodyWidth((prev) => prev + 10)}
              />
            </Tooltip>
            <Tooltip content="Reduce article body" mini>
              <Button
                disabled={bodyWidth === 60}
                icon={<IconMinus />}
                size="mini"
                type="primary"
                onClick={() => setBodyWidth((prev) => prev - 10)}
              />
            </Tooltip>
            <Tooltip content="Open photo slider" mini>
              <Button
                disabled={imageSources.length === 0}
                icon={<IconImage />}
                size="mini"
                type="primary"
                onClick={() => setIsPhotoSliderVisible(true)}
              />
            </Tooltip>
          </Button.Group>
        </div>
        <div
          className="article-body"
          key={activeContent.id}
          style={{ fontSize: `${fontSize}rem`, width: `${bodyWidth}%` }}
        >
          {parsedHtml}
          {imageSources.length > 0 && (
            <PhotoSlider
              images={imageSources.map((item) => ({ src: item, key: item }))}
              visible={isPhotoSliderVisible}
              onClose={() => setIsPhotoSliderVisible(false)}
            />
          )}
        </div>
        <ActionButtons
          info={info}
          handleEntryClick={handleEntryClick}
          getEntries={getEntries}
          isFilteredEntriesUpdated={isFilteredEntriesUpdated}
          setIsFilteredEntriesUpdated={setIsFilteredEntriesUpdated}
        />
      </div>
    );
  },
);

export default ArticleDetail;
