import { useEffect, useState } from "react";
import useFeedIcons from "../../hooks/useFeedIcons";
import { getSecondHostname } from "../../utils/url";

const getFallbackIconURL = (feed) => {
  const hostname =
    getSecondHostname(feed.site_url) ?? getSecondHostname(feed.feed_url);
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
};

const FeedIcon = ({ feed, className = "feed-icon" }) => {
  const { icon_id: iconId } = feed.icon;
  const fallbackIconURL = getFallbackIconURL(feed);

  if (iconId === 0) {
    return <img className={className} src={fallbackIconURL} alt="" />;
  }

  const [iconURL, setIconURL] = useState(fallbackIconURL);

  const fetchedIconURL = useFeedIcons(iconId);

  useEffect(() => {
    if (fetchedIconURL) {
      setIconURL(fetchedIconURL);
    }
  }, [fetchedIconURL]);

  return (
    <img
      className={className}
      src={iconURL}
      alt=""
      onError={() => setIconURL(fallbackIconURL)}
    />
  );
};

export default FeedIcon;
