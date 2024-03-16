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

export default function ArticleCard({ entry, handleEntryClick }) {
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
        style={{ width: "100%", cursor: "pointer" }}
        onClick={() => {
          handleEntryClick(entry);
        }}
        cover={
          <div
            style={{
              display: entry.imgSrc ? "block" : "none",
              height: 160,
              overflow: "hidden",
              borderBottom: "1px solid var(--color-border-1)",
            }}
          >
            <ImageWithLazyLoading
              width={"100%"}
              height="160px"
              alt={entry.id}
              src={entry.imgSrc}
              status={entry.status}
            />
          </div>
        }
      >
        <Card.Meta
          description={
            <div>
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
                {entry.feed.title}
                <br />
                {dayjs().to(dayjs(entry.published_at))}
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
          }
        />
      </Card>
    </div>
  );
}
