import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"

import { commitValidatedUpdate, fetchWithPolicy, installStagedAssets } from "./update-fonts.js"

const { join } = path
const FONT_URL = "https://fonts.gstatic.com/s/example/font.woff2"

function createResponse(body, { contentType = "font/woff2", status = 200 } = {}) {
  return new Response(body, {
    headers: { "Content-Type": contentType },
    status,
  })
}

test("fetchWithPolicy retries transient responses with exponential delays", async () => {
  let calls = 0
  const delays = []
  const result = await fetchWithPolicy(FONT_URL, {
    contentType: "font/woff2",
    expectedHostname: "fonts.gstatic.com",
    fetchImplementation: async () => {
      calls += 1
      return calls < 3
        ? createResponse("unavailable", { status: 503 })
        : createResponse("font-data")
    },
    maxBytes: 64,
    random: () => 0,
    sleepImplementation: async (delay) => {
      delays.push(delay)
    },
  })

  assert.equal(result.toString(), "font-data")
  assert.equal(calls, 3)
  assert.deepEqual(delays, [500, 1000])
})

test("fetchWithPolicy does not retry invalid content", async () => {
  let calls = 0

  await assert.rejects(
    fetchWithPolicy(FONT_URL, {
      contentType: "font/woff2",
      expectedHostname: "fonts.gstatic.com",
      fetchImplementation: async () => {
        calls += 1
        return createResponse("not-a-font", { contentType: "text/html" })
      },
      maxBytes: 64,
      sleepImplementation: async () => {},
    }),
    /Content-Type/,
  )
  assert.equal(calls, 1)
})

test("fetchWithPolicy enforces the streamed byte limit", async () => {
  await assert.rejects(
    fetchWithPolicy(FONT_URL, {
      contentType: "font/woff2",
      expectedHostname: "fonts.gstatic.com",
      fetchImplementation: async () => createResponse("too-large"),
      maxBytes: 4,
      sleepImplementation: async () => {},
    }),
    /byte limit/,
  )
})

test("commitValidatedUpdate does not install when output publication fails", async () => {
  let installed = false

  await assert.rejects(
    commitValidatedUpdate(
      { changed: true },
      {
        installImplementation: async () => {
          installed = true
        },
        writeOutputsImplementation: async () => {
          throw new Error("injected output failure")
        },
      },
    ),
    /injected output failure/,
  )
  assert.equal(installed, false)
})

async function createInstallFixture() {
  const root = await mkdtemp(join(tmpdir(), "reactflux-font-transaction-"))
  const fontsDir = join(root, "public", "fonts")
  const fontsCss = join(root, "public", "styles", "fonts.css")
  const stageRoot = join(root, "stage")
  const stagedFontsDir = join(stageRoot, "fonts")
  const stagedCssPath = join(stageRoot, "fonts.css")

  await Promise.all([
    mkdir(fontsDir, { recursive: true }),
    mkdir(join(root, "public", "styles"), { recursive: true }),
    mkdir(stagedFontsDir, { recursive: true }),
  ])
  await Promise.all([
    writeFile(join(fontsDir, "asset.txt"), "old-font"),
    writeFile(fontsCss, "old-css"),
    writeFile(join(stagedFontsDir, "asset.txt"), "new-font"),
    writeFile(stagedCssPath, "new-css"),
  ])

  return { fontsCss, fontsDir, root, stageRoot, stagedCssPath, stagedFontsDir }
}

for (let failurePoint = 1; failurePoint <= 4; failurePoint += 1) {
  test(`installStagedAssets rolls back rename failure ${failurePoint}`, async () => {
    const fixture = await createInstallFixture()
    let renameCalls = 0

    try {
      await assert.rejects(
        installStagedAssets({
          ...fixture,
          renameImplementation: async (...arguments_) => {
            renameCalls += 1
            if (renameCalls === failurePoint) {
              throw new Error(`injected rename failure ${failurePoint}`)
            }
            return rename(...arguments_)
          },
        }),
        new RegExp(`injected rename failure ${failurePoint}`),
      )
      assert.equal(await readFile(join(fixture.fontsDir, "asset.txt"), "utf8"), "old-font")
      assert.equal(await readFile(fixture.fontsCss, "utf8"), "old-css")
    } finally {
      await rm(fixture.root, { force: true, recursive: true })
    }
  })
}
