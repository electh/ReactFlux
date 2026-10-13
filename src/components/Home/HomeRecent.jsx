import ArticleEntry from "@/components/Article/ArticleEntry"
import ArticleGridCard from "@/components/Article/ArticleGridCard"
import useArticleListLayout from "@/hooks/useArticleListLayout"
import { projectRecentEntries } from "@/utils/home-editorial-projection"

import "@/components/Article/ArticleList.css"

const HomeRecent = ({
  articleActivation,
  entries,
  highlightIds,
  observeRead,
  recentIds,
  scrollRootRef,
}) => {
  const entryById = new Map(
    projectRecentEntries(entries, highlightIds).map((entry) => [entry.id, entry]),
  )
  const recentEntries = recentIds.map((id) => entryById.get(id)).filter(Boolean)
  const { cardColumnCount, virtualItems: rows } = useArticleListLayout({
    entries: recentEntries,
    layout: "card",
    scrollRootRef,
  })

  if (recentEntries.length === 0) {
    return null
  }

  return (
    <section aria-label="Recentes" className="home-recent">
      <h2 className="home-section-heading">Recentes</h2>
      <div role="list">
        {rows.map((row) => (
          <div
            key={row[0].id}
            className="article-card-grid-row"
            role="presentation"
            style={{ "--article-card-grid-columns": cardColumnCount }}
          >
            {row.map((entry) => (
              <div key={entry.id} className="article-card-grid-cell" role="listitem">
                <ArticleEntry
                  articleActivation={articleActivation}
                  entry={entry}
                  layout="card"
                  observeRead={observeRead}
                  presenter={ArticleGridCard}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default HomeRecent
