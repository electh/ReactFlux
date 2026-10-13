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

export const emptyHomeFixtures = {
  zeroUnread: { entries: [], total: 0 },
  emptyPageWithMore: {
    entries: [],
    total: 12,
    nextPage: paginationEntries(12),
  },
}

export const phase2cEditorialHomeMatrix = {
  viewports: [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 884, height: 1104 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ],
  themes: ["light", "dark"],
  automatedGates: [
    "HARNESS_SCENARIO_MATRIX_COMPLETE",
    "HOME_NO_OVERFLOW",
    "HOME_SECTION_HIERARCHY",
    "HOME_PRIMARY_TEXT_ONLY",
    "HOME_SECONDARY_LAYOUT",
    "HOME_RECENT_GRID",
    "HOME_EMPTY_RECENT",
    "HOME_LOADING",
    "HOME_REFRESH_ERROR_WITH_CONTENT",
    "HOME_LIGHT",
    "HOME_DARK",
    "HOME_IDENTITY_FAILURE_RECOVERY",
    "HOME_LAST_READ_TRANSITIONS_TO_TUDO_EM_DIA",
    "HOME_READ_FAILURE_DOES_NOT_ZERO_TOTAL",
    "HOME_MARK_UNREAD_RECONCILES_TOTAL",
    "HOME_UNLOADED_MARK_UNREAD_REENABLES_PAGINATION",
    "HOME_TOTAL_RECONCILIATION_STALE_SESSION_PROTECTED",
  ],
  scenarios: [
    {
      id: "THREE_PLUS_UNREAD_WITH_IMAGE_PRIMARY",
      covers: ["HOME_PRIMARY_NEWEST", "HOME_MAX_THREE_HIGHLIGHTS"],
      fixtures: ["highlightFixtures.image"],
    },
    {
      id: "THREE_PLUS_UNREAD_WITH_TEXT_ONLY_PRIMARY",
      covers: ["HOME_PRIMARY_TEXT_ONLY", "HOME_MAX_THREE_HIGHLIGHTS"],
      fixtures: ["highlightFixtures.textOnly"],
    },
    {
      id: "TWO_UNREAD",
      covers: ["HOME_LOW_UNREAD_COUNTS"],
      fixtures: ["highlightFixtures.two"],
    },
    {
      id: "ONE_UNREAD",
      covers: ["HOME_LOW_UNREAD_COUNTS"],
      fixtures: ["highlightFixtures.one"],
    },
    {
      id: "ZERO_UNREAD",
      covers: ["HOME_ZERO_UNREAD"],
      fixtures: ["emptyHomeFixtures.zeroUnread"],
    },
    {
      id: "MIXED_IMAGE_AND_TEXT_ONLY",
      covers: ["HOME_PRIMARY_NEWEST", "HOME_SECONDARIES_BALANCED_ORDER"],
      fixtures: ["highlightFixtures.image"],
    },
    {
      id: "DIVERSE_SOURCE_AND_CATEGORY",
      covers: ["HOME_SECONDARIES_BALANCED_ORDER"],
      fixtures: ["highlightFixtures.image"],
    },
    {
      id: "SAME_SOURCE_AND_CATEGORY",
      covers: ["HOME_SECONDARIES_BALANCED_ORDER"],
      fixtures: ["highlightFixtures.shared"],
    },
    { id: "LOADING", covers: ["HOME_LOADING"], fixtures: ["deferredArticleQuery"] },
    { id: "INITIAL_ERROR", covers: ["HOME_INITIAL_ERROR"], fixtures: ["queryError"] },
    {
      id: "REFRESH_ERROR_RETAINS_CONTENT",
      covers: ["HOME_REFRESH_ERROR_WITH_CONTENT"],
      fixtures: ["highlightFixtures.image", "articleFailure"],
    },
    { id: "LOAD_MORE_ERROR", covers: ["HOME_LOAD_MORE_ERROR"], fixtures: ["failPagination"] },
    {
      id: "AFTER_READ_BACKFILL",
      covers: ["HOME_REJECTED_UNREAD_REVERSAL_RECONCILES_CONFIRMED_READ"],
      fixtures: ["deferredFirstStatusMutation", "rejectStatusMutationCall"],
    },
    {
      id: "AFTER_MARK_UNREAD",
      covers: [
        "HOME_MARK_UNREAD_RECONCILES_TOTAL",
        "HOME_UNLOADED_MARK_UNREAD_REENABLES_PAGINATION",
      ],
      fixtures: ["unloadedStatus"],
    },
    {
      id: "AFTER_STAR_AND_UNSTAR",
      covers: ["HOME_HIGHLIGHT_ACTIONS"],
      fixtures: ["starMutationRequests"],
    },
  ],
  manualGates: [
    "EDITORIAL_HIERARCHY_CLEAR",
    "PRIMARY_NOT_OVERSIZED",
    "SECONDARIES_BALANCED",
    "RECENT_VISIBLE_AS_CONTINUATION",
    "TEXT_ONLY_PRIMARY_FEELS_INTENTIONAL",
    "NO_GLASS_CONTENT_SURFACES",
    "OLED_SURFACE_SEPARATION",
    "NO_LAYOUT_JUMP_ON_READER_RETURN",
    "NO_UNEXPECTED_RECOMPOSE",
    "TOUCH_TARGETS_USABLE",
    "MOBILE_SINGLE_PANE",
  ].map((name) => ({ name, status: "MANUAL_REQUIRED" })),
}
