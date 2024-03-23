import { Card, Typography } from "@arco-design/web-react";
import { IconStarFill } from "@arco-design/web-react/icon";
import classNames from "classnames";

import useStore from "../../Store";
import { generateRelativeTime } from "../../utils/Date";
import "./ArticleCard.css";
import ImageWithLazyLoading from "./ImageWithLazyLoading";

const ArticleCardMini = ({ entry, handleEntryClick }) => {
  const activeContent = useStore((state) => state.activeContent);
  const showFeedIcon = useStore((state) => state.showFeedIcon);

  const isSelected = activeContent && entry.id === activeContent.id;

  const entryClickHandler = () => handleEntryClick(entry);

  const FeedIcon = ({ url }) => (
    <img
      className="feed-icon-mini"
      src={`https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`}
      alt="Icon"
    />
  );

  const ArticleMiniCardContent = ({ entry, showFeedIcon }) => (
    <div
      style={{
        display: "flex",
        paddingLeft: showFeedIcon ? "22px" : "0",
      }}
    >
      <div style={{ marginRight: "10px", flex: 1 }}>
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
      {entry.imgSrc && (
        <div className="thumbnail">
          <ImageWithLazyLoading
            width={"100px"}
            height="100px"
            alt={entry.id}
            src={entry.imgSrc}
            status={entry.status}
            borderRadius="4px"
          />
        </div>
      )}
    </div>
  );

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
        cover={null}
      >
        <Card.Meta
          description={
            <ArticleMiniCardContent entry={entry} showFeedIcon={showFeedIcon} />
          }
        />
      </Card>
    </div>
  );
};

export default ArticleCardMini;
