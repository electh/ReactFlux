import { getHostname } from "../../utils/url";

const FeedIcon = ({ feed, className = "feed-icon" }) => {
  const hostname = getHostname(feed.site_url) ?? getHostname(feed.feed_url);
  const iconURL = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;

  return <img className={className} src={iconURL} alt="Feed icon" />;
};

export default FeedIcon;
