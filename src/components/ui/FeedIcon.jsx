import { useEffect, useRef, useState } from "react"

import useFeedIcons from "@/hooks/useFeedIcons"
import { getSecondHostname } from "@/utils/url"

const getFallbackIconURL = (feed) => {
  const hostname = getSecondHostname(feed.site_url) ?? getSecondHostname(feed.feed_url)
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`
}

const FeedIcon = ({ feed, className = "feed-icon" }) => {
  const { icon_id: iconId } = feed.icon
  const fallbackIconURL = getFallbackIconURL(feed)

  const [iconURL, setIconURL] = useState(fallbackIconURL)

  const imgRef = useRef(null)

  const fetchedIconURL = useFeedIcons(iconId)

  useEffect(() => {
    if (fetchedIconURL) {
      setIconURL(fetchedIconURL)
    }
  }, [fetchedIconURL])

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current
      if (naturalWidth !== naturalHeight) {
        setIconURL(fallbackIconURL)
      }
    }
  }

  if (iconId === 0) {
    return (
      <img alt="" className={className} src={fallbackIconURL} style={{ borderRadius: "20%" }} />
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
      onError={() => setIconURL(fallbackIconURL)}
      onLoad={handleImageLoad}
    />
  )
}

export default FeedIcon
