import { Card, Typography } from "@arco-design/web-react";
import { IconStarFill } from "@arco-design/web-react/icon";
import classNames from "classnames";

import useStore from "../../Store";
import { generateRelativeTime } from "../../utils/Date";
import "./ArticleCard.css";
import ImageWithLazyLoading from "./ImageWithLazyLoading";

const FeedIcon = ({ url }) => (
  <img
    className="feed-icon"
    src={`https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`}
    alt="Icon"
  />
);

const ArticleCardContent = ({ entry, showFeedIcon }) => (
  <div>
    <Typography.Text
      className={entry.status === "unread" ? "title-unread" : "title-read"}
    >
      {entry.title}
    </Typography.Text>
    <Typography.Text className="article-info">
      <br />
      {showFeedIcon && <FeedIcon url={entry.feed.site_url} />}
      {entry.feed.title}
      <br />
      {generateRelativeTime(entry.published_at)}
    </Typography.Text>
    {entry.starred && <IconStarFill className="icon-starred" />}
  </div>
);

const ArticleCard = ({ entry, handleEntryClick }) => {
  const activeContent = useStore((state) => state.activeContent);
  const showFeedIcon = useStore((state) => state.showFeedIcon);

  const isSelected = activeContent && entry.id === activeContent.id;

  const entryClickHandler = () => handleEntryClick(entry);

  const coverImage = entry.imgSrc ? (
    <div className="cover-image">
      <ImageWithLazyLoading
        width={"100%"}
        height="160px"
        alt={entry.id}
        src={entry.imgSrc}
        status={entry.status}
      />
    </div>
  ) : null;

  return (
    <div className="article-card" key={entry.id}>
      <Card
        className={classNames("card-custom-hover-style", {
          "card-custom-selected-style": isSelected,
        })}
        hoverable
        data-entry-id={entry.id}
        style={{ width: "100%", cursor: "pointer" }}
        onClick={entryClickHandler}
        cover={coverImage}
      >
        <Card.Meta
          description={
            <ArticleCardContent entry={entry} showFeedIcon={showFeedIcon} />
          }
        />
      </Card>
    </div>
  );
};

export default ArticleCard;
