import { Card, Skeleton } from "@arco-design/web-react";

import { useStore } from "@nanostores/react";
import { contentState } from "../../store/contentState";
import { settingsState } from "../../store/settingsState";
import "./LoadingCards.css";

const LoadingCards = () => {
  const { layout } = useStore(settingsState);
  const { isArticleListReady } = useStore(contentState);
  const cardCount = layout === "large" ? 2 : 4;

  const renderCard = (index) => (
    <Card
      className="card-style"
      cover={layout === "large" ? <div className="card-cover-style" /> : null}
      key={index}
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

  return (
    !isArticleListReady &&
    Array.from({ length: cardCount }, (_, i) => renderCard(i))
  );
};

export default LoadingCards;
