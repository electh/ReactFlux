import { getSecondHostname } from "../../utils/url";

const FeedIcon = ({ feed, className = "feed-icon" }) => {
  const hostname =
    getSecondHostname(feed.site_url) ?? getSecondHostname(feed.feed_url);
  const iconURL = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;

  return <img className={className} src={iconURL} alt="Feed icon" />;
};

export default FeedIcon;
