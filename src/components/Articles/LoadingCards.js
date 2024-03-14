import { Card, Skeleton } from "@arco-design/web-react";

import { useStore } from "../../Store";

export default function LoadingCards({ loading }) {
  const layout = useStore((state) => state.layout);
  const cardCount = layout === "large" ? 2 : 4;

  return loading
    ? Array.from({ length: cardCount }, (_, index) =>
        layout === "large" ? (
          <Card
            style={{ width: 300, marginBottom: "10px" }}
            key={index}
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
            key={index}
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
