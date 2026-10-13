import assert from "node:assert/strict"
import test from "node:test"

const {
  createHomeEditorialSession,
  createHomeSessionKey,
  projectHomeSession,
  transitionHomeSession,
} = await import(new URL("home-editorial-session.js", import.meta.url))

const entry = (id, time, feedId = id, status = "unread") => ({
  id,
  status,
  published_at: `2026-10-${String(time).padStart(2, "0")}T00:00:00Z`,
  feed: { id: feedId, category: { id: feedId } },
})
const loaded = [entry(1, 12), entry(2, 11), entry(3, 10), entry(4, 9), entry(5, 8)]
const key = createHomeSessionKey({
  identityKey: "server:user",
  showHiddenFeeds: false,
  pageSize: 5,
  sessionRevision: 1,
})
const start = (entries = loaded) =>
  createHomeEditorialSession({ requestKey: key, sessionRevision: 1, entries })
const event = (entryId, targetStatus, outcome, previousStatus = "unread", sessionRevision = 1) => ({
  entryIds: [entryId],
  previousStatuses: { [entryId]: previousStatus },
  targetStatus,
  outcome,
  sessionRevision,
})

test("home session key ignores refresh generation", () => {
  const fields = {
    identityKey: "server:user",
    showHiddenFeeds: false,
    pageSize: 5,
    sessionRevision: 1,
  }
  assert.equal(
    createHomeSessionKey({ ...fields, articleListRevision: 1 }),
    createHomeSessionKey({ ...fields, articleListRevision: 9 }),
  )
})

test("keeps placement while a read is pending", () => {
  const pending = transitionHomeSession(start(), event(1, "read", "intent"), loaded)
  assert.deepEqual(
    projectHomeSession(
      pending,
      loaded.map((item) => (item.id === 1 ? { ...item, status: "read" } : item)),
    ).highlightIds,
    [1, 2, 3],
  )
})

test("commits exactly one Primary slot backfill only after confirmed read", () => {
  const pending = transitionHomeSession(start(), event(1, "read", "intent"), loaded)
  const confirmed = transitionHomeSession(
    pending,
    event(1, "read", "confirmed"),
    loaded.map((item) => (item.id === 1 ? { ...item, status: "read" } : item)),
  )
  assert.deepEqual(confirmed.highlightIds, [4, 2, 3])
})

test("commits exactly one Secondary slot backfill", () => {
  const confirmed = transitionHomeSession(
    start(),
    event(2, "read", "confirmed"),
    loaded.map((item) => (item.id === 2 ? { ...item, status: "read" } : item)),
  )
  assert.deepEqual(confirmed.highlightIds, [1, 4, 3])
})

test("batched reads backfill each vacancy against surviving Highlights", () => {
  const confirmed = transitionHomeSession(
    start(),
    {
      ...event(1, "read", "confirmed"),
      entryIds: [1, 2],
      previousStatuses: { 1: "unread", 2: "unread" },
    },
    loaded.map((item) => ([1, 2].includes(item.id) ? { ...item, status: "read" } : item)),
  )
  assert.deepEqual(confirmed.highlightIds, [4, 5, 3])
})

test("candidate absent from loaded Recent leaves a vacancy", () => {
  const confirmed = transitionHomeSession(
    start(loaded.slice(0, 3)),
    event(1, "read", "confirmed"),
    loaded.slice(0, 3),
  )
  assert.deepEqual(confirmed.highlightIds, [null, 2, 3])
  assert.deepEqual(
    projectHomeSession(
      confirmed,
      loaded.slice(0, 3).map((item) => (item.id === 1 ? { ...item, status: "read" } : item)),
    ).highlightIds,
    [null, 2, 3],
  )
})

test("vacant Secondary slot keeps Primary and the other Secondary in place", () => {
  const confirmed = transitionHomeSession(
    start(loaded.slice(0, 3)),
    event(2, "read", "confirmed"),
    loaded.slice(0, 3).map((item) => (item.id === 2 ? { ...item, status: "read" } : item)),
  )
  assert.deepEqual(confirmed.highlightIds, [1, null, 3])
  assert.deepEqual(
    projectHomeSession(
      confirmed,
      loaded.slice(0, 3).map((item) => (item.id === 2 ? { ...item, status: "read" } : item)),
    ).highlightIds,
    [1, null, 3],
  )
})

test("failed read retains the same projection after rollback", () => {
  const pending = transitionHomeSession(start(), event(1, "read", "intent"), loaded)
  const failed = transitionHomeSession(pending, event(1, "read", "rejected"), loaded)
  assert.deepEqual(failed.highlightIds, [1, 2, 3])
  assert.deepEqual(projectHomeSession(failed, loaded).highlightIds, [1, 2, 3])
})

