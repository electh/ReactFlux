import { Card, Skeleton } from "@arco-design/web-react";

export default function LoadingCards({ loading }) {
  const cards = [1, 2, 3, 4];

  return loading
    ? cards.map((card) => (
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
      ))
    : null;
}
