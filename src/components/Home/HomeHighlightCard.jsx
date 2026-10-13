import ArticleEntry from "@/components/Article/ArticleEntry"
import ArticleGridCard from "@/components/Article/ArticleGridCard"

const HomeHighlightCard = ({ articleActivation, entry, observeRead, slot }) => (
  <ArticleEntry
    articleActivation={articleActivation}
    entry={entry}
    layout="card"
    observeRead={observeRead}
    presentationClassName={`home-highlight-card home-highlight-${slot}`}
    presenter={ArticleGridCard}
  />
)

export default HomeHighlightCard
