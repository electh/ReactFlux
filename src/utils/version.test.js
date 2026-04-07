/* eslint-disable import/extensions */
import assert from "node:assert/strict"
import test from "node:test"

import compareVersions, { compareBuildVersions, parseBuildVersion } from "./version.js"

test("compareVersions preserves existing dotted numeric behavior", () => {
  assert.equal(compareVersions("2.2.8", "2.2.8"), 0)
  assert.equal(compareVersions("2.2.9", "2.2.8"), 1)
  assert.equal(compareVersions("2.2.7", "2.2.8"), -1)
})

test("parseBuildVersion parses canonical build versions", () => {
  assert.deepEqual(parseBuildVersion("20260401.05"), {
    datePart: "20260401",
    sequencePart: 5,
  })
  assert.equal(parseBuildVersion("2026.04.01"), null)
})

test("compareBuildVersions sorts later same-day builds after earlier ones", () => {
  assert.equal(compareBuildVersions("20260401.05", "20260401.06"), -1)
  assert.equal(compareBuildVersions("20260401.10", "20260401.06"), 1)
})

test("compareBuildVersions sorts later dates after earlier dates", () => {
  assert.equal(compareBuildVersions("20260401.99", "20260402.01"), -1)
  assert.equal(compareBuildVersions("20260403.01", "20260402.99"), 1)
})

test("compareBuildVersions returns null for invalid input", () => {
  assert.equal(compareBuildVersions("dev", "20260401.05"), null)
})
