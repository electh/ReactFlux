import { Divider, Tag, Typography } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import ReactHtmlParser, { attributesToProps, domToReact } from "html-react-parser"
import { littlefoot } from "littlefoot"
import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useNavigate } from "react-router"
import SimpleBar from "simplebar-react"

import ArticleEnclosures from "./ArticleEnclosures"
import EnclosurePlayer from "./EnclosurePlayer"
import ImageLinkTag from "./ImageLinkTag"
import ImageOverlayButton from "./ImageOverlayButton"

import CustomLink from "@/components/ui/CustomLink"
import FadeTransition from "@/components/ui/FadeTransition"
import PlyrPlayer from "@/components/ui/LazyPlyrPlayer"
import usePhotoSlider from "@/hooks/usePhotoSlider"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  setActiveContent,
  setFilterString,
  setFilterType,
} from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import returnToArticleImage from "@/utils/article-image-return"
import { generateReadableDate, generateReadingTime } from "@/utils/date"
import buildArticleImageModel from "@/utils/images"
import "./ArticleDetail.css"
import "./littlefoot.css"

const ArticleLightbox = lazy(() => import("./ArticleLightbox"))
const CodeBlock = lazy(() => import("./CodeBlock"))

const renderCodeBlock = (codeContent) => (
  <Suspense
    fallback={
      <pre aria-busy="true" className="code-block-loading">
        <code>{codeContent}</code>
      </pre>
    }
  >
    <CodeBlock>{codeContent}</CodeBlock>
  </Suspense>
)