test("repeated status toggles retain the original placement until the latest settlement", () => {
  const reading = transitionHomeSession(start(), event(1, "read", "intent"), loaded)
  const unreadIntent = transitionHomeSession(reading, event(1, "unread", "intent", "read"), loaded)
  const oldReadSettlement = transitionHomeSession(
    unreadIntent,
    event(1, "read", "confirmed"),
    loaded,
  )
  assert.deepEqual(
    projectHomeSession(
      oldReadSettlement,
      loaded.map((item) => (item.id === 1 ? { ...item, status: "unread" } : item)),
    ).highlightIds,
    [1, 2, 3],
  )
  const settled = transitionHomeSession(
    oldReadSettlement,
    event(1, "unread", "confirmed", "read"),
    loaded,
  )
  assert.deepEqual(settled.highlightIds, [1, 2, 3])
})

test("rejected unread reversal applies earlier confirmed read and backfills", () => {
  const reading = transitionHomeSession(start(), event(1, "read", "intent"), loaded)
  const reversing = transitionHomeSession(reading, event(1, "unread", "intent", "read"), loaded)
  const readConfirmed = transitionHomeSession(
    reversing,
    { ...event(1, "read", "confirmed"), pendingEntryIds: [1] },
    loaded,
  )
  assert.deepEqual(readConfirmed.highlightIds, [1, 2, 3])
  assert.equal(readConfirmed.pendingStatusById[1].confirmedStatus, "read")
  assert.deepEqual(projectHomeSession(readConfirmed, loaded).highlightIds, [1, 2, 3])

  const rolledBack = loaded.map((item) => (item.id === 1 ? { ...item, status: "read" } : item))
  const final = transitionHomeSession(
    readConfirmed,
    { ...event(1, "unread", "rejected", "read"), pendingEntryIds: [] },
    rolledBack,
  )
  assert.deepEqual(final.highlightIds, [4, 2, 3])
  assert.deepEqual(final.pendingStatusById, {})
  assert.deepEqual(projectHomeSession(final, rolledBack).highlightIds, [4, 2, 3])
  assert.equal(projectHomeSession(final, rolledBack).recentIds.includes(1), false)
})

test("pending unread reversal is not a backfill candidate before its mutation succeeds", () => {
  const initial = start()
  const readingRecentEntry = transitionHomeSession(initial, event(4, "read", "intent"), loaded)
  const reversingRecentEntry = transitionHomeSession(
    readingRecentEntry,
    event(4, "unread", "intent", "read"),
    loaded,
  )
  const readConfirmedUnreadPending = transitionHomeSession(
    reversingRecentEntry,
    { ...event(4, "read", "confirmed"), pendingEntryIds: [4] },
    loaded,
  )
  assert.equal(readConfirmedUnreadPending.pendingStatusById[4].confirmedStatus, "read")

  const afterAnotherHighlightRead = transitionHomeSession(
    readConfirmedUnreadPending,
    event(2, "read", "confirmed"),
    loaded.map((item) => (item.id === 2 ? { ...item, status: "read" } : item)),
  )

  assert.deepEqual(afterAnotherHighlightRead.highlightIds, [1, 5, 3])
})

test("confirmed mark-unread inserts an already-loaded entry only into Recent", () => {
  const readEntry = entry(6, 13, 6, "read")
  const session = start([...loaded, readEntry])
  const pending = transitionHomeSession(session, event(6, "unread", "intent", "read"), [
    ...loaded,
    readEntry,
  ])
  assert.equal(
    projectHomeSession(pending, [...loaded, { ...readEntry, status: "unread" }]).recentIds.includes(
      6,
    ),
    false,
  )
  const confirmed = transitionHomeSession(pending, event(6, "unread", "confirmed", "read"), [
    ...loaded,
    { ...readEntry, status: "unread" },
  ])
  assert.deepEqual(confirmed.highlightIds, [1, 2, 3])
  assert.deepEqual(
    projectHomeSession(confirmed, [...loaded, { ...readEntry, status: "unread" }]).recentIds,
    [6, 4, 5],
  )
})

test("unloaded mark-unread does not add an article object or trigger an entry fetch", () => {
  const session = transitionHomeSession(start(), event(99, "unread", "confirmed", "read"), loaded)
  assert.deepEqual(projectHomeSession(session, loaded).recentIds, [4, 5])
  assert.equal(session.entries, undefined)
})

test("star changes never alter highlight ids", () => {
  const session = transitionHomeSession(
    start(),
    { ...event(1, "starred", "confirmed"), targetStatus: "starred" },
    loaded,
  )
  assert.deepEqual(session.highlightIds, [1, 2, 3])
})

test("session identity or visibility change discards old highlights", () => {
  assert.notEqual(
    key,
    createHomeSessionKey({
      identityKey: "other",
      showHiddenFeeds: false,
      pageSize: 5,
      sessionRevision: 1,
    }),
  )
  assert.notEqual(
    key,
    createHomeSessionKey({
      identityKey: "server:user",
      showHiddenFeeds: true,
      pageSize: 5,
      sessionRevision: 1,
    }),
  )
})

test("stale status settlement cannot mutate the current Home session", () => {
  const session = start()
  assert.equal(
    transitionHomeSession(session, event(1, "read", "confirmed", "unread", 0), loaded),
    session,
  )
})
