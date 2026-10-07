import assert from "node:assert/strict"
import { appendFile, copyFile, cp, mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import {
  calculateHash,
  FONT_FAMILIES,
  FONT_LIMITS,
  inspectWoff2,
  localizeGoogleFontCss,
  validateFontAssets,
  validateRemoteUrl,
} from "./font-assets.js"

const { dirname, join } = path
const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function createWoff2Header(length = 64) {
  const buffer = Buffer.alloc(length)
  buffer.write("wOF2", 0, "ascii")
  buffer.writeUInt32BE(0x00_01_00_00, 4)
  buffer.writeUInt32BE(length, 8)
  buffer.writeUInt16BE(1, 12)
  buffer.writeUInt16BE(0, 14)
  buffer.writeUInt32BE(128, 16)
  buffer.writeUInt32BE(length - 48, 20)
  return buffer
}

function createGoogleFontCss(fontConfig, hostname = "fonts.gstatic.com") {
  return ["latin", "latin-ext", "cyrillic"]
    .map(
      (subset) => `/* ${subset} */
@font-face {
  font-family: '${fontConfig.name}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://${hostname}/s/example/${subset}.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}`,
    )
    .join("\n")
}

test("calculateHash returns a full SHA-256 digest", () => {
  assert.equal(
    calculateHash(Buffer.from("ReactFlux")),
    "76cfda6238d9b7cbea304435784d8ab3a770b23e18bfed123d75a6f668c0e91b",
  )
})

test("inspectWoff2 validates the fixed header", () => {
  const buffer = createWoff2Header()
  assert.equal(inspectWoff2(buffer).length, buffer.length)

  const truncated = Buffer.from(buffer)
  truncated.writeUInt32BE(buffer.length + 1, 8)
  assert.throws(() => inspectWoff2(truncated), /does not match/)

  const wrongSignature = Buffer.from(buffer)
  wrongSignature.write("HTML", 0, "ascii")
  assert.throws(() => inspectWoff2(wrongSignature), /signature/)

  const expansionBomb = Buffer.from(buffer)
  expansionBomb.writeUInt32BE(FONT_LIMITS.sfntBytesMax + 1, 16)
  assert.throws(() => inspectWoff2(expansionBomb), /expands to/)
})

test("localizeGoogleFontCss accepts only expected Google font URLs", () => {
  const fontConfig = FONT_FAMILIES[0]
  const localized = localizeGoogleFontCss(createGoogleFontCss(fontConfig), fontConfig)

  assert.equal(localized.fonts.length, 3)
  assert.match(localized.css, /\.\.\/fonts\/fira-sans\/latin\.woff2/)
  assert.doesNotMatch(localized.css, /https:/)

  assert.throws(
    () => localizeGoogleFontCss(createGoogleFontCss(fontConfig, "example.com"), fontConfig),
    /fonts\.gstatic\.com/,
  )
})

test("validateRemoteUrl rejects non-HTTPS and credentialed URLs", () => {
  assert.equal(
    validateRemoteUrl("https://fonts.gstatic.com/s/example/font.woff2", "fonts.gstatic.com")
      .hostname,
    "fonts.gstatic.com",
  )
  assert.throws(
    // eslint-disable-next-line unicorn/prefer-https -- Intentional insecure test input.
    () => validateRemoteUrl("http://fonts.gstatic.com/font.woff2", "fonts.gstatic.com"),
    /HTTPS/,
  )
  assert.throws(
    () => validateRemoteUrl("https://user@fonts.gstatic.com/font.woff2", "fonts.gstatic.com"),
    /credentials/,
  )
})

test("validateFontAssets rejects modified immutable TTF content", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "reactflux-font-assets-"))
  const fontsDir = join(tempRoot, "fonts")
  const cssPath = join(tempRoot, "styles", "fonts.css")
  const versionPath = join(fontsDir, "version.json")
  const fontConfig = FONT_FAMILIES[0]
  const ttfBaseline = fontConfig.ttf[0]

  try {
    await Promise.all([
      cp(join(PROJECT_ROOT, "public", "fonts"), fontsDir, { recursive: true }),
      mkdir(dirname(cssPath), { recursive: true }),
    ])
    await copyFile(join(PROJECT_ROOT, "public", "styles", "fonts.css"), cssPath)
    await appendFile(join(fontsDir, fontConfig.dir, ttfBaseline.filename), Buffer.from([0]))

    await assert.rejects(
      validateFontAssets({ cssPath, fontsDir, versionPath }),
      /immutable baseline hash/,
    )
  } finally {
    await rm(tempRoot, { force: true, recursive: true })
  }
})
