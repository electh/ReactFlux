import { Divider, Tag, Typography } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import ReactHtmlParser from "html-react-parser"
import { littlefoot } from "littlefoot"
import { forwardRef, useEffect } from "react"
import { PhotoSlider } from "react-photo-view"
import { useNavigate } from "react-router"
import "react-photo-view/dist/react-photo-view.css"
import SimpleBar from "simplebar-react"

import CodeBlock from "./CodeBlock"
import ImageOverlayButton from "./ImageOverlayButton"

import CustomLink from "@/components/ui/CustomLink"
import FadeTransition from "@/components/ui/FadeTransition"
import PlyrPlayer from "@/components/ui/PlyrPlayer"
import usePhotoSlider from "@/hooks/usePhotoSlider"
import useScreenWidth from "@/hooks/useScreenWidth"
import { contentState, setFilterString, setFilterType } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { generateReadableDate, generateReadingTime } from "@/utils/date"
import { extractImageSources } from "@/utils/images"
import "./ArticleDetail.css"
import "./littlefoot.css"

const handleLinkWithImage = (node, imageSources, togglePhotoSlider) => {
  const imgNode = node.children.find((child) => child.type === "tag" && child.name === "img")

  if (imgNode) {
    const index = imageSources.findIndex((src) => src === imgNode.attribs.src)

    return (
      <ImageOverlayButton
        index={index}
        isLinkWrapper={true}
        node={node}
        togglePhotoSlider={togglePhotoSlider}
      />
    )
  }
  return node
}

const handleBskyVideo = (node) => {
  const isBskyVideo = /video\.bsky\.app.*thumbnail\.jpg$/.test(node.attribs.src)
  if (isBskyVideo) {
    const thumbnailUrl = node.attribs.src
    const playlistUrl = thumbnailUrl.replace("thumbnail.jpg", "playlist.m3u8")

    return <PlyrPlayer poster={thumbnailUrl} src={playlistUrl} />
  }
  return null
}

const handleImage = (node, imageSources, togglePhotoSlider) => {
  const bskyVideoPlayer = handleBskyVideo(node)
  if (bskyVideoPlayer) {
    return bskyVideoPlayer
  }

  const index = imageSources.findIndex((src) => src === node.attribs.src)
  return <ImageOverlayButton index={index} node={node} togglePhotoSlider={togglePhotoSlider} />
}

const htmlEntities = {
  "&#39;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
}

const decodeAndParseCodeContent = (preElement) => {
  return preElement.children
    .map((child) => {
      if (child.type === "tag" && child.name === "p") {
        return (child.children[0]?.data ?? "") + "\n"
      }
      if (child.type === "tag" && child.name === "strong") {
        return child.children[0]?.data ?? ""
      }
      return child.data ?? (child.name === "br" ? "\n" : "")
    })
    .join("")
    .replace(new RegExp(Object.keys(htmlEntities).join("|"), "g"), (match) => htmlEntities[match])
}

const handleTableBasedCode = (node) => {
  const tbody = node.children.find((child) => child.name === "tbody")
  if (!tbody) {
    return null
  }

  const tr = tbody.children.find((child) => child.name === "tr")
  if (!tr || tr.children.length !== 2) {
    return null
  }

  const [, codeTd] = tr.children

  const codePre = codeTd.children.find((child) => child.name === "pre")

  if (!codePre) {
    return null
  }

  return decodeAndParseCodeContent(codePre)
}

// Remove empty td elements from table-based layout content
const handleContentTable = (node) => {
  const tbody = node.children.find((child) => child.name === "tbody")
  if (!tbody) {
    return null
  }

  for (const tr of tbody.children) {
    if (tr.name === "tr") {
      tr.children = tr.children.filter(
        (td) =>
          td.name === "td" &&
          td.children?.length > 0 &&
          td.children.some((child) => child.data?.trim() || child.children?.length),
      )
    }
  }

  return node
}

const handleFigure = (node, imageSources, togglePhotoSlider) => {
  const firstChild = node.children[0]
  const hasImages = node.children.some((child) => child.name === "img")

  // Handle code blocks wrapped in figure
  if (firstChild?.name === "pre") {
    const codeContent = decodeAndParseCodeContent(firstChild)
    return codeContent ? <CodeBlock>{codeContent}</CodeBlock> : null
  }

  // Handle table-based code blocks with line numbers
  if (firstChild?.name === "table") {
    const codeContent = handleTableBasedCode(firstChild)
    return codeContent ? <CodeBlock>{codeContent}</CodeBlock> : null
  }

  // Handle multiple images in figure
  if (hasImages) {
    return (
      <>
        {node.children.map(
          (child, index) =>
            child.name === "img" && (
              <div key={`figure-img-${index}`}>
                {handleImage(child, imageSources, togglePhotoSlider)}
              </div>
            ),
        )}
      </>
    )
  }

  return null
}

