import { Card, Skeleton } from "@arco-design/web-react";

import { useStore } from "../../Store";

export default function LoadingCards({ loading }) {
  const cards = [1, 2, 3, 4];
  const layout = useStore((state) => state.layout);

  return loading
    ? cards.map((card) =>
        layout === "large" ? (
          <Card
            style={{ width: 300, marginBottom: "10px" }}
            key={card}
            cover={
              <Skeleton
                loading={loading}
                animation={true}
                text={{ rows: 0 }}
                image={{
                  style: {
                    width: 300,
                    height: 160,
                  },
                }}
              />
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
        ) : (
          <Card
            style={{ width: 300, marginBottom: "10px" }}
            key={card}
            cover={null}
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
        ),
      )
    : null;
}
