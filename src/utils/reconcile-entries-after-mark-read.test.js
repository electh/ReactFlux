import assert from "node:assert/strict"
import { test } from "node:test"

const { default: reconcileEntriesAfterMarkRead } = await import(
  new URL("reconcile-entries-after-mark-read.js", import.meta.url)
)

const entries = [
  { id: 1, status: "unread", starred: false, title: "A" },
  { id: 2, status: "unread", starred: false, title: "B" },
]

test("unread reconciliation removes marked entries", () => {
  assert.deepEqual(reconcileEntriesAfterMarkRead(entries, [1], "unread"), [entries[1]])
})

test("all reconciliation retains marked entries and updates their read status", () => {
  assert.deepEqual(reconcileEntriesAfterMarkRead(entries, [1], "all"), [
    { ...entries[0], status: "read" },
    entries[1],
  ])
})

test("starred reconciliation retains marked starred entries and updates their status", () => {
  const starredEntries = [{ ...entries[0], starred: true }]
  assert.deepEqual(reconcileEntriesAfterMarkRead(starredEntries, [1], "starred"), [
    { ...starredEntries[0], status: "read" },
  ])
})

test("only marked entries change", () => {
  const unrelatedEntry = { ...entries[1], nested: { unchanged: true } }
  const result = reconcileEntriesAfterMarkRead([entries[0], unrelatedEntry], [1], "all")

  assert.deepEqual(result, [{ ...entries[0], status: "read" }, unrelatedEntry])
  assert.strictEqual(result[1], unrelatedEntry)
})

test("multiple successful batches reconcile incrementally", () => {
  const afterFirstBatch = reconcileEntriesAfterMarkRead(entries, [1], "unread")
  const afterSecondBatch = reconcileEntriesAfterMarkRead(afterFirstBatch, [2], "unread")

  assert.deepEqual(afterFirstBatch, [entries[1]])
  assert.deepEqual(afterSecondBatch, [])
})

test("empty marked IDs are a no-op", () => {
  assert.strictEqual(reconcileEntriesAfterMarkRead(entries, [], "unread"), entries)
})

test("duplicate marked IDs are safe", () => {
  assert.deepEqual(reconcileEntriesAfterMarkRead(entries, [1, 1, 1], "unread"), [entries[1]])
})
