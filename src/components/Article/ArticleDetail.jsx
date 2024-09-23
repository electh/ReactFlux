import { Button, Divider, Tag, Typography } from "@arco-design/web-react";
import { IconEmpty, IconFullscreen } from "@arco-design/web-react/icon";
import ReactHtmlParser from "html-react-parser";
import { forwardRef, useEffect, useState } from "react";
import { PhotoSlider } from "react-photo-view";
import { Link, useNavigate } from "react-router-dom";

import { useStore } from "@nanostores/react";
import "react-photo-view/dist/react-photo-view.css";
import SimpleBar from "simplebar-react";
import { usePhotoSlider } from "../../hooks/usePhotoSlider";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import {
  contentState,
  setFilterString,
  setFilterType,
  setIsArticleFocused,
} from "../../store/contentState";
import { settingsState } from "../../store/settingsState";
import { generateReadableDate } from "../../utils/date";
import { extractImageSources } from "../../utils/images";
import ActionButtons from "./ActionButtons";
import "./ArticleDetail.css";

const CustomLink = ({ url, text }) => {
  const [isHovering, setIsHovering] = useState(false);
  const toggleHover = () => setIsHovering(!isHovering);

  return (
    <Link
      to={url}
      style={{
        color: "inherit",
        textDecoration: isHovering ? "underline" : "none",
      }}
      onMouseEnter={toggleHover}
      onMouseLeave={toggleHover}
    >
      {text}
    </Link>
  );
};

const ImageOverlayButton = ({
  node,
  index,
  togglePhotoSlider,
  isLinkWrapper = false,
}) => {
  const { fontSize } = useStore(settingsState);

  const [isHovering, setIsHovering] = useState(false);
  const [isIcon, setIsIcon] = useState(false);
  const { isBelowMedium } = useScreenWidth();

  useEffect(() => {
    const imgNode = isLinkWrapper ? node.children[0] : node;
    const imgSrc = imgNode.attribs.src;
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => setIsIcon(img.width <= 100 && img.height <= 100);
  }, [node, isLinkWrapper]);

  const imgNode = isLinkWrapper ? node.children[0] : node;

  const renderImage = () => (
    <img
      {...imgNode.attribs}
      alt={imgNode.attribs.alt ?? "image"}
      style={
        isIcon
          ? {
              display: "inline-block",
              width: "auto",
              height: `${fontSize}rem`,
              margin: 0,
            }
          : {}
      }
    />
  );

  if (isIcon) {
    return isLinkWrapper ? (
      <a {...node.attribs}>
        {renderImage()}
        {node.children[1]?.data}
      </a>
    ) : (
      renderImage()
    );
  }

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <div
        style={{ display: "inline-block", position: "relative" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isLinkWrapper ? (
          <a {...node.attribs}>{renderImage()}</a>
        ) : (
          renderImage()
        )}
        <Button
          icon={<IconFullscreen />}
          shape="circle"
          style={{
            position: "absolute",
            top: 30,
            right: 10,
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            opacity: isBelowMedium || isHovering ? 1 : 0,
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
    if (node.type === "tag" && node.name === "a" && node.children.length > 0) {
      const imgNode = node.children[0];
      if (imgNode.type === "tag" && imgNode.name === "img") {
        const index = imageSources.findIndex(
          (src) => src === imgNode.attribs.src,
        );
        return (
          <ImageOverlayButton
            node={node}
            index={index}
            togglePhotoSlider={togglePhotoSlider}
            isLinkWrapper={true}
          />
        );
      }
    } else if (node.type === "tag" && node.name === "img") {
      const index = imageSources.findIndex((src) => src === node.attribs.src);
      return (
        <ImageOverlayButton
          node={node}
          index={index}
          togglePhotoSlider={togglePhotoSlider}
        />
      );
    }
    return node;
  },
});

const ArticleDetail = forwardRef(({ handleEntryClick, entryListRef }, ref) => {
  const navigate = useNavigate();
  const { activeContent } = useStore(contentState);
  const { articleWidth, fontSize } = useStore(settingsState);

  const {
    isPhotoSliderVisible,
    setIsPhotoSliderVisible,
    selectedIndex,
    setSelectedIndex,
  } = usePhotoSlider();

  const handleAuthorFilter = () => {
    setFilterType("author");
    setFilterString(activeContent.author);
  };

  const togglePhotoSlider = (index) => {
    setSelectedIndex(index);
    setIsPhotoSliderVisible((prev) => !prev);
    setIsArticleFocused((prev) => !prev);
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

  const imageSources = extractImageSources(activeContent.content);
  const htmlParserOptions = getHtmlParserOptions(
    imageSources,
    togglePhotoSlider,
  );
  const parsedHtml = ReactHtmlParser(activeContent.content, htmlParserOptions);
  const { id: categoryId, title: categoryTitle } = activeContent.feed.category;

  return (
    <article
      className="article-content"
      onBlur={() => setIsArticleFocused(false)}
      onFocus={() => setIsArticleFocused(true)}
      ref={ref}
    >
      <SimpleBar className="scroll-container">
        <div className="article-header" style={{ width: `${articleWidth}%` }}>
          <Typography.Title className="article-title" heading={3}>
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
            <Typography.Text
              onClick={handleAuthorFilter}
              style={{ cursor: "pointer" }}
            >
              {` - ${activeContent.author}`}
            </Typography.Text>
            <Typography.Text>
              <Tag
                size="small"
                style={{ marginLeft: "10px", cursor: "pointer" }}
                onClick={() => navigate(`/category/${categoryId}`)}
              >
                {categoryTitle}
              </Tag>
            </Typography.Text>
          </div>
          <Typography.Text className="article-date">
            {generateReadableDate(activeContent.published_at)}
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
            loop={false}
            visible={isPhotoSliderVisible}
            onClose={() => {
              setIsPhotoSliderVisible(false);
              setIsArticleFocused(true);
            }}
            index={selectedIndex}
            onIndexChange={setSelectedIndex}
          />
        </div>
      </SimpleBar>
      <ActionButtons
        handleEntryClick={handleEntryClick}
        entryListRef={entryListRef}
      />
    </article>
  );
});

export default ArticleDetail;
