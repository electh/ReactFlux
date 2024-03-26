import { Card, Skeleton } from "@arco-design/web-react";
import React from "react";

import useStore from "../../Store";

const LoadingCards = ({ loading }) => {
  const layout = useStore((state) => state.layout);
  const cardCount = layout === "large" ? 2 : 4;

  const renderCard = (index) => (
    <Card
      key={index}
      style={{ width: "100%", marginBottom: "10px" }}
      cover={
        layout === "large" && (
          <Skeleton
            loading={loading}
            animation={true}
            text={{ rows: 0 }}
            image={{ style: { width: "100%", height: 160 } }}
          />
        )
      }
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
