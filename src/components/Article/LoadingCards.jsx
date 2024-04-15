import { Card, Skeleton } from "@arco-design/web-react";
import React from "react";

import { useConfigAtom } from "../../hooks/useConfigAtom";

import "./LoadingCards.css";

const LoadingCards = ({ loading }) => {
  const { config } = useConfigAtom();
  const { layout } = config;
  const cardCount = layout === "large" ? 2 : 4;

  const renderCard = (index) => (
    <Card
      className="card-style"
      cover={layout === "large" && <div className="card-cover-style" />}
      key={index}
    >
      <Card.Meta
        description={
          <Skeleton
            loading={loading}
            animation={true}
            text={{ rows: 3, width: 150 }}
          />
        }
      />
    </Card>
  );

  return loading
    ? Array.from({ length: cardCount }, (_, i) => renderCard(i))
    : null;
};

export default LoadingCards;
