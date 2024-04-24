import isURL from "validator/lib/isURL";
import { getBaseUrl } from "../../utils/url";

const FeedIcon = ({ feed, className = "feed-icon" }) => {
  const url = isURL(feed.site_url) ? feed.site_url : getBaseUrl(feed.feed_url);
  const { hostname } = new URL(url);
  const iconURL = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;

  return <img className={className} src={iconURL} alt="Feed icon" />;
};

export default FeedIcon;
