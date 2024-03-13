import { Card, Typography } from "@arco-design/web-react";
import { IconStarFill } from "@arco-design/web-react/icon";
import classNames from "classnames";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useContext } from "react";

import { ContentContext } from "../ContentContext";
import ImageWithLazyLoading from "../ImageWithLazyLoading";
import "./ArticleCard.css";

dayjs.extend(relativeTime);

export default function ArticleCardMini({ entry, handleEntryClick }) {
  const { activeContent } = useContext(ContentContext);

  return (
    <div style={{ marginBottom: "10px" }} key={entry.id}>
      <Card
        className={classNames("card-custom-hover-style", {
          "card-custom-selected-style": activeContent
            ? entry.id === activeContent.id
            : false,
        })}
        hoverable
        data-entry-id={entry.id}
        style={{ width: 300, cursor: "pointer" }}
        onClick={() => {
          handleEntryClick(entry);
        }}
        cover={null}
      >
        <Card.Meta
          description={
            <div style={{ display: "flex" }}>
              <div style={{ marginRight: "10px", flex: "1" }}>
                <Typography.Text
                  style={
                    entry.status === "unread"
                      ? { fontWeight: "500" }
                      : {
                          color: "var(--color-text-3)",
                          fontWeight: "500",
                        }
                  }
                >
                  {entry.title}
                </Typography.Text>
                <Typography.Text
                  style={{
                    color: "var(--color-text-3)",
                    fontSize: "13px",
                  }}
                >
                  <br />
                  {entry.feed.title.toUpperCase()}
                  <br />
                  {dayjs().to(dayjs(entry.created_at))}
                </Typography.Text>
                {entry.starred && (
                  <IconStarFill
                    style={{
                      fontSize: "13px",
                      marginLeft: "8px",
                      color: "var(--color-text-3)",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  display: entry.imgSrc ? "block" : "none",
                  width: "100px",
                  height: "100px",
                  overflow: "hidden",
                  borderRadius: "4px",
                }}
              >
                <ImageWithLazyLoading
                  width="100px"
                  height="100px"
                  alt={entry.id}
                  src={entry.imgSrc}
                  status={entry.status}
                  borderRadius="4px"
                />
              </div>
            </div>
          }
        />
      </Card>
    </div>
  );
}
