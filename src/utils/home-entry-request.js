// Page and count reconciliation share this fixed Home query and visibility policy.
// Named contract shared by the page adapter and pure request tests.
// eslint-disable-next-line import/prefer-default-export
export const buildHomeEntryRequest = ({ pageSize, showHiddenFeeds, cursor }) => ({
  status: "unread",
  order: "published_at",
  direction: "desc",
  limit: pageSize,
  globally_visible: !showHiddenFeeds,
  ...(cursor !== undefined && cursor !== null && { published_before: cursor }),
})
