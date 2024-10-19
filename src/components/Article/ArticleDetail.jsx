import { Divider, Tag, Typography } from "@arco-design/web-react";
import ReactHtmlParser from "html-react-parser";
import { forwardRef } from "react";
import { PhotoSlider } from "react-photo-view";
import { useNavigate } from "react-router-dom";

import { useStore } from "@nanostores/react";
import "react-photo-view/dist/react-photo-view.css";
import SimpleBar from "simplebar-react";
import { usePhotoSlider } from "../../hooks/usePhotoSlider";
import {
  contentState,
  setFilterString,
  setFilterType,
} from "../../store/contentState";
import { settingsState } from "../../store/settingsState";
import { generateReadableDate, generateReadingTime } from "../../utils/date";
import { extractImageSources } from "../../utils/images";
import CustomLink from "../ui/CustomLink";
import FadeInMotion from "../ui/FadeInMotion";
import CodeBlock from "./CodeBlock";
import ImageOverlayButton from "./ImageOverlayButton";
import "./ArticleDetail.css";

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
    } else if (node.type === "tag" && node.name === "pre") {
      let codeContent = "";

      if (node.children[0]?.name === "code") {
        const codeNode = node.children[0];
        codeContent = codeNode.children[0]?.data || "";
      } else {
        codeContent = node.children.map((child) => child.data || "").join("");
      }

      return <CodeBlock>{codeContent}</CodeBlock>;
    }

    return node;
  },
});

const ArticleDetail = forwardRef((_, ref) => {
  const navigate = useNavigate();
  const { activeContent } = useStore(contentState);
  const { articleWidth, fontFamily, fontSize } = useStore(settingsState);

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
  };

  const imageSources = extractImageSources(activeContent.content);
  const htmlParserOptions = getHtmlParserOptions(
    imageSources,
    togglePhotoSlider,
  );
  const parsedHtml = ReactHtmlParser(activeContent.content, htmlParserOptions);
  const { id: categoryId, title: categoryTitle } = activeContent.feed.category;
  const { id: feedId, title: feedTitle } = activeContent.feed;

  return (
    <article className="article-content" ref={ref} tabIndex={-1}>
      <SimpleBar className="scroll-container">
        <FadeInMotion>
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
                <CustomLink url={`/feed/${feedId}`} text={feedTitle} />
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
            <br />
            <Typography.Text className="article-date">
              {generateReadingTime(activeContent.reading_time)}
            </Typography.Text>
            <Divider />
          </div>
          <div
            className="article-body"
            key={activeContent.id}
            style={{
              fontSize: `${fontSize}rem`,
              width: `${articleWidth}%`,
              fontFamily: fontFamily,
            }}
          >
            {parsedHtml}
            <PhotoSlider
              images={imageSources.map((item) => ({ src: item, key: item }))}
              loop={false}
              visible={isPhotoSliderVisible}
              onClose={() => {
                setIsPhotoSliderVisible(false);
              }}
              index={selectedIndex}
              onIndexChange={setSelectedIndex}
            />
          </div>
        </FadeInMotion>
      </SimpleBar>
    </article>
  );
});

export default ArticleDetail;
