import isURL from "validator/es/lib/isURL";
import { useStore } from "../../../store/Store";

const getFeedIcon = (feed) => {
  if (isURL(feed.site_url)) {
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${new URL(feed.site_url).hostname}`;
  } else {
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${new URL(feed.feed_url).hostname}`;
  }
};
export default function FeedIcon({ feed }) {
  const isDarkMode = useStore((state) => state.isDarkMode);
  return (
    <img
      src={getFeedIcon(feed)}
      alt={feed.title}
      style={{
        width: "16px",
        height: "16px",
        marginRight: "8px",
        borderRadius: "2px",
        padding: isDarkMode ? "2px" : 0,
        backgroundColor: isDarkMode ? "var(--color-text-1)" : "none",
      }}
    />
  );
}
