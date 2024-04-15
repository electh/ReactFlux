import { Button, Divider, Tag, Typography } from "@arco-design/web-react";
import { IconEmpty, IconImage } from "@arco-design/web-react/icon";
import dayjs from "dayjs";
import ReactHtmlParser from "html-react-parser";
import React, { forwardRef, useState } from "react";
import { PhotoSlider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Link, useNavigate } from "react-router-dom";

import useStore from "../../Store";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { extractAllImageSrc } from "../../utils/images";
import ActionButtons from "./ActionButtons";
import "./ArticleDetail.css";

const CustomLink = ({ url, text }) => {
  const [hover, setHover] = useState(false);
  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  return (
    <Link
      to={url}
      style={{
        color: "inherit",
        textDecoration: hover ? "underline" : "none",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </Link>
  );
};

const ImageWithButton = ({ node, index, togglePhotoSlider }) => {
  const [isHovering, setIsHovering] = useState(false);
  const { isMobileView } = useScreenWidth();

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <div
        style={{ display: "inline-block", position: "relative" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img {...node.attribs} alt={node.attribs.alt} />
        <Button
          icon={<IconImage />}
          style={{
            position: "absolute",
            top: 30,
            right: 10,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            opacity: isMobileView || isHovering ? 1 : 0,
            transition: "opacity 0.3s",
          }}
          onClick={(event) => {
            event.preventDefault();
            togglePhotoSlider(index);
          }}
        />
      </div>
    </div>
  );
};

const getHtmlParserOptions = (imageSources, togglePhotoSlider) => ({
  replace: (node) => {
    if (node.type === "tag" && node.name === "img") {
      const index = imageSources.findIndex((src) => src === node.attribs.src);
      return (
        <ImageWithButton
          node={node}
          index={index}
          togglePhotoSlider={togglePhotoSlider}
        />
      );
    }
    return node;
  },
});

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
    const articleWidth = useStore((state) => state.articleWidth);
    const [isPhotoSliderVisible, setIsPhotoSliderVisible] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const togglePhotoSlider = (index) => {
      setSelectedIndex(index);
      setIsPhotoSliderVisible((prev) => !prev);
    };

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

    const imageSources = extractAllImageSrc(activeContent.content);
    const htmlParserOptions = getHtmlParserOptions(
      imageSources,
      togglePhotoSlider,
    );
    const parsedHtml = ReactHtmlParser(
      activeContent.content,
      htmlParserOptions,
    );
    const groupId = activeContent.feed.category.id;
    const groupTitle = activeContent.feed.category.title;

    return (
      <div ref={ref} className="article-content">
        <div className="scroll-container">
          <div className="article-header" style={{ width: `${articleWidth}%` }}>
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
          <div
            className="article-body"
            key={activeContent.id}
            style={{ fontSize: `${fontSize}rem`, width: `${articleWidth}%` }}
          >
            {parsedHtml}
            <PhotoSlider
              images={imageSources.map((item) => ({ src: item, key: item }))}
              visible={isPhotoSliderVisible}
              onClose={() => setIsPhotoSliderVisible(false)}
              index={selectedIndex}
              onIndexChange={setSelectedIndex}
            />
          </div>
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