const handleCodeBlock = (node) => {
  // Remove line number text for code blocks in VuePress / VitePress
  let currentNode = node.next
  while (currentNode) {
    const nextNode = currentNode.next
    const isLineNumber = currentNode.type === "text" && /^\d+(<br>|\n)*/.test(currentNode.data)
    const isBreak = currentNode.type === "tag" && currentNode.name === "br"

    if (isLineNumber || isBreak) {
      currentNode.data = ""
      currentNode.type = "text"
    }
    currentNode = nextNode
  }

  // Extract code content
  let codeContent
  if (node.children[0]?.name === "code") {
    codeContent = decodeAndParseCodeContent(node.children[0])
  } else {
    codeContent = decodeAndParseCodeContent(node)
  }

  return <CodeBlock>{codeContent}</CodeBlock>
}

const handleVideo = (node) => {
  const sourceNode = node.children?.find((child) => child.name === "source" && child.attribs?.src)

  const videoSrc = sourceNode?.attribs.src || node.attribs.src

  if (!videoSrc) {
    return node
  }

  return (
    <PlyrPlayer poster={node.attribs.poster} sourceType={sourceNode?.attribs.type} src={videoSrc} />
  )
}

const getHtmlParserOptions = (imageSources, togglePhotoSlider) => ({
  replace: (node) => {
    if (node.type !== "tag") {
      return node
    }

    switch (node.name) {
      case "a":
        return node.children.length > 0
          ? handleLinkWithImage(node, imageSources, togglePhotoSlider)
          : node
      case "img":
        return handleImage(node, imageSources, togglePhotoSlider)
      case "pre":
        return handleCodeBlock(node)
      case "figure":
        return handleFigure(node, imageSources, togglePhotoSlider)
      case "video":
        return handleVideo(node)
      case "table":
        return handleContentTable(node)
      default:
        return node
    }
  },
})

const ArticleDetail = forwardRef((_, ref) => {
  const navigate = useNavigate()
  const { isBelowMedium } = useScreenWidth()
  const { activeContent } = useStore(contentState)
  const { articleWidth, edgeToEdgeImages, fontFamily, fontSize, titleAlignment } =
    useStore(settingsState)

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, selectedIndex, setSelectedIndex } =
    usePhotoSlider()

  const handleAuthorFilter = () => {
    setFilterType("author")
    setFilterString(activeContent.author)
  }

  const togglePhotoSlider = (index) => {
    setSelectedIndex(index)
    setIsPhotoSliderVisible((prev) => !prev)
  }

  const imageSources = extractImageSources(activeContent.content)
  const htmlParserOptions = getHtmlParserOptions(imageSources, togglePhotoSlider)

  const parsedHtml = ReactHtmlParser(activeContent.content, htmlParserOptions)
  const { id: categoryId, title: categoryTitle } = activeContent.feed.category
  const { id: feedId, title: feedTitle } = activeContent.feed

  const { coverSource, mediaPlayerEnclosure, isMedia } = activeContent

  const getResponsiveMaxWidth = () => {
    if (isBelowMedium) {
      return "90%"
    }
    return `${articleWidth}ch`
  }

  // pretty footnotes
  useEffect(() => {
    littlefoot()
  }, [])

  return (
    <article
      ref={ref}
      className={`article-content ${edgeToEdgeImages ? "edge-to-edge" : ""}`}
      tabIndex={-1}
    >
      <SimpleBar className="scroll-container">
        <FadeTransition y={20}>
          <div
            className="article-header"
            style={{ maxWidth: getResponsiveMaxWidth(), textAlign: titleAlignment }}
          >
            <Typography.Title
              className="article-title"
              heading={3}
              style={{ fontFamily: fontFamily }}
            >
              <a href={activeContent.url} rel="noopener noreferrer" target="_blank">
                {activeContent.title}
              </a>
            </Typography.Title>
            <div className="article-meta">
              <Typography.Text>
                <CustomLink text={feedTitle} url={`/feed/${feedId}`} />
              </Typography.Text>
              <Typography.Text style={{ cursor: "pointer" }} onClick={handleAuthorFilter}>
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
            key={activeContent.id}
            className="article-body"
            style={{
              fontSize: `${fontSize}rem`,
              maxWidth: getResponsiveMaxWidth(),
              fontFamily: fontFamily,
              "--article-width": articleWidth,
            }}
          >
            {isMedia && mediaPlayerEnclosure && (
              <PlyrPlayer
                enclosure={mediaPlayerEnclosure}
                poster={coverSource}
                src={mediaPlayerEnclosure.url}
                style={{
                  maxWidth: mediaPlayerEnclosure.mime_type.startsWith("video/") ? "100%" : "400px",
                }}
              />
            )}
            {parsedHtml}
            <PhotoSlider
              bannerVisible={!isBelowMedium}
              images={imageSources.map((item) => ({ src: item, key: item }))}
              index={selectedIndex}
              loop={false}
              maskClassName={"img-mask"}
              maskOpacity={0.6}
              visible={isPhotoSliderVisible}
              onIndexChange={setSelectedIndex}
              onClose={() => {
                setIsPhotoSliderVisible(false)
              }}
            />
          </div>
        </FadeTransition>
      </SimpleBar>
    </article>
  )
})
ArticleDetail.displayName = "ArticleDetail"

export default ArticleDetail
