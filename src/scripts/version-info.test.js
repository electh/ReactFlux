/* eslint-disable import/extensions */
import assert from "node:assert/strict"
import test from "node:test"

import { createVersionInfo, formatBuildVersion, normalizeBuildDate } from "./version-info.js"

test("normalizeBuildDate accepts canonical build dates", () => {
  assert.equal(normalizeBuildDate("2026-04-01"), "2026-04-01")
  assert.equal(normalizeBuildDate("20260401"), null)
})

test("formatBuildVersion zero pads the build sequence", () => {
  assert.equal(formatBuildVersion("2026-04-01", 5), "20260401.05")
  assert.equal(formatBuildVersion("2026-04-01", 12), "20260401.12")
})

test("createVersionInfo uses CI metadata when provided", () => {
  const versionInfo = createVersionInfo({
    VERSION_BUILD_DATE: "2026-04-01",
    VERSION_BUILD_SEQUENCE: "5",
    VERSION_CHANNEL: "main",
    VERSION_GIT_BRANCH: "main",
    VERSION_IS_CANONICAL: "true",
  })

  assert.equal(versionInfo.buildDate, "2026-04-01")
  assert.equal(versionInfo.buildSequence, 5)
  assert.equal(versionInfo.buildVersion, "20260401.05")
  assert.equal(versionInfo.channel, "main")
  assert.equal(versionInfo.gitBranch, "main")
  assert.equal(versionInfo.isCanonical, true)
})

test("createVersionInfo produces a valid fallback build version locally", () => {
  const versionInfo = createVersionInfo({})

  assert.match(versionInfo.buildDate, /^\d{4}-\d{2}-\d{2}$/)
  assert.match(versionInfo.buildVersion, /^\d{8}\.\d{2,}$/)
  assert.equal(Number.isInteger(versionInfo.buildSequence), true)
  assert.equal(versionInfo.isCanonical, false)
})
