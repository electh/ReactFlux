import { Card, Skeleton } from "@arco-design/web-react";

import useStore from "../../Store";

const LoadingCards = ({ loading }) => {
  const layout = useStore((state) => state.layout);
  const cardCount = layout === "large" ? 2 : 4;

  return loading
    ? Array.from({ length: cardCount }, (_, index) =>
        layout === "large" ? (
          <Card
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            style={{ width: "100%", marginBottom: "10px" }}
            cover={
              <Skeleton
                loading={loading}
                animation={true}
                text={{ rows: 0 }}
                image={{
                  style: {
                    width: "100%",
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
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            style={{ width: "100%", marginBottom: "10px" }}
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
};

export default LoadingCards;
