import assert from "node:assert/strict"
import { test } from "node:test"

const { selectBackfillCandidate, selectInitialHighlightIds, projectRecentEntries } = await import(
  new URL("home-editorial-projection.js", import.meta.url)
)

const entry = (id, published_at, options = {}) => ({
  id,
  status: "unread",
  published_at,
  feed: options.feed,
  coverSource: options.coverSource ?? null,
  coverCandidates: options.coverCandidates,
})

test("selects zero through three highlights from eligible unread entries", () => {
  const entries = [
    entry(6, "2026-10-06", { feed: { id: 3 } }),
    entry(5, "2026-10-05", { feed: { id: 2 } }),
    entry(4, "2026-10-04", { feed: { id: 1 } }),
    { ...entry(3, "2026-10-09"), status: "read" },
  ]

  assert.deepEqual(selectInitialHighlightIds([]), [])
  assert.deepEqual(selectInitialHighlightIds([{ ...entries[3], status: "read" }]), [])
  assert.deepEqual(selectInitialHighlightIds(entries.slice(0, 1)), [6])
  assert.deepEqual(selectInitialHighlightIds(entries.slice(0, 2)), [6, 5])
  assert.deepEqual(selectInitialHighlightIds(entries), [6, 5, 4])
})

test("chooses newest primary with ascending id timestamp tie", () => {
  const entries = [entry(9, "2026-10-10"), entry(2, "2026-10-10"), entry(1, "2026-10-09")]
  assert.deepEqual(selectInitialHighlightIds(entries), [2, 9, 1])
})

test("applies source then category then recency then image then ascending id", () => {
  const primary = entry(1, "2026-10-10", { feed: { id: 1, category: { id: 1 } } })
  const sameSource = entry(2, "2026-10-09", { feed: { id: 1, category: { id: 2 } } })
  const distinctSource = entry(3, "2026-10-08", { feed: { id: 2, category: { id: 1 } } })
  const distinctSourceAndCategory = entry(4, "2026-10-07", {
    feed: { id: 3, category: { id: 3 } },
  })
  assert.deepEqual(
    selectInitialHighlightIds([sameSource, primary, distinctSource, distinctSourceAndCategory]),
    [1, 4, 3],
  )

  const imageWinsOnlyWhenHigherPreferencesAndRecencyTie = [
    entry(10, "2026-10-10", { feed: { id: 1 } }),
    entry(8, "2026-10-09", { feed: { id: 2 } }),
    entry(7, "2026-10-09", { feed: { id: 2 }, coverSource: "https://image.test/a.jpg" }),
  ]
  assert.deepEqual(
    selectInitialHighlightIds(imageWinsOnlyWhenHigherPreferencesAndRecencyTie),
    [10, 7, 8],
  )

  const equalComparators = [
    entry(9, "2026-10-09", { feed: { id: 2 } }),
    entry(6, "2026-10-09", { feed: { id: 2 } }),
  ]
  assert.equal(
    selectBackfillCandidate(equalComparators, [entry(1, "2026-10-10", { feed: { id: 1 } })]),
    equalComparators[1],
  )
})

test("keeps selection valid when source or category metadata is missing or shared", () => {
  const entries = [entry(1, "2026-10-10"), entry(2, "2026-10-09"), entry(3, "2026-10-08")]
  assert.deepEqual(selectInitialHighlightIds(entries), [1, 2, 3])
})

test("never uses image to choose primary or determine eligibility", () => {
  const entries = [
    entry(1, "2026-10-10", { coverSource: "https://image.test/a.jpg" }),
    entry(2, "2026-10-11"),
    { ...entry(3, "2026-10-12", { coverSource: "https://image.test/c.jpg" }), status: "read" },
  ]
  assert.deepEqual(selectInitialHighlightIds(entries), [2, 1])
})

test("deduplicates presentation by entry id only", () => {
  const repeated = entry(5, "2026-10-10")
  const entries = [repeated, { ...repeated }, entry(4, "2026-10-09")]
  assert.deepEqual(selectInitialHighlightIds(entries), [5, 4])
  assert.deepEqual(projectRecentEntries(entries, [5]), [entries[2]])
})

test("projects no entry into both Highlights and Recent", () => {
  const entries = [entry(1, "2026-10-10"), entry(2, "2026-10-09"), entry(3, "2026-10-08")]
  assert.deepEqual(projectRecentEntries(entries, [1, 3]), [entries[1]])
})

test("backfill preserves surviving slots and uses the same soft preferences", () => {
  const survivingHighlights = [
    entry(1, "2026-10-10", { feed: { id: 1, category: { id: 1 } } }),
    entry(2, "2026-10-09", { feed: { id: 2, category: { id: 2 } } }),
  ]
  const recent = [
    entry(3, "2026-10-08", { feed: { id: 1, category: { id: 3 } } }),
    entry(4, "2026-10-07", { feed: { id: 3, category: { id: 1 } } }),
    entry(5, "2026-10-06", { feed: { id: 4, category: { id: 4 } } }),
  ]
  assert.equal(selectBackfillCandidate(recent, survivingHighlights), recent[2])

  const noDiversityAvailable = [
    entry(7, "2026-10-09", { feed: { id: 1, category: { id: 1 } } }),
    entry(6, "2026-10-10", { feed: { id: 2, category: { id: 2 } } }),
  ]
  assert.equal(
    selectBackfillCandidate(noDiversityAvailable, survivingHighlights),
    noDiversityAvailable[1],
  )
})
