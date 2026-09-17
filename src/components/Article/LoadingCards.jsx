import { Card, Skeleton } from "@arco-design/web-react"

import "./LoadingCards.css"

const LoadingCard = () => (
  <Card className="card-style" cover={null}>
    <Card.Meta description={<Skeleton animation loading text={{ rows: 3, width: 150 }} />} />
  </Card>
)

const LoadingListRows = () => (
  <div aria-busy="true" className="list-loading-rows">
    {Array.from({ length: 8 }, (_, index) => (
      <div key={index} className="list-loading-row">
        <Skeleton animation text={{ rows: 1, width: "100%" }} />
      </div>
    ))}
  </div>
)

const LoadingCardGrid = ({ columnCount }) => (
  <div
    aria-busy="true"
    className="grid-card-loading-grid"
    style={{ "--article-card-grid-columns": columnCount }}
  >
    {Array.from({ length: columnCount * 2 }, (_, index) => (
      <div key={index} className="grid-card-loading-item">
        <div className="grid-card-loading-media">
          <Skeleton animation image text={false} />
        </div>
        <div className="grid-card-loading-copy">
          <Skeleton animation text={{ rows: 3, width: ["45%", "100%", "70%"] }} />
        </div>
      </div>
    ))}
  </div>
)

const LoadingCards = ({ cardColumnCount = 1, layout = "column", loading }) => {
  if (!loading) {
    return null
  }

  if (layout === "card") {
    return <LoadingCardGrid columnCount={cardColumnCount} />
  }

  if (layout === "list") {
    return <LoadingListRows />
  }

  return Array.from({ length: 4 }, (_, index) => <LoadingCard key={index} />)
}

export default LoadingCards
