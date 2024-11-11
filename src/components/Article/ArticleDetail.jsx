import { Divider, Tag, Typography } from "@arco-design/web-react"
import MuxPlayer from "@mux/mux-player-react"
import { useStore } from "@nanostores/react"
import ReactHtmlParser from "html-react-parser"
import { littlefoot } from "littlefoot"
import { forwardRef, useEffect } from "react"
import { PhotoSlider } from "react-photo-view"
import { useNavigate } from "react-router-dom"
import "react-photo-view/dist/react-photo-view.css"
import SimpleBar from "simplebar-react"

import CodeBlock from "./CodeBlock"
import ImageOverlayButton from "./ImageOverlayButton"

import CustomLink from "@/components/ui/CustomLink"
import FadeTransition from "@/components/ui/FadeTransition"
import usePhotoSlider from "@/hooks/usePhotoSlider"
import useScreenWidth from "@/hooks/useScreenWidth"
import { contentState, setFilterString, setFilterType } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { generateReadableDate, generateReadingTime } from "@/utils/date"
import { extractImageSources } from "@/utils/images"
import sanitizeHtml from "@/utils/sanitizeHtml"
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

    return <MuxPlayer controls poster={thumbnailUrl} src={playlistUrl} />
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

const parseCodeContent = (pre) => {
  return pre.children
    .map((child) => child.data || (child.name === "br" ? "\n" : ""))
    .join("")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

const handleTableBasedCode = (node) => {
  const table = node.children[0]
  const tbody = table.children.find((child) => child.name === "tbody")
  if (!tbody) {
    return null
  }

  const tr = tbody.children.find((child) => child.name === "tr")
  if (!tr || tr.children.length !== 2) {
    return null
  }

  const codeTd = tr.children[1]
  const pre = codeTd.children.find((child) => child.name === "pre")

  return pre ? parseCodeContent(pre) : null
}

const handleFigure = (node, imageSources, togglePhotoSlider) => {
  const firstChild = node.children[0]

  if (firstChild.name === "img") {
    return handleImage(firstChild, imageSources, togglePhotoSlider)
  }

  // Handle table-based code blocks with line numbers
  if (firstChild.name === "table") {
    const codeContent = handleTableBasedCode(firstChild)
    if (codeContent) {
      return <CodeBlock>{codeContent}</CodeBlock>
    }
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
    codeContent = node.children[0].children[0]?.data || ""
  } else {
    codeContent = node.children.map((child) => child.data || "").join("")
  }

  return <CodeBlock>{codeContent}</CodeBlock>
}

const handleVideo = (node) => {
  const sourceNode = node.children?.find((child) => child.name === "source" && child.attribs?.src)

  const videoSrc = sourceNode?.attribs.src || node.attribs.src

  if (!videoSrc) {
    return node
  }

  return <MuxPlayer controls poster={node.attribs.poster} src={videoSrc} />
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

  const sanitizedHtml = sanitizeHtml(activeContent.content)
  const parsedHtml = ReactHtmlParser(sanitizedHtml, htmlParserOptions)
  const { id: categoryId, title: categoryTitle } = activeContent.feed.category
  const { id: feedId, title: feedTitle } = activeContent.feed

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
            style={{ width: `${articleWidth}%`, textAlign: titleAlignment }}
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
              width: `${articleWidth}%`,
              fontFamily: fontFamily,
              "--article-width": articleWidth,
            }}
          >
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
