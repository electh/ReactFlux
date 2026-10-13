import { Button, Skeleton } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import { polyglotState } from "@/hooks/useLanguage"

const LoadingCard = ({ hasMedia = false, variant }) => (
  <div className={`home-loading-card home-loading-card-${variant}`}>
    {hasMedia && (
      <div className="home-loading-card-media">
        <Skeleton image animation={false} text={false} />
      </div>
    )}
    <div className="home-loading-card-copy">
      <Skeleton animation={false} text={{ rows: 2, width: ["72%", "92%"] }} />
    </div>
  </div>
)

const HomeLoadingState = () => (
  <div aria-busy="true" className="home-state-loading" role="status">
    <div className="home-loading-highlights">
      <LoadingCard hasMedia variant="primary" />
      <div className="home-loading-secondaries">
        {[true, false].map((hasMedia, slot) => (
          <LoadingCard key={slot} hasMedia={hasMedia} variant={`secondary-${slot + 1}`} />
        ))}
      </div>
    </div>
    <div
      aria-hidden="true"
      className="article-card-grid-row home-loading-recent"
      style={{ "--article-card-grid-columns": 3 }}
    >
      {[true, false, false].map((hasMedia, slot) => (
        <div key={slot} className="article-card-grid-cell" role="presentation">
          <LoadingCard hasMedia={hasMedia} variant="recent" />
        </div>
      ))}
    </div>
  </div>
)

const HomeStates = ({ initialError, isZeroUnread, refreshError, retryArticleList }) => {
  const { polyglot } = useStore(polyglotState)

  if (initialError) {
    return (
      <div className="home-state-error home-state-initial-error" role="alert">
        <p>{polyglot.t("article_list.load_error")}</p>
        <Button type="primary" onClick={() => void retryArticleList?.()}>
          {polyglot.t("actions.retry")}
        </Button>
      </div>
    )
  }

  if (refreshError) {
    return (
      <div className="home-state-error home-state-refresh-error" role="alert">
        <span>{polyglot.t("article_list.load_error")}</span>
        <Button size="small" onClick={() => void retryArticleList?.()}>
          {polyglot.t("actions.retry")}
        </Button>
      </div>
    )
  }

  if (isZeroUnread) {
    return (
      <div className="home-state-zero-unread" role="status">
        <p>{polyglot.t("article_list.no_unread_articles")}</p>
      </div>
    )
  }

  return null
}

HomeStates.Loading = HomeLoadingState

export default HomeStates
