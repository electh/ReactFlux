import assert from "node:assert/strict"
import test from "node:test"

const { publishEntryStatusMutationEvent, subscribeEntryStatusMutationEvents } = await import(
  new URL("entry-status-mutation-events.js", import.meta.url)
)

test("publishes intent before optimistic store change", () => {
  let status = "unread"
  const observed = []
  const unsubscribe = subscribeEntryStatusMutationEvents((event) =>
    observed.push([event.outcome, status]),
  )
  publishEntryStatusMutationEvent(
    {
      entryIds: [1],
      previousStatuses: { 1: "unread" },
      targetStatus: "read",
      outcome: "intent",
      sessionRevision: 1,
    },
    1,
  )
  status = "read"
  assert.deepEqual(observed, [["intent", "unread"]])
  unsubscribe()
})

test("publishes confirmed success and rejection with entry ids", () => {
  const observed = []
  const unsubscribe = subscribeEntryStatusMutationEvents((event) => observed.push(event))
  for (const outcome of ["confirmed", "rejected"]) {
    publishEntryStatusMutationEvent(
      {
        entryIds: [1, 2],
        previousStatuses: { 1: "unread", 2: "unread" },
        targetStatus: "read",
        outcome,
        sessionRevision: 1,
      },
      1,
    )
  }
  assert.deepEqual(
    observed.map(({ outcome, entryIds }) => [outcome, entryIds]),
    [
      ["confirmed", [1, 2]],
      ["rejected", [1, 2]],
    ],
  )
  unsubscribe()
})

test("ignores settlement from an obsolete data session", () => {
  let calls = 0
  const unsubscribe = subscribeEntryStatusMutationEvents(() => {
    calls += 1
  })
  publishEntryStatusMutationEvent(
    {
      entryIds: [1],
      previousStatuses: { 1: "unread" },
      targetStatus: "read",
      outcome: "confirmed",
      sessionRevision: 1,
    },
    2,
  )
  assert.equal(calls, 0)
  unsubscribe()
})
