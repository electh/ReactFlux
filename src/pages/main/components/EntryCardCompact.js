import { Card, Typography } from "@arco-design/web-react";
import LazyLoadingImage from "./LazyLoadingImage";
import { useStore } from "../../../store/Store";
import "./EntryCard.css";
import classNames from "classnames";
import { formatDate } from "../../../utils/formatDate";
import { IconStarFill } from "@arco-design/web-react/icon";

const { Meta } = Card;

const EntryCardCompact = ({ entry }) => {
  const activeEntry = useStore((state) => state.activeEntry);
  const clickCard = useStore((state) => state.clickCard);

  const handelClickCard = (entry) => {
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
      style={{ width: "100%", marginBottom: "10px", cursor: "pointer" }}
      cover={null}
    >
      <Meta
        title={null}
        description={
          <div
            style={{
              color: "var(--color-text-3)",
              fontSize: "10px",
              display: "flex",
            }}
          >
            {entry.imgSrc ? (
              <div
                style={{
                  height: 70,
                  width: 70,
                  overflow: "hidden",
                  border: "1px solid var(--color-border-1)",
                  borderRadius: "4px",
                }}
              >
                <LazyLoadingImage
                  alt={entry.title}
                  src={entry.imgSrc}
                  width="70px"
                  height="70px"
                  status={entry.status}
                />
              </div>
            ) : null}
            <div style={{ flex: 1, marginLeft: 10 }}>
              <Typography.Text
                style={{
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
              <br />
              {entry.feed.title}
              <br />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {formatDate(entry.published_at)}
              </div>
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
          </div>
        }
      />
    </Card>
  );
};

export default EntryCardCompact;
