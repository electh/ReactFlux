import { Card, Skeleton } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import { contentState } from "@/store/contentState"

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

const LoadingCards = ({ layout = "column" }) => {
  const { isArticleListReady } = useStore(contentState, { keys: ["isArticleListReady"] })

  if (isArticleListReady) {
    return null
  }

  if (layout === "list") {
    return <LoadingListRows />
  }

  return Array.from({ length: 4 }, (_, index) => <LoadingCard key={index} />)
}

export default LoadingCards
