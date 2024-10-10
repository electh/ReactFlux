import { Card, Skeleton } from "@arco-design/web-react";

import { useStore } from "@nanostores/react";
import { contentState } from "../../store/contentState";
import { settingsState } from "../../store/settingsState";
import "./LoadingCards.css";

const LoadingCard = ({ layout, isArticleListReady }) => (
  <Card
    className="card-style"
    cover={layout === "large" ? <div className="card-cover-style" /> : null}
  >
    <Card.Meta
      description={
        <Skeleton
          loading={!isArticleListReady}
          animation={true}
          text={{ rows: 3, width: 150 }}
        />
      }
    />
  </Card>
);

const LoadingCards = () => {
  const { layout } = useStore(settingsState);
  const { isArticleListReady } = useStore(contentState);
  const cardCount = layout === "large" ? 2 : 4;

  return (
    !isArticleListReady &&
    Array.from({ length: cardCount }, (_, i) => (
      <LoadingCard
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        key={i}
        layout={layout}
        isArticleListReady={isArticleListReady}
      />
    ))
  );
};

export default LoadingCards;
