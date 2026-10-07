import assert from "node:assert/strict"
import { test } from "node:test"

import { validatePullRequestDiff } from "./validate-fonts.js"

const VALID_DIFF = `M\tpublic/fonts/version.json
M\tpublic/styles/fonts.css
M\tpublic/fonts/fira-sans/example.woff2`

test("validatePullRequestDiff accepts generated font asset paths", () => {
  assert.deepEqual(validatePullRequestDiff(VALID_DIFF), [
    "public/fonts/fira-sans/example.woff2",
    "public/fonts/version.json",
    "public/styles/fonts.css",
  ])
})

test("validatePullRequestDiff rejects immutable and unrelated paths", () => {
  assert.throws(
    () => validatePullRequestDiff(`${VALID_DIFF}\nM\tpublic/fonts/fira-sans/example.ttf`),
    /forbidden path/,
  )
  assert.throws(
    () => validatePullRequestDiff(`${VALID_DIFF}\nM\tscripts/font-baseline.json`),
    /forbidden path/,
  )
})

test("validatePullRequestDiff requires generated metadata", () => {
  assert.throws(
    () => validatePullRequestDiff("M\tpublic/fonts/fira-sans/example.woff2"),
    /must include version\.json/,
  )
  assert.throws(() => validatePullRequestDiff(""), /no changed files/)
})
