export const fixtureFeed = {
  id: 1,
  icon: { icon_id: 991 },
  title: "Local routing fixture",
  site_url: "https://example.invalid",
  feed_url: "https://example.invalid/feed",
  category: { id: 1, title: "Local category" },
}

export const routeEntries = [101, 202].map((id) => ({
  id,
  title: `Home route article ${id}`,
  published_at: "2026-10-12T10:00:00Z",
  created_at: "2026-10-12T10:00:00Z",
  changed_at: "2026-10-12T10:00:00Z",
  status: "unread",
  starred: false,
  url: `https://example.invalid/${id}`,
  hash: `route-${id}`,
  content: `<p>Local deterministic reader content for article ${id}.</p>`,
  reading_time: 1,
  comments_url: "",
  enclosures: [],
  feed: fixtureFeed,
}))

// Deliberately unsorted, with a duplicate and a read record: only entry ID dedupes Home.
const highlightEntry = (id, hour, feedId = 1, categoryId = 1, image = false) => ({
  ...routeEntries[0],
  id,
  title: `Highlight article ${id}`,
  published_at: `2026-10-12T${hour}:00:00Z`,
  url: `https://example.invalid/${id}`,
  hash: `highlight-${id}`,
  content: `<p>Local deterministic reader content for article ${id}.</p>${image ? `<img src="${globalThis.location.origin}/scripts/tests/fixtures/valid-hero.svg" width="960" height="540" />` : ""}`,
  feed: {
    ...fixtureFeed,
    id: feedId,
    title: `Source ${feedId}`,
    category: { id: categoryId, title: `Category ${categoryId}` },
  },
})

const primary = highlightEntry(101, "12", 1, 1, true)
const secondary1 = { ...highlightEntry(202, "11", 2, 2), starred: true }
const secondary2 = highlightEntry(303, "10", 3, 3, true)
export const highlightFixtures = {
  image: [
    secondary2,
    primary,
    secondary1,
    highlightEntry(404, "09"),
    { ...primary },
    { ...highlightEntry(505, "13"), status: "read" },
  ],
  textOnly: [highlightEntry(101, "12"), secondary1, secondary2],
  two: [primary, secondary1],
  one: [primary],
  shared: [highlightEntry(101, "12"), highlightEntry(202, "11"), highlightEntry(303, "10")],
}

// Unique timestamps make the existing overlap cursor deterministic across large pages.
export const paginationEntries = (count, offset = 0) =>
  Array.from({ length: count }, (_, index) => {
    const position = offset + index
    const id = 10_000 + position
    return {
      ...routeEntries[0],
      id,
      title: "Shared editorial title",
      hash: "shared-pagination-hash",
      url: "https://example.invalid/shared-pagination-url",
      published_at: new Date(Date.UTC(2026, 9, 12, 12) - position * 60_000).toISOString(),
      content: `<p>Local pagination article ${id}.</p>`,
    }
  })
