import { Divider, Tag, Typography } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { forwardRef, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import SimpleBar from "simplebar-react"

import ArticleBodyRenderer from "./ArticleBodyRenderer"

import CustomLink from "@/components/ui/CustomLink"
import FadeTransition from "@/components/ui/FadeTransition"
import usePhotoSlider from "@/hooks/usePhotoSlider"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  setActiveContent,
  setFilterString,
  setFilterType,
} from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { generateReadableDate, generateReadingTime, generateRelativeTime } from "@/utils/date"
import "./ArticleDetail.css"

const ArticleDetail = forwardRef((_, ref) => {
  const navigate = useNavigate()
  const { isBelowMedium } = useScreenWidth()

  const { activeContent } = useStore(contentState)
  const {
    articleWidth,
    fontFamily,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
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

  const { id: categoryId, title: categoryTitle } = activeContent.feed.category
  const { id: feedId, title: feedTitle } = activeContent.feed

  const getResponsiveMaxWidth = () => {
    if (isBelowMedium) {
      return "90%"
    }
    return `min(${articleWidth}%, calc(100% - (var(--article-side-gutter) * 2)))`
  }

  // Focus the scrollable area when activeContent changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollElement = scrollContainerRef.current.getScrollElement()
      scrollElement?.focus()
    }
  }, [activeContent.id])

  return (
    <article ref={ref} className="article-content" tabIndex={-1}>
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
            <div
              className="article-meta article-detail-meta"
              style={{ justifyContent: titleAlignment === "center" ? "center" : undefined }}
            >
              <div className="article-detail-source">
                <span className="article-detail-source-title">
                  <CustomLink text={feedTitle} url={`/feed/${feedId}`} />
                </span>
                {activeContent.author ? (
                  <span className="article-detail-author" onClick={handleAuthorFilter}>
                    {activeContent.author}
                  </span>
                ) : null}
              </div>
              {categoryTitle ? (
                <span className="article-detail-meta-item">
                  <Tag
                    className="article-detail-category"
                    size="small"
                    onClick={() => navigate(`/category/${categoryId}`)}
                  >
                    {categoryTitle}
                  </Tag>
                </span>
              ) : null}
              <span className="article-detail-meta-item">
                {generateReadableDate(activeContent.published_at)}
              </span>
              <span className="article-detail-meta-item">
                {generateRelativeTime(activeContent.published_at, showDetailedRelativeTime)}
              </span>
              {showEstimatedReadingTime ? (
                <span className="article-detail-meta-item">
                  {generateReadingTime(activeContent.reading_time)}
                </span>
              ) : null}
            </div>
            <Divider />
          </div>
          <ArticleBodyRenderer
            entry={activeContent}
            maxWidth={getResponsiveMaxWidth()}
            lightboxState={{
              isPhotoSliderVisible,
              selectedIndex,
              setIsPhotoSliderVisible,
              setSelectedIndex,
            }}
          />
        </FadeTransition>
      </SimpleBar>
    </article>
  )
})
ArticleDetail.displayName = "ArticleDetail"

export default ArticleDetail
