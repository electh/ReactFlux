import isURL from "validator/es/lib/isURL";

const getFeedIcon = (feed) => {
  if (isURL(feed.site_url)) {
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${new URL(feed.site_url).hostname}`;
  } else {
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${new URL(feed.feed_url).hostname}`;
  }
};

export default function FeedIcon({ feed }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        width: "14px",
        height: "14px",
        padding: "2px",
        borderRadius: "2px",
        marginRight: "8px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <img
        src={getFeedIcon(feed)}
        alt={feed.title}
        style={{
          borderRadius: "2px",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
