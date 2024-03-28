import { Card, Space, Typography } from "@arco-design/web-react";
import LazyLoadingImage from "./LazyLoadingImage";
import { useStore } from "../../../store/Store";
import "./EntryCard.css";
import classNames from "classnames";
import { formatDate } from "../../../utils/formatDate";
import { IconStarFill } from "@arco-design/web-react/icon";
import { useNavigate, useSearchParams } from "react-router-dom";

const { Meta } = Card;

const EntryCardCompact = ({ entry, children }) => {
  const activeEntry = useStore((state) => state.activeEntry);
  const clickCard = useStore((state) => state.clickCard);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const from = params.get("from") || "all";
  const id = params.get("id") || "";

  const formatURL = (from, id, entry) => {
    if (from === "all") {
      return `/?entry=${entry.id}`;
    } else {
      return id === ""
        ? `/?from=${from}&entry=${entry.id}`
        : `/?from=${from}&id=${id}&entry=${entry.id}`;
    }
  };

  const handelClickCard = (entry) => {
    nav(formatURL(from, id, entry));
    clickCard(entry);
  };
  return (
    <Card
      hoverable
      className={classNames(
        "card-custom-hover-style",
        { selected: entry.id === activeEntry?.id },
        { read: entry.status === "card-read" },
      )}
      onClick={() => {
        handelClickCard(entry);
      }}
      style={{
        width: "100%",
        marginBottom: "10px",
        cursor: "pointer",
        borderRadius: "8px",
        overflow: "hidden",
      }}
      cover={null}
    >
      <Meta
        title={null}
        description={
          <div
            style={{
              color: "var(--color-text-3)",
              fontSize: "12px",
              display: "flex",
            }}
          >
            {entry.imgSrc ? (
              <div
                style={{
                  height: 80,
                  aspectRatio: 1,
                  overflow: "hidden",
                  border: "1px solid var(--color-border-1)",
                  borderRadius: "4px",
                  marginRight: "10px",
                  position: "relative",
                }}
              >
                <LazyLoadingImage
                  alt={entry.title}
                  src={entry.imgSrc}
                  className="card-cover"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    position: "absolute",
                  }}
                  status={entry.status}
                />
              </div>
            ) : null}
            <div style={{ flex: 1 }}>
              <Space direction="vertical" size={4}>
                <Typography.Text
                  style={{
                    lineHeight: "1em",
                    fontSize: "14px",
                    fontWeight: 500,
                    color:
                      entry.status === "unread"
                        ? "var(--color-text-1)"
                        : "var(--color-text-3)",
                  }}
                >
                  {entry.title}
                </Typography.Text>
                {entry.feed.title.toUpperCase()}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {formatDate(entry.published_at)}
                </div>
              </Space>
              {entry.starred && (
                <IconStarFill
                  style={{
                    position: "absolute",
                    right: "12px",
                    bottom: "12px",
                  }}
                />
              )}
            </div>
            <div>{children}</div>
          </div>
        }
      />
    </Card>
  );
};

export default EntryCardCompact;
