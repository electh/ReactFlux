import { Card, Skeleton } from "@arco-design/web-react";

import { useStore } from "@nanostores/react";
import { contentState } from "../../store/contentState";
import "./LoadingCards.css";

const LoadingCard = ({ isArticleListReady }) => (
  <Card className="card-style" cover={null}>
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
  const { isArticleListReady } = useStore(contentState);

  return (
    !isArticleListReady &&
    Array.from({ length: 4 }, (_, i) => (
      <LoadingCard
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        key={i}
        isArticleListReady={isArticleListReady}
      />
    ))
  );
};

export default LoadingCards;
