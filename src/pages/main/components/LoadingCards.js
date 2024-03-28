import { Card, Skeleton } from "@arco-design/web-react";

import { useConfigStore } from "../../../store/configStore";

const LoadingCards = ({ loading }) => {
  const layout = useConfigStore((state) => state.layout);
  const cardCount = layout === "expensive" ? 2 : 4;

  const renderCard = (index) => (
    <div style={{ padding: "0 10px" }}>
      <Card
        key={index}
        style={{ width: "100%", marginBottom: "10px" }}
        cover={
          layout === "expensive" && (
            <div style={{ width: "100%", aspectRatio: "16/9" }} />
          )
        }
      >
        <Card.Meta
          description={
            <Skeleton
              loading={loading}
              animation={true}
              text={{ rows: layout === "expensive" ? 2 : 3 }}
            />
          }
        />
      </Card>
    </div>
  );

  return loading
    ? Array.from({ length: cardCount }, (_, i) => renderCard(i))
    : null;
};

export default LoadingCards;
