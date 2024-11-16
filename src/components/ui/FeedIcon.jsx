import { useEffect, useRef, useState } from "react"

import useFeedIcons, { updateFeedIcon } from "@/hooks/useFeedIcons"
import { getSecondHostname } from "@/utils/url"

const DEFAULT_ICON_URL = "/default-feed-icon.png"

const getFallbackIconURL = (feed) => {
  const hostname = getSecondHostname(feed.site_url) ?? getSecondHostname(feed.feed_url)
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`
}

const FeedIcon = ({ feed, className = "feed-icon" }) => {
  const { icon_id: iconId } = feed.icon
  const fallbackIconURL = getFallbackIconURL(feed)

  const [iconURL, setIconURL] = useState(iconId === 0 ? fallbackIconURL : DEFAULT_ICON_URL)
  const [fallbackFailed, setFallbackFailed] = useState(false)

  const imgRef = useRef(null)

  const fetchedIcon = useFeedIcons(iconId)
  const fetchedIconURL = fetchedIcon?.url

  useEffect(() => {
    if (fetchedIconURL) {
      setIconURL(fetchedIconURL)
    } else if (iconId === 0 && !fallbackFailed) {
      setIconURL(fallbackIconURL)
    }
  }, [fetchedIconURL, iconId, fallbackFailed, fallbackIconURL])

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current
      if (naturalWidth > 100 && naturalHeight > 100 && fetchedIcon.width === null) {
        updateFeedIcon(iconId, { width: naturalWidth, height: naturalHeight })
      }
      if ((naturalWidth !== naturalHeight || naturalWidth === 0) && !fallbackFailed) {
        setIconURL(fallbackIconURL)
      }
    }
  }

  const handleError = () => {
    if (iconURL === fallbackIconURL && !fallbackFailed) {
      setFallbackFailed(true)
      setIconURL(DEFAULT_ICON_URL)
      return
    }

    if (!fallbackFailed) {
      setIconURL(fallbackIconURL)
    }
  }

  if (fallbackFailed) {
    return (
      <img
        alt=""
        className={className}
        src={DEFAULT_ICON_URL}
        style={{ borderRadius: "20%", backgroundColor: "rgba(255, 255, 255, 0.1)" }}
      />
    )
  }

  return (
    <img
      ref={imgRef}
      alt=""
      className={className}
      src={iconURL}
      style={{
        borderRadius: "20%",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      }}
      onError={handleError}
      onLoad={handleImageLoad}
    />
  )
}

export default FeedIcon
