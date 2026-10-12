export const fixtureFeed = {
  id: 1,
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
