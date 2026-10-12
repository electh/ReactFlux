import assert from "node:assert/strict"
import { test } from "node:test"

const { default: createArticleListRequestKey } = await import(
  new URL("article-list-request-key.js", import.meta.url)
)

const content = {
  infoFrom: "home",
  infoId: null,
  articleListRevision: 4,
  filterString: "search",
  filterDate: "2026-10-10",
}
const settings = {
  pageSize: 20,
  showHiddenFeeds: false,
  showStatus: "all",
  orderBy: "created_at",
  orderDirection: "asc",
}
const key = (changes = {}) =>
  createArticleListRequestKey({ content, settings, sessionRevision: 1, ...changes })

test("Home key ignores All-Unread status and sort preferences", () => {
  assert.equal(
    key({
      settings: {
        ...settings,
        showStatus: "starred",
        orderBy: "changed_at",
        orderDirection: "desc",
      },
    }),
    key(),
  )
  assert.equal(key({ content: { ...content, filterString: "other", filterDate: null } }), key())
})

test("Home key changes for page size visibility data-session/article-list revision", () => {
  assert.notEqual(key({ settings: { ...settings, pageSize: 30 } }), key())
  assert.notEqual(key({ settings: { ...settings, showHiddenFeeds: true } }), key())
  assert.notEqual(key({ sessionRevision: 2 }), key())
  assert.notEqual(key({ content: { ...content, articleListRevision: 5 } }), key())
  assert.equal(
    key({ content: { ...content, infoFrom: "all" }, info: { from: "home", id: null } }),
    key(),
  )
})

test("ordinary list keys still include their existing filters and sort settings", () => {
  for (const infoFrom of ["all", "today", "feed", "category"]) {
    const ordinary = { ...content, infoFrom }
    const baseline = key({ content: ordinary })
    for (const field of ["filterString", "filterDate", "articleListRevision", "infoId"]) {
      assert.notEqual(key({ content: { ...ordinary, [field]: "different" } }), baseline, field)
    }
    for (const field of ["showStatus", "orderBy", "orderDirection", "pageSize"]) {
      assert.notEqual(
        key({ content: ordinary, settings: { ...settings, [field]: "different" } }),
        baseline,
        field,
      )
    }
    assert.equal(key({ content: ordinary, sessionRevision: 2 }), baseline)
  }
})
