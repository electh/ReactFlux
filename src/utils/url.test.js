import assert from "node:assert/strict"
import test from "node:test"

// eslint-disable-next-line import/extensions -- Native node:test requires the module extension.
import { buildEntryDetailPath, extractBasePath, isEntryDetailPath } from "./url.js"

test("builds root reader links as slash-entry-id", () => {
  assert.equal(buildEntryDetailPath("/", 101), "/entry/101")
  assert.equal(buildEntryDetailPath("", 202), "/entry/202")
})

test("extracts slash as the root return path", () => {
  assert.equal(extractBasePath("/entry/101"), "/")
  assert.equal(extractBasePath("/"), "/")
})

test("keeps all feed category and view detail paths unchanged", () => {
  for (const basePath of ["/all", "/today", "/starred", "/history", "/feed/12", "/category/7"]) {
    assert.equal(buildEntryDetailPath(basePath, 101), `${basePath}/entry/101`)
    assert.equal(extractBasePath(`${basePath}/entry/101`), basePath)
    assert.equal(isEntryDetailPath(`${basePath}/entry/101`), true)
    assert.equal(isEntryDetailPath(basePath), false)
  }
})

test("closes a root detail route back to slash", () => {
  assert.equal(isEntryDetailPath("/entry/202"), true)
  const returnPath = extractBasePath("/entry/202")
  assert.equal(returnPath, "/")
  assert.equal(isEntryDetailPath(returnPath), false)
  assert.equal(buildEntryDetailPath(returnPath, 101), "/entry/101")
})
