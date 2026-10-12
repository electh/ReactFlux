import assert from "node:assert/strict"
import { test } from "node:test"

const { hasArticleListFilters, shouldRefreshArticleListTotal } = await import(
  new URL("article-list-filters.js", import.meta.url)
)

test("search and non-today date filters use the query total", () => {
  assert.equal(
    hasArticleListFilters({ infoFrom: "feed", filterString: "climate", filterDate: null }),
    true,
  )
  assert.equal(
    hasArticleListFilters({ infoFrom: "category", filterString: "", filterDate: "2026-10-10" }),
    true,
  )
  assert.equal(
    shouldRefreshArticleListTotal(
      { infoFrom: "feed", filterString: "climate", filterDate: null },
      { showStatus: "unread" },
    ),
    true,
  )
})

test('the "today" route keeps its date-scoped count exception', () => {
  const content = { infoFrom: "today", filterString: "", filterDate: "2026-10-11" }

  assert.equal(hasArticleListFilters(content), false)
  assert.equal(shouldRefreshArticleListTotal(content, { showStatus: "unread" }), false)
})

test("filtered starred and history lists refresh their query totals", () => {
  assert.equal(
    shouldRefreshArticleListTotal(
      { infoFrom: "starred", filterString: "design", filterDate: null },
      { showStatus: "all" },
    ),
    true,
  )
  assert.equal(
    shouldRefreshArticleListTotal(
      { infoFrom: "history", filterString: "", filterDate: "2026-10-09" },
      { showStatus: "all" },
    ),
    true,
  )
})

test("starred feed and category views refresh totals after mutations", () => {
  assert.equal(
    shouldRefreshArticleListTotal(
      { infoFrom: "feed", filterString: "", filterDate: null },
      { showStatus: "starred" },
    ),
    true,
  )
  assert.equal(
    shouldRefreshArticleListTotal(
      { infoFrom: "category", filterString: "", filterDate: null },
      { showStatus: "starred" },
    ),
    true,
  )
})
