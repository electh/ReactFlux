import { Divider, Tag, Typography } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import ReactHtmlParser, { domToReact } from "html-react-parser"
import { littlefoot } from "littlefoot"
import { forwardRef, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import SimpleBar from "simplebar-react"
import Lightbox from "yet-another-react-lightbox"
import Counter from "yet-another-react-lightbox/plugins/counter"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/counter.css"

import CodeBlock from "./CodeBlock"
import ImageLinkTag from "./ImageLinkTag"
import ImageOverlayButton from "./ImageOverlayButton"

import CustomLink from "@/components/ui/CustomLink"
import FadeTransition from "@/components/ui/FadeTransition"
import PlyrPlayer from "@/components/ui/PlyrPlayer"
import usePhotoSlider from "@/hooks/usePhotoSlider"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  setActiveContent,
  setFilterString,
  setFilterType,
} from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { generateReadableDate, generateReadingTime } from "@/utils/date"
import { extractImageSources } from "@/utils/images"
import "./ArticleDetail.css"
import "./littlefoot.css"

const handleLinkWithImage = (node, imageSources, togglePhotoSlider) => {
  const imgNodes = node.children.filter((child) => child.type === "tag" && child.name === "img")

  if (imgNodes.length > 0) {
    // If there are multiple images, render them with link display
    if (imgNodes.length > 1) {
      return (
        <div className="image-wrapper">
          <div className="image-container">
            {imgNodes.map((imgNode, index) => (
              <div key={`link-img-${index}`}>
                {handleImage(imgNode, imageSources, togglePhotoSlider)}
              </div>
            ))}
            <ImageLinkTag href={node.attribs.href} />
          </div>
        </div>
      )
    }

    // Single image case
    const index = imageSources.indexOf(imgNodes[0].attribs.src)
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

  const index = imageSources.indexOf(node.attribs.src)
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
        return `${child.children[0]?.data ?? ""}\n`
      }
      if (child.type === "tag" && child.name === "strong") {
        return child.children[0]?.data ?? ""
      }
      return child.data ?? (child.name === "br" ? "\n" : "")
    })
    .join("")
    .replaceAll(
      new RegExp(Object.keys(htmlEntities).join("|"), "g"),
      (match) => htmlEntities[match],
    )
}

