import { useEffect, useState } from "react";
import {
  getCachedIconURL,
  updateCachedIconURL,
  useGetFeedIcon,
} from "../../hooks/useFeedIcons";
import { getSecondHostname } from "../../utils/url";

const getFallbackIconURL = (feed) => {
  const hostname =
    getSecondHostname(feed.site_url) ?? getSecondHostname(feed.feed_url);
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
};

const handleError = (feed, setIconURL) => () => {
  setIconURL(getFallbackIconURL(feed));
};

const FeedIcon = ({ feed, className = "feed-icon" }) => {
  const feedIconId = feed.icon.icon_id;
  if (feedIconId === 0) {
    return <img className={className} src={getFallbackIconURL(feed)} alt="" />;
  }

  const cachedIconURL = getCachedIconURL(feedIconId);
  const [iconURL, setIconURL] = useState(
    () => cachedIconURL ?? getFallbackIconURL(feed),
  );

  const { data, isLoading } = useGetFeedIcon(feedIconId);

  useEffect(() => {
    if (!isLoading && data?.data) {
      const newIconURL = `data:${data.data}`;
      updateCachedIconURL(feedIconId, newIconURL);
      setIconURL(newIconURL);
    }
  }, [isLoading, data, feedIconId]);

  return (
    <img
      className={className}
      src={iconURL}
      alt=""
      onError={handleError(feed, setIconURL)}
    />
  );
};

export default FeedIcon;