const handleLinkWithImage = (node, getImageIndex, togglePhotoSlider) => {
  const imgNodes = node.children.filter((child) => child.type === "tag" && child.name === "img")

  if (imgNodes.length > 0) {
    // If there are multiple images, render them with link display
    if (imgNodes.length > 1) {
      return (
        <div className="image-wrapper">
          <div className="image-container">
            {imgNodes.map((imgNode, index) => (
              <div key={`link-img-${index}`}>
                {handleImage(imgNode, getImageIndex, togglePhotoSlider)}
              </div>
            ))}
            <ImageLinkTag href={node.attribs.href} />
          </div>
        </div>
      )
    }

    // Single image case
    const index = getImageIndex(imgNodes[0].attribs.src)
    if (index < 0) {
      return node
    }

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

const handleImage = (node, getImageIndex, togglePhotoSlider) => {
  const bskyVideoPlayer = handleBskyVideo(node)
  if (bskyVideoPlayer) {
    return bskyVideoPlayer
  }

  const index = getImageIndex(node.attribs.src)
  if (index < 0) {
    return <img {...attributesToProps(node.attribs, "img")} />
  }

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
      const props = attributesToProps(child.attribs, child.name)

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

const handleFigure = (node, getImageIndex, togglePhotoSlider, options) => {
  const firstChild = node.children[0]
  const hasImages = node.children.some((child) => child.name === "img")

  // Handle code blocks wrapped in figure
  if (firstChild?.name === "pre") {
    const codeContent = decodeAndParseCodeContent(firstChild)
    return codeContent ? renderCodeBlock(codeContent) : null
  }

  // Handle table-based code blocks with line numbers
  if (firstChild?.name === "table") {
    const codeContent = handleTableBasedCode(firstChild)
    return codeContent ? renderCodeBlock(codeContent) : null
  }

  // Handle multiple images in figure with figcaption support
  if (hasImages) {
    return (
      <figure>
        {node.children.map((child, index) => {
          if (child.name === "img") {
            return (
              <div key={`figure-img-${index}`}>
                {handleImage(child, getImageIndex, togglePhotoSlider)}
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

  return renderCodeBlock(codeContent)
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

const handleIframe = (node) => {
  const src = node.attribs?.src

  // Check if it's a YouTube iframe
  if (src && (src.includes("youtube.com") || src.includes("youtube-nocookie.com"))) {
    return (
      <iframe
        {...attributesToProps(node.attribs, "iframe")}
        referrerPolicy="strict-origin-when-cross-origin"
      />
    )
  }

  return node
}

const getHtmlParserOptions = (getImageIndex, togglePhotoSlider) => {
  const options = {
    replace: (node) => {
      if (node.type !== "tag") {
        return node
      }

      switch (node.name) {
        case "a": {
          return node.children.length > 0
            ? handleLinkWithImage(node, getImageIndex, togglePhotoSlider)
            : node
        }
        case "img": {
          return handleImage(node, getImageIndex, togglePhotoSlider)
        }
        case "pre": {
          return handleCodeBlock(node)
        }
        case "figure": {
          return handleFigure(node, getImageIndex, togglePhotoSlider, options)
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
  const photoSliderSessionRef = useRef(null)
  const preparedPhotoSliderSessionRef = useRef(false)
  const previousPhotoSliderVisibleRef = useRef(false)
  const [enclosuresOpenState, setEnclosuresOpenState] = useState({ articleId: null, open: false })
  const [hasOpenedPhotoSlider, setHasOpenedPhotoSlider] = useState(false)

  const {
    completePhotoSliderClose,
    isPhotoSliderCloseRequested,
    isPhotoSliderVisible,
    markPhotoSliderClosing,
    openPhotoSlider,
    selectedIndex,
    setSelectedIndex,
  } = usePhotoSlider()

  const handleAuthorFilter = () => {
    setFilterType("author")
    setFilterString(activeContent.author)
    if (isBelowMedium) {
      setActiveContent(null)
    }
  }

  const capturePhotoSliderSession = useCallback(
    (index, { targetElement = null } = {}) => {
      const scrollElement = scrollContainerRef.current?.getScrollElement()
      if (!scrollElement) {
        return false
      }

      const openingTarget = targetElement?.isConnected ? targetElement : null
      photoSliderSessionRef.current = {
        articleId: activeContent.id,
        currentIndex: index,
        hasViewedDifferentSlide: false,
        openingIndex: index,
        openingInstanceId: openingTarget?.dataset.articleImageInstance ?? null,
        openingScrollTop: scrollElement.scrollTop,
        openingTarget,
        openingViewportCenter: scrollElement.scrollTop + scrollElement.clientHeight / 2,
        pendingReturnIndex: null,
      }
      return true
    },
    [activeContent.id],
  )

  const togglePhotoSlider = useCallback(
    (index, source) => {
      preparedPhotoSliderSessionRef.current = capturePhotoSliderSession(index, source)
      setHasOpenedPhotoSlider(true)
      openPhotoSlider(index)
    },
    [capturePhotoSliderSession, openPhotoSlider],
  )

  const getLightboxAnimationConfig = () => {
    return lightboxSlideAnimation ? { fade: 250 } : { fade: 250, navigation: 0 }
  }

  const attachments = activeContent.attachments ?? {
    items: [],
    primaryMedia: null,
  }
  const { items: attachmentItems, primaryMedia } = attachments
  const { getImageIndex, imageSources, visibleAttachments } = buildArticleImageModel(
    activeContent.content,
    attachmentItems,
  )
  const enclosuresOpen =
    enclosuresOpenState.articleId === activeContent.id && enclosuresOpenState.open
  const htmlParserOptions = getHtmlParserOptions(getImageIndex, togglePhotoSlider)

  const parsedHtml = ReactHtmlParser(activeContent.content, htmlParserOptions)

  const handlePhotoSliderView = ({ index }) => {
    const session = photoSliderSessionRef.current
    if (session) {
      session.currentIndex = index
      if (index !== session.openingIndex) {
        session.hasViewedDifferentSlide = true
      }
    }
    setSelectedIndex(index)
  }

  const handlePhotoSliderExiting = () => {
    markPhotoSliderClosing()

    const session = photoSliderSessionRef.current
    if (!session || session.articleId !== activeContent.id) {
      return
    }

    const index = session.currentIndex
    session.pendingReturnIndex = index

    const isAttachmentSlide = visibleAttachments.some(
      ({ galleryIndex }) => Number.isInteger(galleryIndex) && galleryIndex === index,
    )
    if (isAttachmentSlide) {
      setEnclosuresOpenState({ articleId: activeContent.id, open: true })
    }
  }

  const handlePhotoSliderExited = () => {
    const session = photoSliderSessionRef.current
    const scrollElement = scrollContainerRef.current?.getScrollElement()

    if (
      !session ||
      session.pendingReturnIndex === null ||
      !scrollElement ||
      session.articleId !== activeContent.id
    ) {
      return
    }

    const galleryIndex = session.pendingReturnIndex
    session.pendingReturnIndex = null
    const isCurrentSession = () => photoSliderSessionRef.current === session

    void returnToArticleImage({
      galleryIndex,
      hasViewedDifferentSlide: session.hasViewedDifferentSlide,
      isCurrent: isCurrentSession,
      openingIndex: session.openingIndex,
      openingInstanceId: session.openingInstanceId,
      openingScrollTop: session.openingScrollTop,
      openingTarget: session.openingTarget,
      openingViewportCenter: session.openingViewportCenter,
      scrollElement,
    }).then(() => {
      if (isCurrentSession()) {
        photoSliderSessionRef.current = null
      }
      return null
    })
  }

  const handleEnclosuresOpenChange = (open) => {
    setEnclosuresOpenState({ articleId: activeContent.id, open })
  }

  const { id: categoryId, title: categoryTitle } = activeContent.feed.category
  const { id: feedId, title: feedTitle } = activeContent.feed

  const { coverSource } = activeContent

  const getResponsiveMaxWidth = () => {
    if (isBelowMedium) {
      return "90%"
    }
    return `${articleWidth}ch`
  }

  useLayoutEffect(() => {
    return () => {
      photoSliderSessionRef.current = null
      preparedPhotoSliderSessionRef.current = false
    }
  }, [activeContent.id])

  useLayoutEffect(() => {
    const wasPhotoSliderVisible = previousPhotoSliderVisibleRef.current

    if (isPhotoSliderVisible && !wasPhotoSliderVisible) {
      if (!preparedPhotoSliderSessionRef.current) {
        capturePhotoSliderSession(selectedIndex)
      }
      preparedPhotoSliderSessionRef.current = false
    } else if (!isPhotoSliderVisible) {
      preparedPhotoSliderSessionRef.current = false
    }

    previousPhotoSliderVisibleRef.current = isPhotoSliderVisible
  }, [capturePhotoSliderSession, isPhotoSliderVisible, selectedIndex])

  useEffect(() => {
    if (isPhotoSliderVisible) {
      setHasOpenedPhotoSlider(true)
    }
  }, [isPhotoSliderVisible])

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
            {primaryMedia && (
              <EnclosurePlayer
                key={primaryMedia.id ?? primaryMedia.url}
                enclosure={primaryMedia}
                poster={coverSource}
              />
            )}
            {parsedHtml}
            <ArticleEnclosures
              items={visibleAttachments}
              open={enclosuresOpen}
              onImagePreview={togglePhotoSlider}
              onOpenChange={handleEnclosuresOpenChange}
            />
            {hasOpenedPhotoSlider && (
              <Suspense fallback={null}>
                <ArticleLightbox
                  animation={getLightboxAnimationConfig()}
                  closeRequested={isPhotoSliderCloseRequested}
                  index={selectedIndex}
                  open={isPhotoSliderVisible}
                  slides={imageSources.map((src) => ({ src }))}
                  onClose={completePhotoSliderClose}
                  onExited={handlePhotoSliderExited}
                  onExiting={handlePhotoSliderExiting}
                  onView={handlePhotoSliderView}
                />
              </Suspense>
            )}
          </div>
        </FadeTransition>
      </SimpleBar>
    </article>
  )
})
ArticleDetail.displayName = "ArticleDetail"

export default ArticleDetail