const handleTableBasedCode = (node) => {
  const tbody = node.children.find((child) => child.name === "tbody")
  if (!tbody) {
    return null
  }

  const tr = tbody.children.find((child) => child.name === "tr")
  if (!tr) {
    return null
  }

  // Filter for td elements to handle whitespace text nodes
  const tdElements = tr.children.filter((child) => child.name === "td")
  if (tdElements.length !== 2) {
    return null
  }

  const [, codeTd] = tdElements
  const codePre = codeTd.children.find((child) => child.name === "pre")

  if (!codePre) {
    return null
  }

  // Check if there's a <code> element inside the pre
  const codeElement = codePre.children?.find((child) => child.name === "code")
  if (codeElement) {
    return decodeAndParseCodeContent(codeElement)
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

// Helper function to process figcaption content
const processFigcaptionContent = (children) => {
  if (!children) {
    return null
  }

  return children.map((child, index) => {
    if (child.type === "text") {
      return child.data
    }
    if (child.type === "tag") {
      const Tag = child.name
      const props = child.attribs || {}

      if (child.name === "br") {
        return null
      }

      return (
        <Tag key={index} {...props}>
          {child.children ? processFigcaptionContent(child.children) : null}
        </Tag>
      )
    }
    return null
  })
}

const handleFigure = (node, imageSources, togglePhotoSlider, options) => {
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

  // Handle multiple images in figure with figcaption support
  if (hasImages) {
    return (
      <figure>
        {node.children.map((child, index) => {
          if (child.name === "img") {
            return (
              <div key={`figure-img-${index}`}>
                {handleImage(child, imageSources, togglePhotoSlider)}
              </div>
            )
          }
          if (child.name === "figcaption") {
            return (
              <figcaption key={`figure-caption-${index}`}>
                {processFigcaptionContent(child.children)}
              </figcaption>
            )
          }
          return domToReact([child], options)
        })}
      </figure>
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
  const codeContent =
    node.children[0]?.name === "code"
      ? decodeAndParseCodeContent(node.children[0])
      : decodeAndParseCodeContent(node)

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

const isSafeIframeSrc = (src) => /^https?:\/\//i.test(src)
const isValidCid = (cid) => /^[0-9]+$/.test(`${cid || ""}`)

const parseBilibiliIframeInfo = (src) => {
  try {
    const url = new URL(src)
    const isBilibiliHost = /(^|\.)bilibili\.com$/i.test(url.hostname)
    const isBilibiliPlayerHost = /(^|\.)player\.bilibili\.com$/i.test(url.hostname)
    const isMobilePlayerPath = /\/blackboard\/html5mobileplayer\.html$/i.test(url.pathname)
    const isPlayerPath = /\/player\.html$/i.test(url.pathname)

    if (!((isBilibiliHost && isMobilePlayerPath) || (isBilibiliPlayerHost && isPlayerPath))) {
      return null
    }

    return {
      aid: url.searchParams.get("aid") || "",
      bvid: url.searchParams.get("bvid") || "",
      cid: url.searchParams.get("cid") || "",
      page: url.searchParams.get("p") || url.searchParams.get("page") || "1",
    }
  } catch {
    return null
  }
}

const buildBilibiliEmbedSrc = ({ aid, bvid, cid, page }) => {
  const playerUrl = new URL("https://player.bilibili.com/player.html")
  playerUrl.searchParams.set("isOutside", "true")
  playerUrl.searchParams.set("autoplay", "0")
  playerUrl.searchParams.set("page", page || "1")
  playerUrl.searchParams.set("high_quality", "1")
  playerUrl.searchParams.set("as_wide", "1")
  playerUrl.searchParams.set("danmaku", "0")
  playerUrl.searchParams.set("refer", "1")
  if (aid) {
    playerUrl.searchParams.set("aid", aid)
  }
  if (bvid) {
    playerUrl.searchParams.set("bvid", bvid)
  }
  if (isValidCid(cid)) {
    playerUrl.searchParams.set("cid", cid)
  }
  return playerUrl.toString()
}

const parseBilibiliVideoUrl = (urlString) => {
  try {
    const url = new URL(urlString)
    if (!/(^|\.)bilibili\.com$/i.test(url.hostname)) {
      return null
    }

    const videoMatch = url.pathname.match(/\/video\/(BV[0-9A-Za-z]+|av[0-9]+)/i)
    if (!videoMatch) {
      return null
    }

    const rawVideoId = videoMatch[1]
    const isAv = /^av/i.test(rawVideoId)
    return {
      aid: isAv ? rawVideoId.replace(/^av/i, "") : "",
      bvid: isAv ? "" : rawVideoId,
      cid: "",
      page: url.searchParams.get("p") || url.searchParams.get("page") || "1",
    }
  } catch {
    return null
  }
}

const resolveBilibiliCidByBvid = (bvid) => {
  return new Promise((resolve, reject) => {
    if (!bvid || globalThis.window === undefined) {
      reject(new Error("Bilibili bvid is required"))
      return
    }

    const callbackName = `__rfBiliCb_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement("script")
    const timeout = globalThis.window.setTimeout(() => {
      cleanup()
      reject(new Error("Resolve bilibili cid timeout"))
    }, 8000)

    const cleanup = () => {
      globalThis.window.clearTimeout(timeout)
      delete globalThis.window[callbackName]
      script.remove()
    }

    globalThis.window[callbackName] = (payload) => {
      const cid = payload?.data?.pages?.[0]?.cid || payload?.data?.cid
      cleanup()
      if (isValidCid(cid)) {
        resolve(`${cid}`)
        return
      }
      reject(new Error("Resolve bilibili cid failed"))
    }

    script.addEventListener("error", () => {
      cleanup()
      reject(new Error("Load bilibili jsonp failed"))
    })
    script.src = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(
      bvid,
    )}&jsonp=jsonp&callback=${callbackName}`
    script.async = true
    document.body.append(script)
  })
}

const BilibiliIframe = ({ src, attribs }) => {
  const initialInfo = parseBilibiliIframeInfo(src)
  const [resolvedCid, setResolvedCid] = useState(
    isValidCid(initialInfo?.cid) ? initialInfo.cid : "",
  )

  useEffect(() => {
    let cancelled = false
    const info = parseBilibiliIframeInfo(src)
    if (!info || isValidCid(info.cid) || !info.bvid) {
      return
    }

    resolveBilibiliCidByBvid(info.bvid)
      .then((cid) => {
        if (!cancelled) {
          setResolvedCid(cid)
        }
        return cid
      })
      .catch(() => null)

    return () => {
      cancelled = true
    }
  }, [src])

  const info = parseBilibiliIframeInfo(src)
  const normalizedSrc = info
    ? buildBilibiliEmbedSrc({ ...info, cid: resolvedCid || info.cid })
    : src
  const { allowfullscreen, frameborder, ...restAttribs } = attribs || {}
  const iframeTitle = restAttribs.title || "Bilibili video"

  return (
    <iframe
      {...restAttribs}
      allow={
        restAttribs.allow ||
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      }
      allowFullScreen={allowfullscreen !== "false"}
      frameBorder={frameborder || "0"}
      loading="lazy"
      referrerPolicy="origin"
      src={normalizedSrc}
      title={iframeTitle}
    />
  )
}

const handleIframe = (node) => {
  const src = node.attribs?.src
  if (!src || !isSafeIframeSrc(src)) {
    return null
  }

  if (parseBilibiliIframeInfo(src)) {
    return <BilibiliIframe attribs={node.attribs} src={src} />
  }

  const { allowfullscreen, frameborder, ...restAttribs } = node.attribs || {}
  const iframeTitle = restAttribs.title || "Embedded content"

  // Check if it's a YouTube iframe
  if (src.includes("youtube.com") || src.includes("youtube-nocookie.com")) {
    return (
      <iframe
        {...restAttribs}
        allow={
          restAttribs.allow ||
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        }
        allowFullScreen={allowfullscreen !== "false"}
        frameBorder={frameborder || "0"}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={src}
        title={iframeTitle}
      />
    )
  }

  return (
    <iframe
      {...restAttribs}
      allow={
        restAttribs.allow ||
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      }
      allowFullScreen={allowfullscreen !== "false"}
      frameBorder={frameborder || "0"}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      src={src}
      title={iframeTitle}
    />
  )
}

const getHtmlParserOptions = (imageSources, togglePhotoSlider) => {
  const options = {
    replace: (node) => {
      if (node.type !== "tag") {
        return node
      }

      switch (node.name) {
        case "a": {
          return node.children.length > 0
            ? handleLinkWithImage(node, imageSources, togglePhotoSlider)
            : node
        }
        case "img": {
          return handleImage(node, imageSources, togglePhotoSlider)
        }
        case "pre": {
          return handleCodeBlock(node)
        }
        case "figure": {
          return handleFigure(node, imageSources, togglePhotoSlider, options)
        }
        case "video": {
          return handleVideo(node)
        }
        case "iframe": {
          return handleIframe(node)
        }
        case "table": {
          return handleContentTable(node)
        }
        default: {
          return node
        }
      }
    },
  }
  return options
}

const ArticleDetail = forwardRef((_, ref) => {
  const navigate = useNavigate()
  const { isBelowMedium } = useScreenWidth()

  const { activeContent } = useStore(contentState)
  const {
    articleWidth,
    edgeToEdgeImages,
    fontFamily,
    fontSize,
    lightboxSlideAnimation,
    titleAlignment,
  } = useStore(settingsState)
  const scrollContainerRef = useRef(null)

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, selectedIndex, setSelectedIndex } =
    usePhotoSlider()

  const handleAuthorFilter = () => {
    setFilterType("author")
    setFilterString(activeContent.author)
    if (isBelowMedium) {
      setActiveContent(null)
    }
  }

  const togglePhotoSlider = (index) => {
    setSelectedIndex(index)
    setIsPhotoSliderVisible((prev) => !prev)
  }

  const getLightboxAnimationConfig = () => {
    return lightboxSlideAnimation ? { fade: 250 } : { fade: 250, navigation: 0 }
  }

  const imageSources = extractImageSources(activeContent.content)
  const htmlParserOptions = getHtmlParserOptions(imageSources, togglePhotoSlider)

  const parsedHtml = ReactHtmlParser(activeContent.content, htmlParserOptions)
  const hasIframeTag = /<iframe[\s>]/i.test(activeContent.content || "")
  const bilibiliLinkInfo = parseBilibiliVideoUrl(activeContent.url)
  const fallbackBilibiliSrc =
    !hasIframeTag && bilibiliLinkInfo ? buildBilibiliEmbedSrc(bilibiliLinkInfo) : ""
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
    const lf = littlefoot()
    return () => {
      lf.unmount()
    }
  }, [activeContent.id])

  // Focus the scrollable area when activeContent changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollElement = scrollContainerRef.current.getScrollElement()
      scrollElement?.focus()
    }
  }, [activeContent.id])

  return (
    <article
      ref={ref}
      className={`article-content ${edgeToEdgeImages ? "edge-to-edge" : ""}`}
      tabIndex={-1}
    >
      <SimpleBar
        ref={scrollContainerRef}
        className="scroll-container"
        scrollableNodeProps={{ tabIndex: -1 }}
      >
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
            {fallbackBilibiliSrc && (
              <BilibiliIframe
                src={fallbackBilibiliSrc}
                attribs={{
                  title: activeContent.title || "Bilibili video",
                  width: "640",
                  height: "360",
                }}
              />
            )}
            {parsedHtml}
            <Lightbox
              animation={getLightboxAnimationConfig()}
              carousel={{ finite: true, padding: 0 }}
              close={() => setIsPhotoSliderVisible(false)}
              controller={{ closeOnBackdropClick: true }}
              index={selectedIndex}
              open={isPhotoSliderVisible}
              plugins={[Counter, Fullscreen, Zoom]}
              slides={imageSources.map((item) => ({ src: item }))}
              on={{
                view: ({ index }) => setSelectedIndex(index),
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
